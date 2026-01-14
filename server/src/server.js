// server/src/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Store active drivers (in-memory, use Redis in production)
const activeDrivers = new Map();

// Store live routes created by drivers (ephemeral)
const activeRoutes = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send currently active live routes to the newly connected client
  if (activeRoutes.size > 0) {
    socket.emit('active_routes', Array.from(activeRoutes.values()));
  }

  // Passenger subscribing to route
  socket.on('subscribe_route', (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`Client ${socket.id} subscribed to route ${routeId}`);
    
    // Send current active drivers on this route
    const driversOnRoute = Array.from(activeDrivers.values()).filter(
      driver => driver.routeId === routeId
    );
    driversOnRoute.forEach(driver => {
      socket.emit('location_update', driver);
    });
  });

  socket.on('unsubscribe_route', (routeId) => {
    socket.leave(`route_${routeId}`);
    console.log(`Client ${socket.id} unsubscribed from route ${routeId}`);
  });

  // Driver starts a live route (create ephemeral route)
  socket.on('driver_started', (payload, callback) => {
    // payload: { busId, routeName, type }
    const routeId = `live_${payload.busId}_${Date.now()}`;
    const route = {
      id: routeId,
      name: payload.routeName || `Live ${payload.busId}`,
      type: payload.type || 'bus',
      color: '#34D399',
      stops: [],
      schedule: { frequency: 'Live' },
      ownerBusId: payload.busId
    };

    activeRoutes.set(routeId, route);

    // Inform all passengers about the new route
    io.emit('new_route', route);

    // Make the driver socket join the route room (optional but useful)
    socket.join(`route_${routeId}`);

    console.log(`➕ Live route created: ${route.name} (${routeId}) by ${payload.busId}`);

    if (typeof callback === 'function') callback({ ok: true, route });
  });

  // Driver location update (REAL GPS DATA)
  socket.on('driver_location_update', (data) => {
    console.log(`📍 Driver ${data.busId} location update:`, {
      lat: data.position.lat.toFixed(6),
      lng: data.position.lng.toFixed(6),
      speed: data.speed
    });

    // Store/update driver info
    activeDrivers.set(data.busId, {
      ...data,
      socketId: socket.id,
      lastUpdate: new Date(),
      isRealDriver: true
    });

    // Broadcast to all passengers watching this route
    io.to(`route_${data.routeId}`).emit('location_update', {
      busId: data.busId,
      routeId: data.routeId,
      position: data.position,
      heading: data.heading,
      speed: data.speed,
      type: data.type,
      passengers: Math.floor(Math.random() * 30) + 10, // Mock passenger count
      isRealDriver: true,
      status: `En route: ${data.startStop} → ${data.endStop}`,
      timestamp: data.timestamp
    });
  });

  // Driver disconnected
  socket.on('driver_disconnected', (data) => {
    console.log(`🛑 Driver ${data.busId} disconnected`);
    
    const driver = activeDrivers.get(data.busId);
    if (driver) {
      // Notify passengers
      io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
        busId: data.busId,
        message: `Bus ${data.busId} has ended their route`
      });
      
      // Remove from active drivers
      activeDrivers.delete(data.busId);

      // If driver owned a live route, remove it and notify clients
      for (const [routeId, route] of activeRoutes.entries()) {
        if (route.ownerBusId === data.busId) {
          activeRoutes.delete(routeId);
          io.emit('route_removed', { id: routeId });
          console.log(`➖ Live route removed: ${route.name} (${routeId})`);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // If this was a driver, clean up
    for (const [busId, driver] of activeDrivers.entries()) {
      if (driver.socketId === socket.id) {
        console.log(`🛑 Driver ${busId} disconnected (socket closed)`);
        io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
          busId: busId,
          message: `Bus ${busId} has ended their route`
        });
        activeDrivers.delete(busId);

        // Also remove any live route owned by this bus
        for (const [routeId, route] of activeRoutes.entries()) {
          if (route.ownerBusId === busId) {
            activeRoutes.delete(routeId);
            io.emit('route_removed', { id: routeId });
            console.log(`➖ Live route removed (socket disconnect): ${route.name} (${routeId})`);
          }
        }

        break;
      }
    }
  });
});

// Initialize seat manager
import { initSeatManager } from './seatManager.js';
initSeatManager(io);

// Export io for simulator
export { io };

// Cleanup stale drivers every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [busId, driver] of activeDrivers.entries()) {
    const timeSinceUpdate = (now - driver.lastUpdate) / 1000; // seconds
    if (timeSinceUpdate > 300) { // 5 minutes
      console.log(`⏰ Removing stale driver: ${busId}`);
      io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
        busId: busId,
        message: `Bus ${busId} connection lost`
      });
      activeDrivers.delete(busId);
    }
  }
}, 300000); // Run every 5 minutes

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for real-time connections`);
  console.log(`Driver tracking enabled 🚌`);
});