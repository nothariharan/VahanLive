// server/src/seatManager.js
// Simple in-memory seat manager with simulated bookings and socket.io broadcasting

import { activeBuses } from './data/routesData.js';

let ioInstance = null;

// seatsMap keyed by busId
const seatsMap = new Map();

// default capacities
const DEFAULT_BUS_CAPACITY = 50;
const DEFAULT_FLIGHT_ECONOMY = 120;
const DEFAULT_FLIGHT_BUSINESS = 30;

export function initSeatManager(io) {
  ioInstance = io;

  // initialize seats for each active bus/flight
  activeBuses.forEach((veh) => {
    if (veh.type === 'bus') {
      // placeholder values: keep some buses with specified placeholders
      const initial = {
        busId: veh.busId,
        routeId: veh.routeId,
        type: 'bus',
        seats: {
          capacity: DEFAULT_BUS_CAPACITY,
          available: Math.floor(Math.random() * 30) + 15 // random placeholder
        }
      };

      // apply specific example placeholders
      if (veh.busId === 'MH-01-BUS-1001') {
        initial.seats.available = 32; // matches user's example
        initial.seats.capacity = 50;
      }

      seatsMap.set(veh.busId, initial);
    } else {
      // airway
      const initial = {
        busId: veh.busId,
        routeId: veh.routeId,
        type: 'airway',
        seats: {
          economy: { capacity: DEFAULT_FLIGHT_ECONOMY, available: Math.floor(Math.random() * 80) + 30 },
          business: { capacity: DEFAULT_FLIGHT_BUSINESS, available: Math.floor(Math.random() * 25) + 3 }
        }
      };

      // apply example placeholder
      if (veh.busId === 'AI-101') {
        initial.seats.economy.available = 45;
        initial.seats.business.available = 8;
      }

      seatsMap.set(veh.busId, initial);
    }
  });

  // start booking simulation
  startBookingSimulation();
}

export function getSeatsForRoute(routeId) {
  const results = [];
  seatsMap.forEach((value) => {
    if (value.routeId === routeId) results.push(value);
  });
  return results;
}

export function getAllSeats() {
  return Array.from(seatsMap.values());
}

export function getSeatsForBus(busId) {
  return seatsMap.get(busId) || null;
}

export function bookSeat(busId, options = { class: 'economy' }) {
  const record = seatsMap.get(busId);
  if (!record) return null;

  if (record.type === 'bus') {
    if (record.seats.available > 0) {
      record.seats.available -= 1;
    }
  } else {
    const cls = options.class || 'economy';
    if (record.seats[cls] && record.seats[cls].available > 0) {
      record.seats[cls].available -= 1;
    }
  }

  // broadcast update
  emitSeatUpdate(record);
  return record;
}

function emitSeatUpdate(record) {
  if (!ioInstance) return;

  const payload = {
    busId: record.busId,
    routeId: record.routeId,
    type: record.type,
    seats: record.seats,
    timestamp: new Date().toISOString()
  };

  // emit to route room so subscribers to that route get updates
  ioInstance.to(`route_${record.routeId}`).emit('seat_update', payload);
  // emit global seat update as well
  ioInstance.emit('seat_update', payload);
}

function startBookingSimulation() {
  // Randomly pick a bus/flight every 5-10 seconds and book a seat to simulate activity
  setInterval(() => {
    const items = Array.from(seatsMap.values());
    if (items.length === 0) return;

    const pick = items[Math.floor(Math.random() * items.length)];

    if (pick.type === 'bus') {
      if (pick.seats.available > 0 && Math.random() > 0.4) {
        pick.seats.available -= 1;
        emitSeatUpdate(pick);
        console.log(`[SeatSim] Booked 1 seat on ${pick.busId}. Remaining: ${pick.seats.available}`);
      }
    } else {
      // randomly book economy or business
      const cls = Math.random() > 0.85 ? 'business' : 'economy';
      if (pick.seats[cls] && pick.seats[cls].available > 0 && Math.random() > 0.5) {
        pick.seats[cls].available -= 1;
        emitSeatUpdate(pick);
        console.log(`[SeatSim] Booked 1 ${cls} seat on ${pick.busId}. Remaining: ${pick.seats[cls].available}`);
      }
    }
  }, 6000);
}
