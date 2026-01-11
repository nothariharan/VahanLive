import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { interpolatePosition, easeInOutCubic } from '../utils/interpolation';

const BusMarker = ({ bus, routeColor }) => {
  const [currentPosition, setCurrentPosition] = useState(bus.position);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const startPositionRef = useRef(bus.position);
  const targetPositionRef = useRef(bus.position);

  // Create custom bus icon
  const busIcon = L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; transform: rotate(${bus.heading || 0}deg);">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${routeColor}" opacity="0.2"/>
          <circle cx="16" cy="16" r="10" fill="${routeColor}"/>
          <path d="M16 8L20 12H12L16 8Z" fill="white"/>
          <circle cx="16" cy="16" r="2" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    if (
      bus.position.lat !== targetPositionRef.current.lat ||
      bus.position.lng !== targetPositionRef.current.lng
    ) {
      startPositionRef.current = currentPosition;
      targetPositionRef.current = bus.position;
      setIsAnimating(true);

      const duration = 3000; // 3 seconds to match server update interval
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
    <Marker position={[currentPosition.lat, currentPosition.lng]} icon={busIcon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">Bus {bus.busId}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">Route:</span> {bus.routeId}</p>
            <p><span className="font-semibold">Speed:</span> {bus.speed} km/h</p>
            <p><span className="font-semibold">Passengers:</span> {bus.passengers}</p>
            <p><span className="font-semibold">Status:</span> 
              <span className={`ml-1 ${isAnimating ? 'text-green-600' : 'text-gray-600'}`}>
                {isAnimating ? 'Moving' : 'Stopped'}
              </span>
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;