// server/src/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; 

// Import Routes & Models
import apiRoutes from './routes/api.js';
import Route from './models/Route.js'; 
import Bus from './models/Bus.js';     
import { initSeatManager } from './seatManager.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*', // Allow all for testing
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// --- 1. DATABASE CONNECTION ---
// We now access the URI safely from the environment variables
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in .env file");
  process.exit(1); // Stop the server if no DB connection string is found
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    loadActiveDrivers(); // Restore drivers on startup
  })
  .catch(err => console.error("❌ DB Connection Error:", err));


// --- 2. IN-MEMORY STATE (The "Fast Lane") ---
const activeDrivers = new Map();
const activeRoutes = new Map();

// Helper: Load "Active" drivers from DB when server restarts
async function loadActiveDrivers() {
  try {
    const savedBuses = await Bus.find({ status: 'active' });
    if (savedBuses.length > 0) {
      console.log(`🔄 Restored ${savedBuses.length} active drivers from Database`);
      
      savedBuses.forEach(b => {
        activeDrivers.set(b.busId, {
          busId: b.busId,
          routeId: b.routeId ? b.routeId.toString() : null,
          position: b.lastPosition,
          lastUpdate: new Date(),
          isRealDriver: true,
          status: 'Restored'
        });
      });
    }
  } catch (err) {
    console.error("Error loading active drivers:", err);
  }
}

// --- 3. SOCKET CONNECTION HANDLING ---
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send currently active live routes to new client
  if (activeRoutes.size > 0) {
    socket.emit('active_routes', Array.from(activeRoutes.values()));
  }

  // Passenger subscribing to route
  socket.on('subscribe_route', (routeId) => {
    socket.join(`route_${routeId}`);
    
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
  });

  // --- DRIVER EVENTS ---

  // Driver starts a live route
  socket.on('driver_started', async (payload, callback) => {
    // payload: { busId, routeName, type, routeId (if existing) }
    
    let routeId = payload.routeId;

    // If no routeId provided, create a live ephemeral route
    if (!routeId) {
      routeId = `live_${payload.busId}_${Date.now()}`;
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
      io.emit('new_route', route);
      console.log(`➕ Live route created: ${routeId}`);
    }

    // 1. Update In-Memory Map
    socket.join(`route_${routeId}`);
    
    // 2. Persist to MongoDB
    try {
      await Bus.findOneAndUpdate(
        { busId: payload.busId },
        { 
          routeId: routeId, 
          status: 'active',
          lastActive: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Error saving driver start:", err);
    }

    if (typeof callback === 'function') callback({ ok: true, route: activeRoutes.get(routeId) });
  });

  // Driver location update (REAL GPS DATA)
  socket.on('driver_location_update', (data) => {
    // 1. Update In-Memory Map (Fast)
    activeDrivers.set(data.busId, {
      ...data,
      socketId: socket.id,
      lastUpdate: new Date(),
      isRealDriver: true
    });

    // 2. Broadcast to passengers (Fast)
    io.to(`route_${data.routeId}`).emit('location_update', {
      ...data,
      isRealDriver: true
    });

    // 3. Save to Database (Fire and Forget - Persistence)
    Bus.updateOne(
      { busId: data.busId }, 
      { 
        lastPosition: data.position,
        lastActive: new Date()
      }
    ).exec();
  });

  // Driver disconnected
  socket.on('driver_disconnected', async (data) => {
    console.log(`🛑 Driver ${data.busId} disconnected`);
    
    // 1. Notify passengers
    const driver = activeDrivers.get(data.busId);
    if (driver) {
      io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
        busId: data.busId,
        message: `Bus ${data.busId} has ended their route`
      });
    }

    // 2. Remove from Memory
    activeDrivers.delete(data.busId);

    // 3. Update Database to 'stopped'
    try {
      await Bus.updateOne({ busId: data.busId }, { status: 'stopped' });
    } catch (err) { console.error(err); }

    // Clean up live routes owned by this driver
    for (const [routeId, route] of activeRoutes.entries()) {
      if (route.ownerBusId === data.busId) {
        activeRoutes.delete(routeId);
        io.emit('route_removed', { id: routeId });
      }
    }
  });

  socket.on('disconnect', async () => {
    // Find if this socket belonged to a driver
    for (const [busId, driver] of activeDrivers.entries()) {
      if (driver.socketId === socket.id) {
        console.log(`🛑 Driver ${busId} socket closed`);
        
        io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
          busId: busId,
          message: `Connection lost`
        });
        
        activeDrivers.delete(busId);
        
        // Update DB
        try {
          await Bus.updateOne({ busId: busId }, { status: 'stopped' });
        } catch (err) { console.error(err); }

        break;
      }
    }
  });
});

// Initialize seat manager
initSeatManager(io);

// Export io for simulator
export { io };

// Cleanup stale drivers every 5 minutes (Syncs with DB)
setInterval(async () => {
  const now = new Date();
  for (const [busId, driver] of activeDrivers.entries()) {
    const timeSinceUpdate = (now - driver.lastUpdate) / 1000;
    if (timeSinceUpdate > 300) { // 5 minutes inactive
      console.log(`⏰ Removing stale driver: ${busId}`);
      
      io.to(`route_${driver.routeId}`).emit('bus_disconnected', {
        busId: busId,
        message: `Bus ${busId} connection timeout`
      });
      
      activeDrivers.delete(busId);

      // Update DB
      try {
        await Bus.updateOne({ busId: busId }, { status: 'stopped' });
      } catch (err) { console.error(err); }
    }
  }
}, 300000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready`);
});