// client/src/components/RouteOptimizer.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaRoute, 
  FaMapMarkerAlt, 
  FaFlagCheckered, 
  FaExchangeAlt, 
  FaSearchLocation, 
  FaBus, 
  FaPlane 
} from 'react-icons/fa';
import { MdTimer, MdAirlineSeatReclineNormal } from 'react-icons/md';
import { GoAlertFill } from 'react-icons/go';

import { API_URL } from '../config';

// Mobile detection
const isMobileDevice = () => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

const RouteOptimizer = () => {
  const [isMobile] = useState(isMobileDevice());
  const [stops, setStops] = useState([]);
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [result, setResult] = useState(null);
  const [seatSummaries, setSeatSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch all stops - defer on mobile to improve initial load
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/stops`);
        setStops(response.data.data);
      } catch (error) {
        console.error('Error fetching stops:', error);
      }
    };
    
    // On mobile, defer stops fetching by 2 seconds
    if (isMobile) {
      const timer = setTimeout(fetchStops, 2000);
      return () => clearTimeout(timer);
    } else {
      fetchStops();
    }
  }, [isMobile]);

  const handleOptimize = async () => {
    if (!startStop || !endStop) {
      alert('Please select both start and end stops');
      return;
    }

    if (startStop === endStop) {
      alert('Start and end stops cannot be the same');
      return;
    }

    setLoading(true);
    setResult(null); 
    
    try {
      const response = await axios.post(`${API_URL}/api/optimize-route`, {
        startStopId: startStop,
        endStopId: endStop
      });
      const data = response.data.data;
      setResult(data);

      // Fetch seat summaries for suggested routes
      if (data && data.suggestedRoutes) {
        const summaries = {};
        await Promise.all(data.suggestedRoutes.map(async (r) => {
          try {
            const res = await axios.get(`${API_URL}/api/seats/${r.routeId}`);
            const routeSeats = res.data.data || [];
            
            // Aggregate seat data
            let available = 0;
            let capacity = 0;
            routeSeats.forEach((s) => {
              if (s.type === 'bus') {
                available += s.seats.available;
                capacity += s.seats.capacity;
              } else {
                available += s.seats.economy.available + s.seats.business.available;
                capacity += s.seats.economy.capacity + s.seats.business.capacity;
              }
            });
            summaries[r.routeId] = { available, capacity };
          } catch (e) {
            console.error('error fetching seats for route', r.routeId, e);
          }
        }));
        setSeatSummaries(summaries);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Failed to optimize route');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = startStop;
    setStartStop(endStop);
    setEndStop(temp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FaRoute className="text-white/90" /> 
          Route Optimizer
        </h2>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/90 font-medium">AI Powered</span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Input Group */}
        <div className="relative space-y-3">
          {/* Connecting Line */}
          <div className="absolute left-[1.1rem] top-9 bottom-9 w-0.5 bg-gray-200 -z-10"></div>

          {/* Start Location */}
          <div className="relative">
            <div className="absolute left-3 top-3 text-emerald-500 z-10">
                <FaMapMarkerAlt />
            </div>
            <select
              value={startStop}
              onChange={(e) => setStartStop(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer text-gray-700 font-medium"
            >
              <option value="">Select Start Point</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </select>
          </div>

          {/* Swap Button (Floating) */}
          <div className="absolute right-4 top-[50%] -translate-y-[50%] z-20">
             <motion.button
              whileHover={!isMobile ? { scale: 1.1, rotate: 180 } : {}}
              whileTap={!isMobile ? { scale: 0.9 } : {}}
              onClick={handleSwap}
              className="p-2 bg-white rounded-full shadow-md border border-gray-100 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <FaExchangeAlt className="rotate-90 text-xs" />
            </motion.button>
          </div>

          {/* End Location */}
          <div className="relative">
             <div className="absolute left-3 top-3 text-red-500 z-10">
                <FaFlagCheckered />
            </div>
            <select
              value={endStop}
              onChange={(e) => setEndStop(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none cursor-pointer text-gray-700 font-medium"
            >
              <option value="">Select Destination</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Find Route Button */}
        <motion.button
          whileHover={!isMobile ? { scale: 1.02 } : {}}
          whileTap={!isMobile ? { scale: 0.98 } : {}}
          onClick={handleOptimize}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/30'
          }`}
        >
          {loading ? (
             <>
               <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
               </svg>
               <span>Calculating...</span>
             </>
          ) : (
             <>
               <FaSearchLocation /> Find Best Route
             </>
          )}
        </motion.button>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-dashed border-gray-200 mt-2">
                 <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                    {result.suggestedRoutes?.length} Option(s) Found
                 </p>
                 
                {result.suggestedRoutes && result.suggestedRoutes.length > 0 ? (
                  <div className="space-y-3">
                    {result.suggestedRoutes.map((route, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
                          idx === 0
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {/* Best Option Badge */}
                        {idx === 0 && (
                          <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 text-center uppercase tracking-wider">
                            Recommended
                          </div>
                        )}

                        <div className="p-3">
                            {/* Route Summary Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        {route.isDirect ? (
                                            <span className="text-emerald-600 flex items-center gap-1 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                                                Direct
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 flex items-center gap-1 text-xs bg-amber-100 px-5 py-0.5 rounded-full">
                                                1 Transfer
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-sm">{route.stopsCount} stops</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-slate-800 flex items-center justify-end gap-1">
                                        <MdTimer className="text-gray-400 text-sm"/> {route.estimatedTime}<span className="text-xs font-normal text-gray-500">min</span>
                                    </div>
                                </div>
                            </div>

                            {/* Route Details Card */}
                            {route.isDirect ? (
                                <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${route.routeType === 'airway' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                                             {route.routeType === 'airway' ? <FaPlane size={12}/> : <FaBus size={12}/>}
                                         </div>
                                         <div>
                                             <div className="text-xs font-bold text-gray-700">{route.routeName}</div>
                                             {seatSummaries[route.routeId] && (
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <MdAirlineSeatReclineNormal /> 
                                                    {seatSummaries[route.routeId].available} seats left
                                                </div>
                                             )}
                                         </div>
                                     </div>
                                </div>
                            ) : (
                                // Transfer View
                                <div className="space-y-2 relative">
                                    {/* Dotted Line */}
                                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 border-l-2 border-dotted border-gray-300 -z-10"></div>
                                    
                                    {route.legs?.map((leg, legIdx) => (
                                        <div key={legIdx} className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm relative">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs z-10 border-2 border-white"
                                                    style={{ backgroundColor: leg.routeColor }}
                                                >
                                                    {leg.routeType === 'airway' ? <FaPlane /> : <FaBus />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-gray-700 truncate">{leg.routeName}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {leg.startStop} <span className="text-gray-300">➜</span> {leg.endStop}
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-gray-600">
                                                    {leg.estimatedTime}m
                                                </div>
                                            </div>
                                            
                                            {/* Transfer Wait Indicator */}
                                            {legIdx < route.legs.length - 1 && (
                                                <div className="mt-2 mx-2 py-1 bg-amber-50 rounded text-[10px] text-amber-700 text-center border border-amber-100 font-medium">
                                                    <span className="font-bold">Wait {route.transferWaitTime}m</span> at {route.transferPoint}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <GoAlertFill className="text-red-500 mt-0.5 text-lg flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-red-700">No Routes Found</h4>
                        <p className="text-xs text-red-600 mt-1">We couldn't find a connection between these stops. Try selecting different locations.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RouteOptimizer;