// client/src/components/RouteSelector.jsx
import { motion } from 'framer-motion';

const RouteSelector = ({ routes, selectedRoute, onRouteSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <h2 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
        <span className="text-2xl">{selectedRoute?.type === 'airway' ? '✈️' : '🚌'}</span> Select Route
      </h2>
      <div className="space-y-2">
        {routes.map((route, index) => (
          <motion.button
            key={route.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRouteSelect(route)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              selectedRoute?.id === route.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center">
              <motion.div
                animate={{
                  scale: selectedRoute?.id === route.id ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 mr-3"
              >
                <span className="text-xl">{route.type === 'airway' ? '✈️' : '🚍'}</span>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: route.color }}
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{route.name}</div>
                <div className={`text-xs ${
                  selectedRoute?.id === route.id ? 'opacity-90' : 'opacity-75'
                }`}>
                  {route.type === 'airway' ? '✈️ Flight' : `🛑 ${route.stops.length} stops`} • {route.schedule.frequency}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default RouteSelector;