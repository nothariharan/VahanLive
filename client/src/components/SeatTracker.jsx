import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { MdEventSeat, MdFlightClass, MdDirectionsBus, MdClose } from 'react-icons/md'; // Added generic icons for better UI

import { API_URL,SOCKET_URL } from '../config';

const SeatTracker = ({ watchedRoutes = [], onRemoveWatch }) => {
  const [socket, setSocket] = useState(null);
  const [seatsMap, setSeatsMap] = useState({}); // keyed by busId
  const [openBus, setOpenBus] = useState({}); // keyed by busId

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

  // Helper component for Progress Bar
  const CapacityBar = ({ available, capacity, label, colorClass = "bg-green-500" }) => {
    const percentage = Math.min(100, Math.max(0, (available / capacity) * 100));
    return (
      <div className="w-full mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="text-gray-800 font-bold">{available} <span className="text-gray-400 font-normal">/ {capacity}</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${percentage < 20 ? 'bg-red-500' : colorClass}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-4">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <FaMagnifyingGlass size={14} />
        </div>
        <div>
          <h2 className="font-bold text-gray-800">Seat Tracker</h2>
          <p className="text-xs text-gray-500">Live capacity monitoring</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {watchedRoutes.length === 0 && (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <MdEventSeat className="mx-auto text-gray-300 text-3xl mb-2" />
            <p className="text-sm text-gray-500">No routes watched.</p>
            <p className="text-xs text-gray-400 mt-1">Select a route to monitor seats live.</p>
          </div>
        )}

        {watchedRoutes.map((route) => (
          <div key={route.id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Route Header */}
            <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-b border-gray-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg">
                  {route.type === 'airway' ? <MdFlightClass className="text-purple-500"/> : <MdDirectionsBus className="text-emerald-500"/>}
                </span>
                <div>
                  <div className="font-bold text-sm text-gray-800 truncate">{route.name}</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                    {route.type === 'airway' ? 'Flight' : 'Bus Route'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemoveWatch(route)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                title="Stop watching"
              >
                <MdClose />
              </button>
            </div>

            {/* Vehicle List */}
            <div className="bg-white">
              {(grouped[route.id] || []).length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 italic">Waiting for live data...</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(grouped[route.id] || []).map((bus) => (
                    <div key={bus.busId} className="group">
                      <button
                        onClick={() => setOpenBus((p) => ({ ...p, [bus.busId]: !p[bus.busId] }))}
                        className="w-full text-left p-3 hover:bg-blue-50/50 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* ID & Basic Info */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-1 h-8 rounded-full ${bus.type === 'airway' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                            <div>
                              <div className="font-mono text-xs font-bold text-gray-700">{bus.busId}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full inline-block ${new Date() - new Date(bus.timestamp) < 60000 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                {new Date(bus.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats & Chevron */}
                          <div className="flex items-center gap-3">
                             {/* Mini Badge for Available */}
                             <div className="text-right">
                                {bus.type === 'bus' ? (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {bus.seats.available} Seats
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                        {bus.seats.economy.available + bus.seats.business.available} Seats
                                    </span>
                                )}
                             </div>
                             
                            <svg 
                                className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${openBus[bus.busId] ? 'rotate-180' : ''}`} 
                                viewBox="0 0 20 20" fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.196l3.71-3.966a.75.75 0 111.08 1.04l-4.25 4.542a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {openBus[bus.busId] && (
                        <div className="px-3 pb-3 pt-0 bg-blue-50/30 animate-in slide-in-from-top-1 duration-200">
                          <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            {bus.type === 'bus' ? (
                              <CapacityBar 
                                available={bus.seats.available} 
                                capacity={bus.seats.capacity} 
                                label="Standard Seats" 
                                colorClass="bg-emerald-500" 
                              />
                            ) : (
                              <div className="space-y-3">
                                <CapacityBar 
                                  available={bus.seats.economy.available} 
                                  capacity={bus.seats.economy.capacity} 
                                  label="Economy Class" 
                                  colorClass="bg-blue-500" 
                                />
                                <div className="border-t border-dashed border-gray-100"></div>
                                <CapacityBar 
                                  available={bus.seats.business.available} 
                                  capacity={bus.seats.business.capacity} 
                                  label="Business Class" 
                                  colorClass="bg-purple-500" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatTracker;