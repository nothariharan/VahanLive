import { useEffect, useRef, useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { interpolatePosition, easeInOutCubic } from '../utils/interpolation';

// --- Utility Functions ---
function haversineMeters(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; 
  const lat1 = coords1.lat || coords1.latitude;
  const lon1 = coords1.lng || coords1.longitude;
  const lat2 = coords2.lat || coords2.latitude;
  const lon2 = coords2.lng || coords2.longitude;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to calculate shortest rotation path (e.g., 350 -> 10 should go +20, not -340)
function getShortestRotation(startAngle, endAngle) {
    const diff = (endAngle - startAngle + 180) % 360 - 180;
    return startAngle + (diff < -180 ? diff + 360 : diff);
}

const BusMarker = ({ bus, routeColor, seatInfo, routeStops = [] }) => {
  const [currentPosition, setCurrentPosition] = useState(bus.position);
  // Initial heading state
  const [currentHeading, setCurrentHeading] = useState(bus.heading || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const startPositionRef = useRef(bus.position);
  const targetPositionRef = useRef(bus.position);
  const startHeadingRef = useRef(bus.heading || 0);

  // 1. PERFORMANCE: Memoize the Icon (Prevents flickering/re-rendering)
  const vehicleIcon = useMemo(() => {
    const isRealDriver = bus.isRealDriver;
    
    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div class="relative w-9 h-9 flex items-center justify-center transition-transform will-change-transform" id="bus-icon-${bus.busId}">
          ${isRealDriver ? `<div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>` : ''}
          
          <div class="relative w-[34px] h-[34px] rounded-full flex items-center justify-center shadow-md border-2 border-white" 
               style="background-color: ${routeColor};">
            <div style="font-size: 16px; line-height: 1;">
              ${bus.type === 'airway' ? '✈️' : '🚌'}
            </div>
          </div>
          
          <div class="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [bus.type, bus.busId, bus.isRealDriver, routeColor]);

  // 2. OPTIMIZATION: Memoize Nearest Stop Calculation
  const nearestStopName = useMemo(() => {
    if (!routeStops.length) return 'Unknown';
    let nearest = null;
    let minDist = Number.POSITIVE_INFINITY;
    
    routeStops.forEach((s) => {
      const d = haversineMeters(currentPosition, { lat: s.lat, lng: s.lng });
      if (d < minDist) {
        minDist = d;
        nearest = s.name;
      }
    });
    return nearest || 'Unknown';
  }, [currentPosition.lat, currentPosition.lng, routeStops]);

  // 3. ANIMATION LOGIC (Restored Physics-Based Duration)
  useEffect(() => {
    if (
      bus.position.lat !== targetPositionRef.current.lat ||
      bus.position.lng !== targetPositionRef.current.lng
    ) {
      startPositionRef.current = currentPosition;
      targetPositionRef.current = bus.position;
      
      // Handle Heading
      startHeadingRef.current = currentHeading;
      const targetHeading = getShortestRotation(currentHeading, bus.heading || 0);

      setIsAnimating(true);

      // --- DURATION CALCULATION (Restored from your original code) ---
      const calculateDuration = () => {
        const start = startPositionRef.current;
        const target = targetPositionRef.current;
        const distance = haversineMeters(start, target); // meters
        const speed_m_s = Math.max((bus.speed || 40) * 1000 / 3600, 0.1); // default to ~40km/h if 0
        
        const rawDurationMs = (distance / speed_m_s) * 1000; 

        // Important: I lowered TIME_SCALE to 1. 
        // If you want it FASTER, increase this number (e.g. 10 or 60).
        // If you want it SLOWER (Real-time), keep it at 1.
        const TIME_SCALE = 1; 

        // Clamp duration: Minimum 1 second, Maximum 10 seconds (to prevent super slow movement)
        const scaled = Math.max(1000, Math.min(rawDurationMs / TIME_SCALE, 10000));
        return scaled;
      };

      const duration = calculateDuration();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        // Interpolate Lat/Lng
        const newPosition = interpolatePosition(
          startPositionRef.current,
          targetPositionRef.current,
          easedProgress
        );

        // Interpolate Heading
        const newHeading = startHeadingRef.current + (targetHeading - startHeadingRef.current) * easedProgress;

        setCurrentPosition(newPosition);
        setCurrentHeading(newHeading);

        // Direct DOM manipulation for rotation (Super smooth)
        const iconEl = document.getElementById(`bus-icon-${bus.busId}`);
        if (iconEl) {
            iconEl.style.transform = `rotate(${newHeading}deg)`;
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [bus.position, bus.heading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <Marker 
      ref={markerRef}
      position={[currentPosition.lat, currentPosition.lng]} 
      icon={vehicleIcon}
    >
      <Popup closeButton={false} className="custom-popup">
        <div className="p-1 min-w-[200px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 border-b pb-2">
             <h3 className="font-bold text-lg text-gray-800">
               {bus.type === 'airway' ? 'Flight' : 'Bus'} {bus.busId}
             </h3>
             {bus.isRealDriver && (
                 <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200 uppercase">
                    Live GPS
                 </span>
             )}
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Route:</span> 
                <span className="font-medium text-gray-800">{bus.routeId}</span>
            </div>
            
            <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Speed:</span> 
                <span className="font-mono text-blue-600">{bus.speed} km/h</span>
            </div>

            {/* Nearest Stop */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mt-2">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Approaching</p>
                <p className="text-gray-800 font-medium truncate">📍 {nearestStopName}</p>
            </div>

            {/* Seat Info */}
            {seatInfo && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                   {seatInfo.type === 'bus' ? (
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-500">Seats:</span>
                            <span className={`font-bold ${seatInfo.seats.available < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {seatInfo.seats.available}/{seatInfo.seats.capacity}
                            </span>
                        </div>
                   ) : (
                       <div className="space-y-1 text-xs">
                           <div className="flex justify-between">
                               <span>Economy</span>
                               <span className="font-bold text-gray-800">{seatInfo.seats.economy.available} left</span>
                           </div>
                           <div className="flex justify-between">
                               <span>Business</span>
                               <span className="font-bold text-purple-600">{seatInfo.seats.business.available} left</span>
                           </div>
                       </div>
                   )}
                </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;