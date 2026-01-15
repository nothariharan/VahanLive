import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import BusMarker from './BusMarker';

// Mobile detection
const isMobileDevice = () => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

// Component to handle mobile-specific optimizations
function MobileOptimizations() {
  const map = useMap();
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return null;
}

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map view when route changes or when a live route has a moving driver
function MapViewController({ route, buses, isMobile }) {
  const map = useMap();
  const lastAutoZoomFor = useRef(null);
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoom', handleZoom);
    return () => map.off('zoom', handleZoom);
  }, [map]);

  useEffect(() => {
    const routeId = route?.id || (buses && buses.length ? buses[0].routeId : null);
    if (!routeId) return;

    // Only auto-zoom once per route selection
    if (lastAutoZoomFor.current === routeId) return;
    lastAutoZoomFor.current = routeId;

    if (route && route.path && route.path.length > 0) {
      const bounds = L.latLngBounds(route.path);
      map.fitBounds(bounds, { padding: [50, 50] });
      return;
    }

    // If no route path (live route), center on the driver for that route (if available)
    const liveBus = (buses || []).find(b => b.routeId === routeId) || (buses && buses[0]);
    if (liveBus && liveBus.position && typeof liveBus.position.lat === 'number' && typeof liveBus.position.lng === 'number') {
      map.setView([liveBus.position.lat, liveBus.position.lng], 14);
    }
  }, [route?.id, map]); // depend only on route.id so we auto-zoom once per route change

  return null;
}

const MapComponent = ({ selectedRoute, buses, seatsMap = {}, routeSeatsMap = {} }) => {
  const isMobile = isMobileDevice();
  const [visibleBuses, setVisibleBuses] = useState([]);
  const [zoom, setZoom] = useState(5);

  const [busStopIcon] = useState(() => 
    L.divIcon({
      className: 'custom-bus-stop-marker',
      html: `
        <div style="
          background-color: white;
          border: 3px solid #4A5568;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
  );

  // Default center (India)
  const defaultCenter = [22.9734, 78.6569];
  const defaultZoom = 5;
  const indiaBounds = [[6.0, 68.0], [36.0, 98.0]]; // southWest, northEast

  // FIX 2: Handle zoom changes for bus visibility on mobile
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
    if (isMobile && newZoom >= 10) {
      setVisibleBuses(buses);
    } else if (isMobile && newZoom < 10) {
      // Lazy load: only show buses that are moving or in viewport
      setVisibleBuses(buses.filter(b => b.status !== 'inactive'));
    } else {
      setVisibleBuses(buses);
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      minZoom={4}
      maxZoom={16}
      maxBounds={indiaBounds}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      onZoomend={(e) => handleZoomChange(e.target.getZoom())}
    >
      <MobileOptimizations />
      
      {/* FIX 1: Lighter tile layer on mobile using CartoDB Positron */}
      <TileLayer
        attribution={isMobile ? '&copy; <a href="https://carto.com/">CARTO</a>' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
        url={isMobile 
          ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
      />

      {selectedRoute && (
        <>
          <MapViewController route={selectedRoute} buses={visibleBuses || buses} isMobile={isMobile} />
          
          {/* FIX 4: Thinner polylines on mobile */}
          <Polyline
            positions={selectedRoute.path}
            pathOptions={{
              color: selectedRoute.color,
              weight: isMobile ? 2 : 4,
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          />

          {/* FIX 3: Hide bus stops at low zoom on mobile */}
          {(!isMobile || zoom >= 10) && selectedRoute.stops.map((stop) => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={busStopIcon}
            >
              <Popup>
                <div className="p-3 max-w-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-md">{stop.name}</h3>
                      <p className="text-xs text-gray-500">Bus Stop</p>
                    </div>
                    <div className="ml-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">🚍</div>
                    </div>
                  </div>

                  {selectedRoute && routeSeatsMap && routeSeatsMap[selectedRoute.id] && (() => {
                    const s = routeSeatsMap[selectedRoute.id];
                    const available = s.available || 0;
                    const capacity = s.capacity || 0;
                    const pct = capacity ? Math.round((available / capacity) * 100) : 0;
                    return (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Seats: {available}/{capacity}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-2 bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{pct}% available</div>
                      </div>
                    );
                  })()}

                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* FIX 2: Lazy render bus markers on mobile (only active ones or those in viewport) */}
      {(visibleBuses && visibleBuses.length > 0 ? visibleBuses : buses).map((bus) => (
        <BusMarker
          key={bus.busId}
          bus={bus}
          routeColor={selectedRoute?.color || '#4299E1'}
          seatInfo={seatsMap ? seatsMap[bus.busId] : null}
          routeStops={selectedRoute && selectedRoute.id === bus.routeId ? selectedRoute.stops : []}
        />
      ))}
    </MapContainer>
  );
};

export default MapComponent;