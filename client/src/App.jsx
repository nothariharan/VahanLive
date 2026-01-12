// client/src/App.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import RouteSelector from './components/RouteSelector';
import RouteOptimizer from './components/RouteOptimizer';

const SOCKET_URL = 'http://localhost:5001';
const API_URL = 'http://localhost:5000';

function App() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/routes`);
        setRoutes(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedRoute(response.data.data[0]);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

    fetchRoutes();
  }, []);

  // Setup Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to simulator');
      setConnectionStatus('Connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from simulator');
      setConnectionStatus('Disconnected');
    });

    newSocket.on('location_update', (data) => {
      setBuses((prevBuses) => {
        const existingIndex = prevBuses.findIndex(b => b.busId === data.busId);
        if (existingIndex >= 0) {
          const updated = [...prevBuses];
          updated[existingIndex] = data;
          return updated;
        } else {
          return [...prevBuses, data];
        }
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Subscribe to route updates
  useEffect(() => {
    if (socket && selectedRoute) {
      routes.forEach(route => {
        socket.emit('unsubscribe_route', route.id);
      });

      socket.emit('subscribe_route', selectedRoute.id);
      
      setBuses((prevBuses) => 
        prevBuses.filter(bus => bus.routeId === selectedRoute.id)
      );
    }
  }, [socket, selectedRoute, routes]);

  const activeBusesOnRoute = buses.filter(
    bus => bus.routeId === selectedRoute?.id
  );

  const busCount = buses.filter(b => b.type === 'bus').length;
  const flightCount = buses.filter(b => b.type === 'airway').length;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Toggle Button - Always visible */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 z-[2000] bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
        animate={{ left: sidebarOpen ? '336px' : '16px' }}
        transition={{ duration: 9, type: 'spring', damping: 100 }} //check for styling here
      >
        <motion.svg
          animate={{ rotate: sidebarOpen ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </motion.svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="w-80 bg-white shadow-xl overflow-y-auto z-[1500]"
          >
            <div className="p-4 pt-16">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >

                {/* we are cooking here for the h1 still doing */}
                <motion.h1
                  className="text-2xl font-extrabold cursor-pointer w-fit mb-2"
                  initial={{ scale: 1 }}
                  whileHover={{ 
                    scale: 1.05,
                    textShadow: "0px 0px 8px rgba(37, 99, 235, 0.5)" // blue glow here
                    }}
                    whileTap={{ scale: 0.95 }} 
                  transition={{ type: "spring", stiffness: 300 }}
>
                  <span className="mr-2 inline-block">🇮🇳</span>
  
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-[length:200%_auto] hover:animate-gradient hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                      India Transport Tracker
                    </span>
                    </motion.h1>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <motion.div
                    animate={{
                      scale: connectionStatus === 'Connected' ? [1, 1.2, 1] : 1,
                      backgroundColor: connectionStatus === 'Connected' ? '#10B981' : '#EF4444'
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">{connectionStatus}</span>
                </div>
              </motion.div>

              {/* Route Selector */}
              <RouteSelector
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={setSelectedRoute}
              />

              {/* Active Vehicles Count */}
              <AnimatePresence>
                {selectedRoute && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-lg shadow-md p-4 mb-4 text-white ${
                      selectedRoute.type === 'airway' 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                  >
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <span>{selectedRoute.type === 'airway' ? '✈️' : '🚌'}</span> 
                      Active {selectedRoute.type === 'airway' ? 'Flights' : 'Buses'}
                    </h3>
                    <motion.p
                      key={activeBusesOnRoute.length}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold"
                    >
                      {activeBusesOnRoute.length}
                    </motion.p>
                    <p className="text-sm opacity-90 mt-1 truncate">
                      on {selectedRoute.name}
                    </p>
                    
                    {/* Live Vehicle List */}
                    <div className="mt-3 space-y-2">
                      {activeBusesOnRoute.map((bus, idx) => (
                        <motion.div
                          key={bus.busId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/20 rounded p-2 text-xs text-white backdrop-blur-sm"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-semibold flex items-center gap-1 truncate">
                              {bus.type === 'airway' ? '✈️' : '🚍'} {bus.busId}
                            </span>
                            <span className={`px-2 py-1 rounded flex-shrink-0 ${
                              bus.isAtStop ? 'bg-red-500' : (bus.type === 'airway' ? 'bg-indigo-500' : 'bg-green-500')
                            }`}>
                              {bus.isAtStop ? '🛑' : (bus.type === 'airway' ? '✈️' : '🚍')}
                            </span>
                          </div>
                          {bus.status && (
                            <div className="mt-1 opacity-90 truncate">{bus.status}</div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Route Optimizer */}
              <RouteOptimizer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent
          selectedRoute={selectedRoute}
          buses={activeBusesOnRoute}
        />
        
        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]"
        >
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Total Routes:</span>
              <span className="text-blue-600 font-bold">{routes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">🚌 Buses:</span>
              <span className="text-green-600 font-bold">{busCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">✈️ Flights:</span>
              <span className="text-purple-600 font-bold">{flightCount}</span>
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]"
        >
          <h4 className="text-xs font-bold text-gray-700 mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚍</span>
              <span className="text-gray-600">Bus Route</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✈️</span>
              <span className="text-gray-600">Airways Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Moving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-gray-600">Stopped</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;