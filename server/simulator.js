import { io } from 'socket.io-client';
import { routesData, activeBuses } from './src/data/routesData.js';
import dotenv from 'dotenv';

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
console.log(`🔌 Connecting Simulator to: ${SERVER_URL}`);

const socket = io(SERVER_URL);

// Helper: Calculate distance (in meters) between two coordinates
function getDistance(coord1, coord2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = coord1[0] * Math.PI / 180;
  const φ2 = coord2[0] * Math.PI / 180;
  const Δφ = (coord2[0] - coord1[0]) * Math.PI / 180;
  const Δλ = (coord2[1] - coord1[1]) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Bus state tracking
const busStates = new Map();

activeBuses.forEach(bus => {
  const route = routesData.find(r => r.id === bus.routeId);
  if (route) {
    busStates.set(bus.busId, {
      busId: bus.busId,
      routeId: bus.routeId,
      routeName: route.name,
      // We now track exact lat/lng, not just index
      currentLat: route.path[bus.startIndex || 0][0],
      currentLng: route.path[bus.startIndex || 0][1],
      targetIndex: (bus.startIndex || 0) + 1, // The next point we are aiming for
      direction: 'forward',
      route: route,
      speed: bus.speed || 50, // km/h
      passengers: Math.floor(Math.random() * 30) + 5,
      type: bus.type || route.type || 'bus'
    });
  }
});

socket.on('connect', () => {
  console.log(`✅ Simulator Connected! ID: ${socket.id}`);
  
  busStates.forEach((state) => {
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

function simulateBusMovement() {
  if (!socket.connected) return;

  busStates.forEach((state) => {
    const route = state.route;
    
    // Safety check
    if (!route.path[state.targetIndex]) {
        // If target is invalid, reverse immediately
        state.direction = (state.direction === 'forward') ? 'backward' : 'forward';
        state.targetIndex = (state.direction === 'forward') ? 1 : route.path.length - 2;
        return;
    }

    const targetPoint = route.path[state.targetIndex]; // [lat, lng]
    
    // 1. Calculate distance to target (in meters)
    const distToTarget = getDistance([state.currentLat, state.currentLng], targetPoint);

    // 2. Calculate how far we move in this tick (Speed * Time)
    // Speed (km/h) -> meters/second -> meters per update interval
    const metersPerStep = (state.speed * 1000 / 3600) * (SIMULATION_INTERVAL / 1000);

    if (distToTarget < metersPerStep) {
      // SNAP TO TARGET: We are close enough to arrive
      state.currentLat = targetPoint[0];
      state.currentLng = targetPoint[1];

      // Update Index for next loop
      if (state.direction === 'forward') {
        state.targetIndex++;
        if (state.targetIndex >= route.path.length) {
          state.direction = 'backward';
          state.targetIndex = route.path.length - 2;
        }
      } else {
        state.targetIndex--;
        if (state.targetIndex < 0) {
          state.direction = 'forward';
          state.targetIndex = 1;
        }
      }
    } else {
      // MOVE TOWARDS TARGET: Interpolate
      const ratio = metersPerStep / distToTarget;
      state.currentLat += (targetPoint[0] - state.currentLat) * ratio;
      state.currentLng += (targetPoint[1] - state.currentLng) * ratio;
    }

    // 3. Emit exact interpolated location
    const updateData = {
      busId: state.busId,
      routeId: state.routeId,
      position: { lat: state.currentLat, lng: state.currentLng },
      heading: 0, // Simplified bearing for now
      speed: state.speed,
      passengers: state.passengers,
      type: state.type,
      timestamp: new Date().toISOString()
    };

    socket.emit('driver_location_update', updateData);
  });
}

// Decrease interval to 1 second for smoother animation
const SIMULATION_INTERVAL = 1000; 
setInterval(simulateBusMovement, SIMULATION_INTERVAL);

console.log(`🤖 Interpolated Simulator Initialized.`);