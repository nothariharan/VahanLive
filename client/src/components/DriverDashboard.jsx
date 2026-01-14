// client/src/components/DriverDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000';

export default function DriverDashboard() {
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [busId, setBusId] = useState('');
  const [isDriving, setIsDriving] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // Fetch routes and stops on mount
  useEffect(() => {
    fetchRoutes();
    fetchStops();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes`);
      setRoutes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Failed to load routes');
    }
  };

  const fetchStops = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stops`);
      setAllStops(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stops:', error);
    }
  };

  // Get stops for selected route
  const getRouteStops = () => {
    if (!selectedRoute) return [];
    const route = routes.find(r => r.id === selectedRoute);
    return route ? route.stops : [];
  };

  // Connect to socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    
    socketRef.current.on('connect', () => {
      console.log('[Driver] Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Driver] Disconnected from server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const validateForm = () => {
    if (!busId.trim()) {
      setError('Please enter a Bus ID');
      return false;
    }
    if (!selectedRoute) {
      setError('Please select a route');
      return false;
    }
    if (!startStop) {
      setError('Please select a starting stop');
      return false;
    }
    if (!endStop) {
      setError('Please select a destination stop');
      return false;
    }
    if (startStop === endStop) {
      setError('Start and end stops cannot be the same');
      return false;
    }
    setError('');
    return true;
  };

  const startDriving = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDriving(true);
    setStatus(' Initializing GPS...');

    const route = routes.find(r => r.id === selectedRoute);
    const startStopData = route?.stops.find(s => s.id === startStop);
    const endStopData = route?.stops.find(s => s.id === endStop);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        
        const locationData = {
          busId: busId,
          routeId: selectedRoute,
          position: {
            lat: latitude,
            lng: longitude
          },
          heading: heading || 0,
          speed: speed ? (speed * 3.6).toFixed(1) : 0, 
          type: 'bus', // or 'airway' based on route type
          isRealDriver: true,
          startStop: startStopData?.name,
          endStop: endStopData?.name,
          timestamp: new Date().toISOString()
        };

        setCurrentLocation(locationData);
        setStatus(` Broadcasting: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

        // Emit location to server
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('driver_location_update', locationData);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        setStatus(` GPS Error: ${error.message}`);
        setError(`GPS Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 5 // Only update if moved 5 meters
      }
    );
  };

  const stopDriving = () => {
    setIsDriving(false);
    setStatus(' Stopped');
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('driver_disconnected', { busId: busId });
    }

    setCurrentLocation(null);
  };

  // Login Form
  if (!isDriving) {
    const routeStops = getRouteStops();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">🚌</span>
              Driver Login
            </h2>
            <p className="text-green-100 mt-2">Start broadcasting your live location</p>
          </div>

          {/* Form */}
          <form onSubmit={startDriving} className="p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Bus ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bus ID *
              </label>
              <input
                type="text"
                placeholder="e.g., MH-01-BUS-1001"
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Route Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Route *
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setStartStop('');
                  setEndStop('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Choose a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.type === 'airway' ? '✈️' : '🚍'} {route.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Starting Stop */}
            {selectedRoute && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📍 Starting Stop *
                </label>
                <select
                  value={startStop}
                  onChange={(e) => setStartStop(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Select starting point...</option>
                  {routeStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Ending Stop */}
            {selectedRoute && startStop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏁 Destination Stop *
                </label>
                <select
                  value={endStop}
                  onChange={(e) => setEndStop(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Select destination...</option>
                  {routeStops.map((stop) => (
                    <option 
                      key={stop.id} 
                      value={stop.id}
                      disabled={stop.id === startStop}
                    >
                      {stop.name} {stop.id === startStop && '(Current)'}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
            >
              🚀 Start Driving
            </motion.button>

            <p className="text-xs text-gray-500 text-center mt-4">
              ⚠️ Make sure GPS/Location is enabled on your device
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  // Driving Screen
  const route = routes.find(r => r.id === selectedRoute);
  const startStopData = route?.stops.find(s => s.id === startStop);
  const endStopData = route?.stops.find(s => s.id === endStop);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 text-white p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md w-full"
        >
          {/* Pulsing Indicator */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
          >
            <span className="text-6xl">📡</span>
          </motion.div>

          {/* Status */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h1 className="text-3xl font-bold mb-4">🟢 You are LIVE!</h1>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-white/20 pb-2">
                <span className="text-green-200">Bus ID:</span>
                <span className="font-bold">{busId}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/20 pb-2">
                <span className="text-green-200">Route:</span>
                <span className="font-bold text-sm">{route?.name.split(':')[0]}</span>
              </div>

              <div className="flex justify-between items-center border-b border-white/20 pb-2">
                <span className="text-green-200">From:</span>
                <span className="font-semibold text-sm">{startStopData?.name}</span>
              </div>

              <div className="flex justify-between items-center border-b border-white/20 pb-2">
                <span className="text-green-200">To:</span>
                <span className="font-semibold text-sm">{endStopData?.name}</span>
              </div>

              {currentLocation && (
                <>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-green-200">Speed:</span>
                    <span className="font-bold">{currentLocation.speed} km/h</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-green-200">Location:</span>
                    <span className="font-mono text-xs">
                      {currentLocation.position.lat.toFixed(4)}, {currentLocation.position.lng.toFixed(4)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Message */}
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-200 text-sm"
          >
            {status}
          </motion.p>

          {/* Stop Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopDriving}
            className="w-full bg-red-500 hover:bg-red-600 px-8 py-4 rounded-full font-bold text-xl shadow-2xl transition"
          >
            🛑 Stop Driving
          </motion.button>

          <p className="text-green-300 text-xs">
            Your location is being broadcast to all passengers in real-time
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}