// client/src/components/DriverDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { FaBus, FaRoute, FaSatelliteDish } from 'react-icons/fa';
import { MdGpsFixed, MdStopCircle } from 'react-icons/md';
import customBusIcon from '../assets/image_3.png'

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000';

export default function DriverDashboard() {
  // ... (State and Logic remain exactly the same) ...
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [routeName, setRouteName] = useState('');
  const [busId, setBusId] = useState('');
  const [isDriving, setIsDriving] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // --- Background Blobs Animation Variants ---
  const blobVariants = {
    animate: {
      scale: [1, 1.2, 1],
      x: [0, 30, 0],
      y: [0, -30, 0],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    }
  };

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

  const getRouteStops = () => {
    if (!selectedRoute) return allStops || [];
    const route = routes.find(r => r.id === selectedRoute);
    return route ? route.stops : [];
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.on('connect', () => console.log('[Driver] Connected'));
    socketRef.current.on('disconnect', () => console.log('[Driver] Disconnected'));
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const validateForm = () => {
    if (!busId.trim()) { setError('Please enter a Bus ID'); return false; }
    if (!selectedRoute && !routeName.trim()) { setError('Please select a route or enter a live route name'); return false; }
    if (!startStop) { setError('Please select a starting stop'); return false; }
    if (!endStop) { setError('Please select a destination stop'); return false; }
    if (startStop === endStop) { setError('Start and end stops cannot be the same'); return false; }
    setError('');
    return true;
  };

  const startDriving = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!('geolocation' in navigator)) { setError('Geolocation is not supported by your browser'); return; }

    if (routeName.trim()) {
      setStatus(' Creating live route...');
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('driver_started', { busId, routeName, type: 'bus' }, (resp) => {
          if (resp && resp.ok && resp.route) {
            setSelectedRoute(resp.route.id);
            setStatus(' Live route created, initializing GPS...');
            setTimeout(() => startGPS(resp.route.id), 350);
          } else {
            setError('Failed to create live route');
            setStatus(' Idle');
          }
        });
      } else {
        setError('Socket not connected');
      }
      setIsDriving(true);
      return;
    }

    setIsDriving(true);
    setStatus(' Initializing GPS...');
    startGPS(selectedRoute);
  };

  const startGPS = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    const startStopData = route?.stops.find(s => s.id === startStop);
    const endStopData = route?.stops.find(s => s.id === endStop);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        const locationData = {
          busId: busId,
          routeId: routeId,
          position: { lat: latitude, lng: longitude },
          heading: heading || 0,
          speed: speed ? (speed * 3.6).toFixed(1) : 0, 
          type: 'bus', 
          isRealDriver: true,
          startStop: startStopData?.name,
          endStop: endStopData?.name,
          timestamp: new Date().toISOString()
        };

        setCurrentLocation(locationData);
        setStatus(` Broadcasting: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('driver_location_update', locationData);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        setStatus(` GPS Error: ${error.message}`);
        setError(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0, distanceFilter: 5 }
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

  // --- Render Login Form ---
  if (!isDriving) {
    const routeStops = getRouteStops();

    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-white">
        
        {/* Animated Background - GREEN THEME */}
        <motion.div variants={blobVariants} animate="animate" className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px]" />
        <motion.div variants={blobVariants} animate="animate" className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header - GREEN GRADIENTS */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-8 text-center border-b border-white/10">
              <div className="w-26 h-26 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
<img 
                    src={customBusIcon} 
                    alt="Bus and Plane Icon"
                    className="w-32 h-32 object-contain"
                  />              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                Driver Console
              </h2>
              <p className="text-slate-400 text-sm mt-1">Initialize Broadcast Uplink</p>
            </div>

            {/* Form */}
            <form onSubmit={startDriving} className="p-8 space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </motion.div>
              )}

              {/* Bus ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaBus className="text-emerald-500"/> Bus Identity
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN-01-BUS-1234"
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  // Updated Focus rings to emerald
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Route Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaRoute className="text-teal-500"/> Route Configuration
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => { setSelectedRoute(e.target.value); setStartStop(''); setEndStop(''); }}
                  // Updated Focus rings to teal
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">Select Designated Route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id} className="bg-slate-900">
                      {route.type === 'airway' ? '✈️' : '🚍'} {route.name}
                    </option>
                  ))}
                </select>
              </div>

               {/* Optional: create live route */}
               {!selectedRoute && (
                <div className="pt-2">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-slate-900/0 px-2 text-slate-500 backdrop-blur-sm">OR CREATE NEW</span>
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. Special Event Express"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        // Changed focus to Teal for consistency
                        className="mt-3 w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                    />
                </div>
               )}

              {/* Stops Selection Grid */}
              {(selectedRoute || routeName) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Point</label>
                    <select
                      value={startStop}
                      onChange={(e) => setStartStop(e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="" className="bg-slate-900">Origin...</option>
                      {routeStops.map((stop) => (
                        <option key={stop.id} value={stop.id} className="bg-slate-900">{stop.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Point</label>
                    <select
                      value={endStop}
                      onChange={(e) => setEndStop(e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="" className="bg-slate-900">Dest...</option>
                      {routeStops.map((stop) => (
                        <option key={stop.id} value={stop.id} disabled={stop.id === startStop} className="bg-slate-900">
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Button - GREEN GRADIENT */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <MdGpsFixed /> Go Live
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Render Driving Screen ---
  const route = routes.find(r => r.id === selectedRoute);
  const startStopData = route?.stops.find(s => s.id === startStop);
  const endStopData = route?.stops.find(s => s.id === endStop);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-white p-4 relative overflow-hidden">
      
       {/* Animated Background - GREEN THEME */}
       <motion.div variants={blobVariants} animate="animate" className="absolute top-0 left-0 w-full h-full bg-emerald-900/10 blur-[100px]" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-8 max-w-md w-full"
        >
          {/* Pulsing Indicator - GREEN THEME */}
          <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              // Changed blur to emerald
              className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              // Changed gradient to emerald/teal
              className="relative w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-900"
            >
              <FaSatelliteDish className="text-5xl text-white" />
            </motion.div>
          </div>

          {/* Status Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Signal Live</h1>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 text-left">
                      <p className="text-xs text-slate-400 uppercase">Bus ID</p>
                      {/* Emerald Text */}
                      <p className="font-mono font-bold text-emerald-300">{busId}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-left">
                      <p className="text-xs text-slate-400 uppercase">Speed</p>
                      {/* Teal Text */}
                      <p className="font-mono font-bold text-teal-300">{currentLocation ? currentLocation.speed : 0} km/h</p>
                  </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-left">
                      {/* Emerald Icon BG and Color */}
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <FaRoute className="text-emerald-400 text-xs"/>
                      </div>
                      <div>
                          <p className="text-xs text-slate-400">Current Route</p>
                          <p className="font-bold text-sm truncate w-48">{route?.name.split(':')[0] || routeName}</p>
                      </div>
                  </div>
                  
                  <div className="relative pl-4 ml-4 border-l border-white/10 space-y-4">
                      <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-slate-500"></div>
                          <p className="text-xs text-slate-400">Origin</p>
                          <p className="text-sm font-medium">{startStopData?.name}</p>
                      </div>
                      <div className="relative">
                          {/* Destination dot is already emerald, which is perfect */}
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                          <p className="text-xs text-slate-400">Destination</p>
                          <p className="text-sm font-medium">{endStopData?.name}</p>
                      </div>
                  </div>
              </div>

              {currentLocation && (
                 <div className="flex justify-between items-center text-xs text-slate-500 font-mono bg-black/20 rounded-lg p-2">
                    <span>LAT: {currentLocation.position.lat.toFixed(4)}</span>
                    <span>LNG: {currentLocation.position.lng.toFixed(4)}</span>
                 </div>
              )}
            </div>
          </div>

          {/* Status Message - Emerald Text */}
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-200/80 text-sm font-medium"
          >
            {status}
          </motion.p>

          {/* Stop Button (Red is fine for danger action, or could be dark green) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopDriving}
            className="w-full bg-red-500/90 hover:bg-red-600 backdrop-blur px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2"
          >
            <MdStopCircle className="text-2xl"/> Terminate Link
          </motion.button>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}