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

// middleware
app.use(cors());
app.use(express.json());

// routes used here
app.use('/api', apiRoutes);

// socket stuff
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe_route', (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`Client ${socket.id} subscribed to route ${routeId}`);
  });

  socket.on('unsubscribe_route', (routeId) => {
    socket.leave(`route_${routeId}`);
    console.log(`Client ${socket.id} unsubscribed from route ${routeId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  // Add this inside your io.on('connection') block

socket.on('driver_location_update', (data) => {
    // 1. (Optional) Save to Database here if you want persistent history
    
    // 2. Broadcast immediately to all 'Passenger' users
    // This sends the data to everyone looking at the map
    io.emit('bus_location_update', data); 
});

socket.on('driver_disconnected', (data) => {
    io.emit('bus_disconnected', { busId: data.busId });
});
});

// Initialize seat manager (imports placed here to avoid circulars)
import { initSeatManager } from './seatManager.js';
initSeatManager(io);

// export the io for simulation (check for error at end)
export { io };

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for real-time connections`);
});