// client/src/components/RouteOptimizer.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaRoute } from 'react-icons/fa';
import { MdFindReplace } from 'react-icons/md';
import { GoAlertFill } from 'react-icons/go';

const RouteOptimizer = () => {
  const [stops, setStops] = useState([]);
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [result, setResult] = useState(null);
  const [seatSummaries, setSeatSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch all stops on component mount
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stops');
        setStops(response.data.data);
      } catch (error) {
        console.error('Error fetching stops:', error);
      }
    };
    fetchStops();
  }, []);

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
    try {
      const response = await axios.post('http://localhost:5000/api/optimize-route', {
        startStopId: startStop,
        endStopId: endStop
      });
      const data = response.data.data;
      setResult(data);

      // fetch seat summaries for suggested routes
      if (data && data.suggestedRoutes) {
        const summaries = {};
        await Promise.all(data.suggestedRoutes.map(async (r) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/seats/${r.routeId}`);
            const routeSeats = res.data.data || [];
            // aggregate
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
      className="bg-white rounded-lg shadow-lg p-4"
    >
      <h2 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
        <span className="text-2xl"><FaRoute/></span> Route Optimizer
      </h2>
      
      <div className="space-y-3">
        {/* Start Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📍 From (Start)
          </label>
          <select
            value={startStop}
            onChange={(e) => setStartStop(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select starting stop</option>
            {stops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwap}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </motion.button>
        </div>

        {/* End Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🏁 To (Destination)
          </label>
          <select
            value={endStop}
            onChange={(e) => setEndStop(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select destination stop</option>
            {stops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Find Route Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOptimize}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
  <span className="flex items-center justify-center gap-2">
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
        </svg>
          Finding Routes...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <MdFindReplace className="text-2xl" /> {/* Added class for size */}
            Find Best Route
          </span>
        )}
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {result.suggestedRoutes && result.suggestedRoutes.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {result.hasDirectRoute ? '✅ Direct routes available' : '🔄 Transfer required'}
                  </div>
                  
                  {result.suggestedRoutes.map((route, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-lg border-2 overflow-hidden ${
                        idx === 0
                          ? 'border-green-400 bg-green-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      {/* Header */}
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        {idx === 0 && (
                          <div className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1">
                            ⭐ BEST OPTION
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{route.isDirect ? '🎯' : '🔄'}</span>
                            <span className="text-xs font-semibold text-gray-600">
                              {route.isDirect ? 'DIRECT' : 'VIA TRANSFER'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              ~{route.estimatedTime} min
                            </div>
                            <div className="text-xs text-gray-600">
                              {route.stopsCount} stops
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Route */}
                      {route.isDirect && (
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{route.routeType === 'airway' ? '✈️' : '🚍'}</span>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: route.routeColor }}
                            />
                            <div className="font-semibold text-gray-800 text-sm">
                              {route.routeName}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>📍 <strong>From:</strong> {route.startStop}</div>
                            <div>🏁 <strong>To:</strong> {route.endStop}</div>
                            {seatSummaries[route.routeId] && (
                              <div className="mt-1 text-sm text-gray-800">Seats: {seatSummaries[route.routeId].available}/{seatSummaries[route.routeId].capacity}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Transfer Route */}
                      {!route.isDirect && route.legs && (
                        <div className="p-3 space-y-2">
                          {route.legs.map((leg, legIdx) => (
                            <div key={legIdx}>
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{leg.routeType === 'airway' ? '✈️' : '🚍'}</span>
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: leg.routeColor }}
                                  />
                                  <div className="font-semibold text-gray-800 text-xs">
                                    Leg {legIdx + 1}: {leg.routeName.split(':')[0]}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 ml-6">
                                  <div>📍 {leg.startStop} → 🏁 {leg.endStop}</div>
                                  <div className="mt-1">
                                    <span className="font-semibold">{leg.stopsCount} stops</span>
                                    <span className="mx-2">•</span>
                                    <span className="text-blue-600 font-semibold">{leg.estimatedTime} min</span>
                                  </div>
                                </div>
                              </div>

                              {/* Transfer Point */}
                              {legIdx < route.legs.length - 1 && (
                                <div className="flex items-center justify-center py-1">
                                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-full px-3 py-1 text-xs font-bold text-yellow-800 flex items-center gap-1">
                                    🔄 Transfer at {route.transferPoint}
                                    <span className="text-yellow-600">({route.transferWaitTime} min wait)</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                >
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <span><GoAlertFill/></span>
                    No routes found between these stops. Try different locations.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RouteOptimizer;