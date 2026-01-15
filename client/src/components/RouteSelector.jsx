// client/src/components/RouteSelector.jsx
import { motion } from 'framer-motion';
import { 
  FaBus, 
  FaPlane, 
  FaRoute, 
  FaEye, 
  FaEyeSlash, 
  FaClock, 
  FaMapMarkerAlt 
} from 'react-icons/fa';
import { MdAirlineSeatReclineNormal } from 'react-icons/md';

// Mobile detection
const isMobileDevice = () => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

const RouteSelector = ({ routes, selectedRoute, onRouteSelect, watchedRoutes = [], toggleWatch, routeSeatsMap = {} }) => {
  const isMobile = isMobileDevice();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-4"
    >
      <h2 className="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
        <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
          <FaRoute /> 
        </span>
        Select Route
      </h2>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {routes.map((route, index) => {
          const isSelected = selectedRoute?.id === route.id;
          const isWatched = watchedRoutes.some(r => r.id === route.id);
          const seats = routeSeatsMap[route.id];

          return (
            <motion.div
              key={route.id}
              role="button"
              tabIndex={0}
              initial={!isMobile ? { opacity: 0, x: -20 } : {}}
              animate={{ opacity: 1, x: 0 }}
              transition={isMobile ? { duration: 0 } : { delay: index * 0.05 }}
              whileHover={!isMobile ? { scale: 1.01 } : {}}
              whileTap={!isMobile ? { scale: 0.98 } : {}}
              onClick={() => onRouteSelect(route)}
              className={`relative w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 shadow-lg border-transparent'
                  : 'bg-white hover:bg-emerald-50 border-slate-100 text-slate-600 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon Box */}
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {route.type === 'airway' ? <FaPlane /> : <FaBus />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold truncate pr-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {route.name}
                    </h3>
                    
                    {/* Watch Button (Top Right) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatch(route); }}
                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
                        isSelected 
                          ? 'bg-white/20 hover:bg-white/30 text-white' 
                          : isWatched 
                            ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                      }`}
                    >
                      {isWatched ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                      {isWatched ? 'Unwatch' : 'Watch'}
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs ${
                    isSelected ? 'text-emerald-50' : 'text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <FaClock size={10} /> {route.schedule.frequency}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt size={10} /> {route.stops.length} stops
                    </span>
                  </div>
                  
                  {/* Seats Badge */}
                  {seats && (
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                      isSelected 
                        ? 'bg-black/20 text-white' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <MdAirlineSeatReclineNormal />
                      <span>
                        {seats.available}/{seats.capacity} Seats
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Strip Indicator  */}
              {!isSelected && (
                <div 
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                  style={{ backgroundColor: route.color || '#cbd5e1' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RouteSelector;