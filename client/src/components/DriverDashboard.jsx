// client/src/components/DriverDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Your backend URL

export default function DriverDashboard() {
  const [busDetails, setBusDetails] = useState({ busId: '', route: '', capacity: '' });
  const [isDriving, setIsDriving] = useState(false);
  const [status, setStatus] = useState('Idle');
  const watchId = useRef(null);

  const startDriving = (e) => {
    e.preventDefault();
    if (!busDetails.busId || !busDetails.route) return alert("Fill in details!");
    
    setIsDriving(true);
    setStatus('Initializing GPS...');

    // THE MAGIC: Real-time GPS tracking
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed } = position.coords;
          
          setStatus(`Broadcasting: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

          // Send this real data to your backend
          socket.emit('driver_location_update', {
            busId: busDetails.busId,
            route: busDetails.route,
            location: { lat: latitude, lng: longitude },
            heading: heading || 0,
            speed: speed || 0,
            type: 'REAL_DRIVER' // Tag it so the map knows it's real
          });
        },
        (error) => setStatus(`Error: ${error.message}`),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const stopDriving = () => {
    setIsDriving(false);
    setStatus('Stopped');
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    socket.emit('driver_disconnected', { busId: busDetails.busId });
  };

  if (!isDriving) {
    return (
      <div className="p-8 max-w-md mx-auto bg-white shadow-xl rounded-xl mt-10">
        <h2 className="text-2xl font-bold mb-4">🚎 Driver Login</h2>
        <form onSubmit={startDriving} className="space-y-4">
          <input 
            placeholder="Bus Number (e.g., TN-45-1234)" 
            className="w-full p-2 border rounded"
            onChange={e => setBusDetails({...busDetails, busId: e.target.value})}
          />
          <input 
            placeholder="Route Name (e.g., Downtown Loop)" 
            className="w-full p-2 border rounded"
            onChange={e => setBusDetails({...busDetails, route: e.target.value})}
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
            Start Route
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
      <div className="animate-pulse w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">📡</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">You are Live!</h1>
      <p className="text-slate-400 mb-8">{status}</p>
      <button onClick={stopDriving} className="bg-red-500 px-8 py-3 rounded-full font-bold">
        Stop Driving
      </button>
    </div>
  );
}