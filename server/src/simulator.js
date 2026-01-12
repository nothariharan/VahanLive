import { createServer } from 'http';
import { Server } from 'socket.io';
import { routesData, activeBuses } from './data/routesData.js';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// bus state tracking
const busStates = new Map();

// initialize bus states
activeBuses.forEach(bus => {
  const route = routesData.find(r => r.id === bus.routeId);
  busStates.set(bus.busId, {
    busId: bus.busId,
    routeId: bus.routeId,
    currentIndex: bus.startIndex,
    direction: 'forward', // forward or backward
    route: route,
    currentPosition: route.path[bus.startIndex],
    // Use provided realistic speeds from data (buses slower, airways slower in coordinate movement)
    speed: bus.speed || 50, // km/h
    passengers: Math.floor(Math.random() * 30) + 5,
    type: bus.type || route.type || 'bus'
  });
});

// Simulate bus movement
function simulateBusMovement() {
  busStates.forEach((state, busId) => {
    const route = state.route;
    let nextIndex;

    // Determine next position based on direction
    if (state.direction === 'forward') {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= route.path.length) {
        // Reached end, reverse direction
        state.direction = 'backward';
        nextIndex = route.path.length - 2;
      }
    } else {
      nextIndex = state.currentIndex - 1;
      if (nextIndex < 0) {
        // Reached start, reverse direction
        state.direction = 'forward';
        nextIndex = 1;
      }
    }

    state.currentIndex = nextIndex;
    state.currentPosition = route.path[nextIndex];

    // Randomly update passengers
    if (Math.random() > 0.7) {
      state.passengers = Math.max(0, state.passengers + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
    }

    // Emit location update
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
      type: state.type, // include vehicle type so clients render correct icons
      timestamp: new Date().toISOString()
    };

    io.to(`route_${state.routeId}`).emit('location_update', updateData);
    console.log(`Bus ${busId} updated: [${updateData.position.lat.toFixed(4)}, ${updateData.position.lng.toFixed(4)}]`);
  });
}

// Calculate heading (bearing) between current and previous position
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

io.on('connection', (socket) => {
  console.log(`[Simulator] Client connected: ${socket.id}`);

  socket.on('subscribe_route', (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`[Simulator] Client ${socket.id} subscribed to route ${routeId}`);
    
    // send initial positions of all buses on this route
    busStates.forEach((state) => {
      if (state.routeId === routeId) {
        socket.emit('location_update', {
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
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Simulator] Client disconnected: ${socket.id}`);
  });
});

// start simulation interval (every 3 seconds)
const SIMULATION_INTERVAL = 3000;
setInterval(simulateBusMovement, SIMULATION_INTERVAL);
//console messages to know in case of errors (for sanity tbh lol)
const PORT = 5001;
httpServer.listen(PORT, () => {
  console.log(` Bus Simulator running on port ${PORT}`);
  console.log(`simulating ${activeBuses.length} buses across ${routesData.length} routes`);
  console.log(`update interval: ${SIMULATION_INTERVAL}ms`);
});