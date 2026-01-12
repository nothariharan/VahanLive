import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { FaMagnifyingGlass } from 'react-icons/fa6';

const API_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

const SeatTracker = ({ watchedRoutes = [], onRemoveWatch }) => {
  const [socket, setSocket] = useState(null);
  const [seatsMap, setSeatsMap] = useState({}); // keyed by busId
  const [openBus, setOpenBus] = useState({}); // keyed by busId to track dropdowns

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      console.log('[SeatTracker] connected to seat socket');
    });

    s.on('seat_update', (payload) => {
      setSeatsMap((prev) => ({ ...prev, [payload.busId]: payload }));
    });

    // initial fetch
    axios.get(`${API_URL}/api/seats`).then((res) => {
      if (res.data && res.data.data) {
        const m = {};
        res.data.data.forEach((item) => (m[item.busId] = item));
        setSeatsMap(m);
      }
    }).catch((e) => console.error('error fetching seats', e));

    return () => {
      s.close();
    };
  }, []);

  // compute watched seats grouped by route
  const grouped = {};
  Object.values(seatsMap).forEach((item) => {
    if (!grouped[item.routeId]) grouped[item.routeId] = [];
    grouped[item.routeId].push(item);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mt-4">
      <span className='flex items-center jusify-center'><h2 className="font-bold mb-2">Seat Tracker</h2> <FaMagnifyingGlass className='ml-2 mb-2'/></span>
      {watchedRoutes.length === 0 && (
        <p className="text-sm text-gray-600">No routes watched. Click "Watch" on a route to monitor seats live.</p>
      )}

      <div className="space-y-2 mt-2">
        {watchedRoutes.map((route) => (
          <div key={route.id} className="p-2 rounded-lg border">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-semibold">{route.name}</div>
                <div className="text-xs text-gray-600">{route.type === 'airway' ? '✈️ Flight' : '🚌 Bus route'}</div>
              </div>
              <div className="text-right text-xs">
                <button
                  onClick={() => onRemoveWatch(route)}
                  className="bg-red-50 text-red-600 px-2 py-1 rounded text-sm hover:bg-red-100 focus:outline-none"
                >
                  Unwatch
                </button>
              </div>
            </div>

            <div className="mt-2 text-sm">
              {(grouped[route.id] || []).length === 0 && (
                <div className="text-gray-600">No seat data yet.</div>
              )}

              {(grouped[route.id] || []).map((bus) => (
                <div key={bus.busId} className="mt-1">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <button
                        onClick={() => setOpenBus((p) => ({ ...p, [bus.busId]: !p[bus.busId] }))}
                        className="w-full text-left flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-gray-100 focus:outline-none"
                        aria-expanded={!!openBus[bus.busId]}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="font-medium">{bus.busId}</span>
                          <span className="text-gray-600 text-sm truncate">
                            {bus.type === 'bus'
                              ? `Seats: ${bus.seats.available}/${bus.seats.capacity}`
                              : `Economy: ${bus.seats.economy.available}/${bus.seats.economy.capacity} • Business: ${bus.seats.business.available}/${bus.seats.business.capacity}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Updated: {new Date(bus.timestamp || Date.now()).toLocaleTimeString()}</span>
                          <svg className={`w-4 h-4 text-gray-400 transform ${openBus[bus.busId] ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.196l3.71-3.966a.75.75 0 111.08 1.04l-4.25 4.542a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>

                  {openBus[bus.busId] && (
                    <div className="mt-2 bg-gray-50 border rounded p-2 text-sm text-gray-700">
                      {bus.type === 'bus' ? (
                        <div>Seats available: <strong>{bus.seats.available}</strong> / {bus.seats.capacity}</div>
                      ) : (
                        <>
                          <div>Economy: <strong>{bus.seats.economy.available}</strong> / {bus.seats.economy.capacity}</div>
                          <div>Business: <strong>{bus.seats.business.available}</strong> / {bus.seats.business.capacity}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatTracker;