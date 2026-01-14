import { io } from 'socket.io-client'; // Import Client, not Server
import { routesData, activeBuses } from './src/data/routesData.js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Connect to the MAIN Server (Localhost or Production)
// Use the variable from .env, or default to local for testing
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
console.log(`🔌 Connecting Simulator to: ${SERVER_URL}`);

const socket = io(SERVER_URL);

// bus state tracking
const busStates = new Map();

// Initialize bus states (Local state for the bot)
activeBuses.forEach(bus => {
  const route = routesData.find(r => r.id === bus.routeId);
  if (route) {
    busStates.set(bus.busId, {
      busId: bus.busId,
      routeId: bus.routeId,
      routeName: route.name, // Added for registration
      currentIndex: bus.startIndex || 0,
      direction: 'forward',
      route: route,
      currentPosition: route.path[bus.startIndex || 0],
      speed: bus.speed || 50,
      passengers: Math.floor(Math.random() * 30) + 5,
      type: bus.type || route.type || 'bus'
    });
  }
});

// --- CONNECTION EVENTS ---

socket.on('connect', () => {
  console.log(`✅ Simulator Connected! ID: ${socket.id}`);
  
  // 2. Register all ghost buses with the main server
  busStates.forEach((state) => {
    console.log(`✨ Registering bus: ${state.busId} on route ${state.routeId}`);
    
    // Tell the server this driver is "Active"
    socket.emit('driver_started', {
      busId: state.busId,
      routeName: state.routeName,
      routeId: state.routeId,
      type: state.type
    });
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from Main Server');
});

// --- MOVEMENT LOGIC ---

function simulateBusMovement() {
  if (!socket.connected) return;

  busStates.forEach((state, busId) => {
    const route = state.route;
    let nextIndex;

    // Determine next position
    if (state.direction === 'forward') {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= route.path.length) {
        state.direction = 'backward';
        nextIndex = route.path.length - 2;
      }
    } else {
      nextIndex = state.currentIndex - 1;
      if (nextIndex < 0) {
        state.direction = 'forward';
        nextIndex = 1;
      }
    }

    // Safety check for undefined path points
    if (!route.path[nextIndex]) return;

    state.currentIndex = nextIndex;
    state.currentPosition = route.path[nextIndex];

    // Randomize passengers slightly
    if (Math.random() > 0.7) {
      state.passengers = Math.max(0, state.passengers + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
    }

    // 3. Send Update to Main Server
    // The server will take this and broadcast it to the Frontend
    const updateData = {
      busId: state.busId,
      routeId: state.routeId,
      position: {
        lat: state.currentPosition[0],
        lng: state.currentPosition[1]
      },
      heading: calculateHeading(state),
      speed: state.speed,
      passengers: state.passengers,
      type: state.type,
      timestamp: new Date().toISOString()
    };

    // Emit to server
    socket.emit('driver_location_update', updateData);
    
    // Optional: Log every few updates to avoid console spam
    if (Math.random() > 0.95) {
       console.log(`📍 ${state.busId} moved to [${updateData.position.lat.toFixed(4)}, ${updateData.position.lng.toFixed(4)}]`);
    }
  });
}

function calculateHeading(state) {
  const route = state.route;
  const currentIdx = state.currentIndex;
  const prevIdx = currentIdx - (state.direction === 'forward' ? 1 : -1);
  
  if (prevIdx < 0 || prevIdx >= route.path.length) return 0;
  
  const current = route.path[currentIdx];
  const previous = route.path[prevIdx];
  
  const dLng = current[1] - previous[1];
  const dLat = current[0] - previous[0];
  
  return Math.atan2(dLng, dLat) * (180 / Math.PI);
}

// Start simulation loop (Every 3 seconds)
const SIMULATION_INTERVAL = 3000;
setInterval(simulateBusMovement, SIMULATION_INTERVAL);

console.log(`🤖 Simulator Bot Initialized. Waiting for connection...`);