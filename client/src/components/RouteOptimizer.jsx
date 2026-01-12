// client/src/components/RouteOptimizer.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const RouteOptimizer = () => {
  const [stops, setStops] = useState([]);
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [result, setResult] = useState(null);
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
      setResult(response.data.data);
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
        <span className="text-2xl">🎯</span> Route Optimizer
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
            '🚀 Find Best Route'
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
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    ✅ {result.message}
                  </div>
                  
                  {result.suggestedRoutes.map((route, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg border-2 ${
                        idx === 0
                          ? 'bg-green-50 border-green-300'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      {idx === 0 && (
                        <div className="text-xs font-bold text-green-700 mb-1">
                          ⭐ BEST OPTION
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: route.routeColor }}
                        />
                        <div className="font-semibold text-gray-800 text-sm">
                          {route.routeName}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 space-y-2">
                        {route.routeType === 'via' ? (
                          <div className="space-y-1">
                            {route.legs.map((leg, i) => (
                              <div key={i} className="p-2 rounded border bg-white">
                                <div className="text-sm font-semibold text-gray-800">
                                  {leg.routeName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {i === 0 ? `📍 From: ${leg.startStop} → ${leg.endStop}` : `📍 From: ${leg.startStop} → ${leg.endStop}`}
                                </div>
                                <div className="text-xs mt-1">
                                  <span className="font-semibold">🛑 {leg.stopsCount} stops</span>
                                  <span className="ml-2 font-semibold text-blue-600">⏱️ ~{leg.estimatedTime} min</span>
                                </div>
                              </div>
                            ))}
                            <div className="mt-1 text-xs text-gray-700">
                              <strong>Total:</strong> ⏱️ ~{route.estimatedTime} min • 🛑 {route.stopsCount} stops
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>📍 From: {route.startStop}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>🏁 To: {route.endStop}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                              <span className="font-semibold">
                                🛑 {route.stopsCount} stops
                              </span>
                              <span className="font-semibold text-blue-600">
                                ⏱️ ~{route.estimatedTime} min
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                >
                  <p className="text-sm text-yellow-800">
                     No direct routes found. You may need to transfer between routes.
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