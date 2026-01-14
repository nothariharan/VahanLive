// client/src/components/PassengerDashboard.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  FaBus, 
  FaPlane, 
  FaRoute, 
  FaSatelliteDish, 
  FaChevronLeft, 
  FaChevronRight, 
  FaCircle, 
  FaMapMarkerAlt 
} from 'react-icons/fa';
import { MdGpsFixed, MdPersonPinCircle, MdAirlineSeatReclineNormal } from 'react-icons/md';

import MapComponent from "./MapComponent"
import RouteSelector from './RouteSelector';
import RouteOptimizer from './RouteOptimizer';
import SeatTracker from './SeatTracker';

// --- UPDATED SECTION: Import Config ---
import { API_URL, SOCKET_URL } from '../config';

// We map the simulator to the main socket URL for production compatibility
const SERVER_SOCKET_URL = SOCKET_URL;
const SIMULATOR_URL = SOCKET_URL; 
// --------------------------------------

function PassengerDashboard() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [socket, setSocket] = useState(null);
  const [simSocket, setSimSocket] = useState(null);
  const [bankSocket, setBankSocket] = useState(null);
  const [seatsMap, setSeatsMap] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchedRoutes, setWatchedRoutes] = useState([]);

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

  // Setup Socket.io connections
  useEffect(() => {
    const serverSocket = io(SERVER_SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // In production, this attempts to connect to the main server 
    // to prevent "connection refused" errors on port 5001
    const simSocket = io(SIMULATOR_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    // Server socket events
    serverSocket.on('connect', () => {
      console.log('[ServerSocket] Connected');
      setConnectionStatus('Connected');
    });

    serverSocket.on('disconnect', () => {
      console.log('[ServerSocket] Disconnected');
      setConnectionStatus('Disconnected');
    });

    serverSocket.on('location_update', (data) => {
      setBuses((prevBuses) => {
        const existingIndex = prevBuses.findIndex(b => b.busId === data.busId);
        if (existingIndex >= 0) {
          const updated = [...prevBuses];
          updated[existingIndex] = { ...updated[existingIndex], ...data, isRealDriver: data.isRealDriver || true };
          return updated;
        } else {
          return [...prevBuses, { ...data, isRealDriver: data.isRealDriver || true }];
        }
      });
    });

    serverSocket.on('new_route', (route) => {
      setRoutes((prev) => {
        if (prev.some(r => r.id === route.id)) return prev;
        return [...prev, route];
      });
    });

    serverSocket.on('route_removed', ({ id }) => {
      setRoutes((prev) => prev.filter(r => r.id !== id));
      setBuses((prevB) => prevB.filter(b => b.routeId !== id));
      if (selectedRoute?.id === id) setSelectedRoute(null);
    });

    serverSocket.on('active_routes', (routes) => {
      setRoutes((prev) => {
        const ids = new Set(prev.map(r => r.id));
        const combined = [...prev];
        for (const r of routes) {
          if (!ids.has(r.id)) combined.push(r);
        }
        return combined;
      });
    });

    // Simulator socket events
    simSocket.on('location_update', (data) => {
      setBuses((prevBuses) => {
        const existingIndex = prevBuses.findIndex(b => b.busId === data.busId);
        if (existingIndex >= 0) {
          const updated = [...prevBuses];
          updated[existingIndex] = { ...updated[existingIndex], ...data };
          return updated;
        } else {
          return [...prevBuses, data];
        }
      });
    });

    setSocket(serverSocket);
    setSimSocket(simSocket);

    return () => {
      serverSocket.close();
      simSocket.close();
    };
  }, []);

  // Setup seat updates
  useEffect(() => {
    const seatSocket = io(SERVER_SOCKET_URL, { transports: ['websocket'] });
    setBankSocket(seatSocket);

    seatSocket.on('seat_update', (payload) => {
      setSeatsMap((prev) => ({ ...prev, [payload.busId]: payload }));
    });

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/seats`);
        const data = await res.json();
        if (data && data.data) {
          const map = {};
          data.data.forEach((s) => (map[s.busId] = s));
          setSeatsMap(map);
        }
      } catch (err) {
        console.error('Error fetching initial seats', err);
      }
    })();

    return () => seatSocket.close();
  }, []);

  // Subscribe to route updates
  useEffect(() => {
    if ((socket || simSocket) && selectedRoute) {
      routes.forEach(route => {
        if (socket) socket.emit('unsubscribe_route', route.id);
        if (simSocket) simSocket.emit('unsubscribe_route', route.id);
      });

      if (socket) socket.emit('subscribe_route', selectedRoute.id);
      if (simSocket) simSocket.emit('subscribe_route', selectedRoute.id);

      setBuses((prevBuses) => 
        prevBuses.filter(bus => bus.routeId === selectedRoute.id)
      );
    }

    if (bankSocket && selectedRoute) {
      routes.forEach(route => bankSocket.emit('unsubscribe_route', route.id));
      bankSocket.emit('subscribe_route', selectedRoute.id);
    }
  }, [socket, simSocket, selectedRoute, routes, bankSocket]);

  const activeBusesOnRoute = buses.filter(
    bus => bus.routeId === selectedRoute?.id
  );

  function toggleWatch(route) {
    setWatchedRoutes((prev) => {
      if (prev.some(r => r.id === route.id)) return prev.filter(r => r.id !== route.id);
      return [...prev, route];
    });
  }

  // Build routeSeatsMap
  const routeSeatsMap = {};
  Object.values(seatsMap).forEach((s) => {
    if (!routeSeatsMap[s.routeId]) routeSeatsMap[s.routeId] = { available: 0, capacity: 0 };
    if (s.type === 'bus') {
      routeSeatsMap[s.routeId].available += s.seats.available;
      routeSeatsMap[s.routeId].capacity += s.seats.capacity;
    } else {
      routeSeatsMap[s.routeId].available += s.seats.economy.available + s.seats.business.available;
      routeSeatsMap[s.routeId].capacity += s.seats.economy.capacity + s.seats.business.capacity;
    }
  });

  const busCount = buses.filter(b => b.type === 'bus').length;
  const flightCount = buses.filter(b => b.type === 'airway').length;
  const realDriverCount = buses.filter(b => b.isRealDriver).length;

  return (
    // UPDATED: Background to Green/Teal gradient
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative overflow-hidden">
      
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: "#ecfdf5" }} // Greenish tint
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 z-[2000] p-3 rounded-full shadow-xl 
                   bg-white/90 backdrop-blur-md border border-gray-200 
                   text-gray-700 hover:text-emerald-600 hover:shadow-2xl hover:border-emerald-200"
        animate={{ left: sidebarOpen ? '336px' : '16px' }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div
          animate={{ rotate: sidebarOpen ? 0 : 180 }}
          transition={{ duration: 0.4 }}
        >
          {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </motion.div>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="w-80 bg-white/95 backdrop-blur-xl shadow-2xl overflow-y-auto z-[1500] border-r border-white/20"
          >
            <div className="p-4 pt-16">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                {/* UPDATED TITLE STYLING */}
                <motion.div 
                  className="flex items-end gap-2 mb-3 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                    <span 
                        className="text-4xl bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
                        style={{ fontFamily: "'Samarkan', sans-serif" }}
                    >
                      Vahan
                    </span>
                    <span 
                        className="text-2xl font-light italic text-slate-700 pb-1"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Live
                    </span>
                </motion.div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 shadow-inner">
                   <FaSatelliteDish className={connectionStatus === 'Connected' ? "text-emerald-500" : "text-red-500"} />
                  <span className={`text-sm font-semibold ${connectionStatus === 'Connected' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {connectionStatus === 'Connected' ? 'System Online' : 'Reconnecting...'}
                  </span>
                  {connectionStatus === 'Connected' && (
                    <span className="relative flex h-2 w-2 ml-auto">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Route Selector */}
              <RouteSelector
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={setSelectedRoute}
                watchedRoutes={watchedRoutes}
                toggleWatch={toggleWatch}
                routeSeatsMap={routeSeatsMap}
              />

              {/* Active Vehicles Count Card */}
              <AnimatePresence>
                {selectedRoute && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl shadow-lg p-4 mb-4 text-white ${
                      selectedRoute.type === 'airway'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}
                  >
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-white/90">
                      {selectedRoute.type === 'airway' ? <FaPlane /> : <FaBus />}
                      <span className="tracking-wide text-sm uppercase">Active Fleet</span>
                    </h3>
                    
                    <div className="flex items-baseline gap-2">
                        <motion.p
                        key={activeBusesOnRoute.length}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-extrabold tracking-tighter"
                        >
                        {activeBusesOnRoute.length}
                        </motion.p>
                        <span className="text-sm font-medium text-white/80">vehicles</span>
                    </div>

                    <p className="text-xs text-white/70 mt-1 truncate border-t border-white/20 pt-2">
                      Route: {selectedRoute.name}
                    </p>

                    {/* Live Vehicle List */}
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {activeBusesOnRoute.map((bus, idx) => (
                        <motion.div
                          key={bus.busId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white/10 rounded-lg p-2 text-xs text-white backdrop-blur-md border border-white/10"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold flex items-center gap-2 truncate">
                               {bus.type === 'airway' ? <FaPlane className="text-xs"/> : <FaBus className="text-xs"/>} 
                               {bus.busId}
                            </span>
                            
                            {/* Tags */}
                            <div className="flex gap-1">
                                {bus.isRealDriver && (
                                    <span className="px-1.5 py-0.5 bg-white text-emerald-700 font-bold text-[9px] rounded-full shadow-sm flex items-center gap-1">
                                    <MdGpsFixed size={8} /> LIVE
                                    </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                                    bus.isAtStop ? 'bg-red-500/80 text-white' : 'bg-emerald-400/80 text-emerald-950'
                                }`}>
                                    {bus.isAtStop ? 'STOP' : 'MOVING'}
                                </span>
                            </div>
                          </div>
                          {bus.status && (
                            <div className="mt-1 text-white/60 truncate text-[10px] pl-5">{bus.status}</div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Route Optimizer */}
              <RouteOptimizer />

              {/* Seat Tracker */}
              <SeatTracker
                watchedRoutes={watchedRoutes}
                onRemoveWatch={(r) => setWatchedRoutes((prev) => prev.filter(x => x.id !== r.id))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent
          selectedRoute={selectedRoute}
          buses={activeBusesOnRoute}
          seatsMap={seatsMap}
          routeSeatsMap={routeSeatsMap}
        />

        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-4 z-[1000] min-w-[160px]"
        >
          <div className="text-xs text-gray-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2 text-slate-500"><FaRoute /> Routes</span>
              <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">{routes.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2 text-emerald-600"><FaBus /> Buses</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">{busCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2 text-indigo-500"><FaPlane /> Flights</span>
              <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">{flightCount}</span>
            </div>

            {realDriverCount > 0 && (
              <div className="pt-2 mt-2 border-t border-dashed border-gray-300">
                 <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2 text-teal-600"><MdPersonPinCircle size={14} /> Drivers</span>
                    <span className="text-white bg-teal-500 px-2 py-0.5 rounded font-bold animate-pulse text-[10px]">{realDriverCount}</span>
                 </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-4 z-[1000]"
        >
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Map Legend</h4>
          <div className="space-y-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-3">
               <FaBus className="text-emerald-500 text-sm" /> 
               <span>Bus Route</span>
            </div>
            <div className="flex items-center gap-3">
               <FaPlane className="text-indigo-500 text-sm" /> 
               <span>Airway</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span>Active/Moving</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <span>Stopped</span>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded flex gap-1 items-center">
                 <MdGpsFixed size={8}/> LIVE
              </span>
              <span className="text-emerald-700 font-bold">Real Driver</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PassengerDashboard;