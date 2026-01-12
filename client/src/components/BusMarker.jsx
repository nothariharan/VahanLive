import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { interpolatePosition, easeInOutCubic } from '../utils/interpolation';
const BusMarker = ({ bus, routeColor, seatInfo, routeStops = [] }) => {
  const [currentPosition, setCurrentPosition] = useState(bus.position);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const startPositionRef = useRef(bus.position);
  const targetPositionRef = useRef(bus.position);

  // create custom vehicle icon (bus or airplane based on route type)
  const vehicleIcon = L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div class="vehicle-rot-wrapper" style="position: relative; transform: rotate(${bus.heading || 0}deg);">
        <div class="vehicle-scale-wrapper" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
          <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${routeColor};">
            <div class="vehicle-emoji" style="font-size:16px;line-height:1;color:white;">${bus.type === 'airway' ? '✈️' : '🚌'}</div>
          </div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // smooth animation using requestAnimationFrame
  useEffect(() => {
    if (
      bus.position.lat !== targetPositionRef.current.lat ||
      bus.position.lng !== targetPositionRef.current.lng
    ) {
      startPositionRef.current = currentPosition;
      targetPositionRef.current = bus.position;
      setIsAnimating(true);

      const calculateDuration = () => {
        const start = startPositionRef.current;
        const target = targetPositionRef.current;
        const distance = haversineMeters(start, target); // meters
        const speed_m_s = Math.max((bus.speed || 5) * 1000 / 3600, 0.1); // m/s
        const rawDurationMs = (distance / speed_m_s) * 1000; // ms
        const TIME_SCALE = 60; // compress real world time by this factor for UI
        const scaled = Math.max(800, Math.min(rawDurationMs / TIME_SCALE, 120000));
        return scaled;
      };

      const duration = calculateDuration();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        const newPosition = interpolatePosition(
          startPositionRef.current,
          targetPositionRef.current,
          easedProgress
        );

        setCurrentPosition(newPosition);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [bus.position]);

  return (
    <Marker position={[currentPosition.lat, currentPosition.lng]} icon={vehicleIcon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">{bus.type === 'airway' ? 'Flight' : 'Bus'} {bus.busId}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">Route:</span> {bus.routeId}</p>
            <p><span className="font-semibold">Speed:</span> {bus.speed} km/h</p>
            <p><span className="font-semibold">Passengers:</span> {bus.passengers}</p>

            {/* seat info */}
            {seatInfo && seatInfo.type === 'bus' && (
              <p><span className="font-semibold">Seats:</span> {seatInfo.seats.available}/{seatInfo.seats.capacity} available</p>
            )}

            {seatInfo && seatInfo.type === 'airway' && (
              <div>
                <p><span className="font-semibold">Economy:</span> {seatInfo.seats.economy.available}/{seatInfo.seats.economy.capacity} available</p>
                <p><span className="font-semibold">Business:</span> {seatInfo.seats.business.available}/{seatInfo.seats.business.capacity} available</p>
              </div>
            )}

            <p><span className="font-semibold">Status:</span> 
              <span className={`ml-1 ${isAnimating ? 'text-green-600' : 'text-gray-600'}`}>
                {isAnimating ? 'Moving' : 'Stopped'}
              </span>
            </p>

            {/* Next stop (approx) */}
            {routeStops.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">Next stop: {getNearestStopName({lat: bus.position.lat, lng: bus.position.lng}, routeStops)}</p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;

// thank you ai for the formula lol
function haversineMeters(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters

  const lat1 = coords1.lat || coords1.latitude;
  const lon1 = coords1.lng || coords1.longitude;
  const lat2 = coords2.lat || coords2.latitude;
  const lon2 = coords2.lng || coords2.longitude;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getNearestStopName(pos, stops) {
  let nearest = null;
  let minDist = Number.POSITIVE_INFINITY;
  stops.forEach((s) => {
    const d = haversineMeters(pos, { lat: s.lat, lng: s.lng });
    if (d < minDist) {
      minDist = d;
      nearest = s.name;
    }
  });
  return nearest || 'Unknown';
}