import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import BusMarker from './BusMarker';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map view when route changes
function MapViewController({ route }) {
  const map = useMap();
  
  useEffect(() => {
    if (route && route.path && route.path.length > 0) {
      const bounds = L.latLngBounds(route.path);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  
  return null;
}

const MapComponent = ({ selectedRoute, buses }) => {
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

  // Default center (New York City)
  const defaultCenter = [40.7128, -74.0060];
  const defaultZoom = 12;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selectedRoute && (
        <>
          <MapViewController route={selectedRoute} />
          
          {/* Route path polyline */}
          <Polyline
            positions={selectedRoute.path}
            pathOptions={{
              color: selectedRoute.color,
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          />

          {/* Bus stops */}
          {selectedRoute.stops.map((stop) => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={busStopIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{stop.name}</h3>
                  <p className="text-sm text-gray-600">Bus Stop</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* Active buses */}
      {buses.map((bus) => (
        <BusMarker
          key={bus.busId}
          bus={bus}
          routeColor={selectedRoute?.color || '#4299E1'}
        />
      ))}
    </MapContainer>
  );
};

export default MapComponent;