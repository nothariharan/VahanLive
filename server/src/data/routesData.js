// server/src/data/routesData.js
// Comprehensive Indian transport data with Bus and Airways

export const routesData = [
  // BUS ROUTES
  {
    id: 'route_1',
    name: 'Route 1: Mumbai Express - West Coast Connector',
    type: 'bus',
    color: '#FF6B6B',
    stops: [
      { id: 'stop_1', name: 'Mumbai Central', lat: 19.0760, lng: 72.8777 },
      { id: 'stop_2', name: 'Thane Junction', lat: 19.1972, lng: 72.9722 },
      { id: 'stop_3', name: 'Nashik Road', lat: 19.9975, lng: 73.7898 },
      { id: 'stop_4', name: 'Surat Central', lat: 21.1702, lng: 72.8311 },
      { id: 'stop_5', name: 'Vadodara Station', lat: 22.3072, lng: 73.1812 },
      { id: 'stop_6', name: 'Ahmedabad Terminal', lat: 23.0225, lng: 72.5714 },
      { id: 'stop_7', name: 'Rajkot Junction', lat: 22.3039, lng: 70.8022 }
    ],
    path: [
      [19.0760, 72.8777], [19.1200, 72.9000], [19.1972, 72.9722],
      [19.3500, 73.1000], [19.5500, 73.3000], [19.7500, 73.5500],
      [19.9975, 73.7898], [20.3000, 73.5000], [20.6000, 73.2000],
      [21.1702, 72.8311], [21.5000, 72.9000], [21.8500, 73.0500],
      [22.3072, 73.1812], [22.6000, 73.0500], [22.8000, 72.8500],
      [23.0225, 72.5714], [22.7500, 71.8000], [22.5500, 71.2000],
      [22.3039, 70.8022]
    ],
    schedule: {
      frequency: '15 minutes',
      operatingHours: '5:00 AM - 11:00 PM'
    }
  },
  {
    id: 'route_2',
    name: 'Route 2: Delhi-Jaipur Highway',
    type: 'bus',
    color: '#4ECDC4',
    stops: [
      { id: 'stop_8', name: 'Delhi ISBT', lat: 28.7041, lng: 77.1025 },
      { id: 'stop_9', name: 'Gurgaon Cyber Hub', lat: 28.4595, lng: 77.0266 },
      { id: 'stop_10', name: 'Rewari Junction', lat: 28.1989, lng: 76.6189 },
      { id: 'stop_11', name: 'Alwar Station', lat: 27.5530, lng: 76.6346 },
      { id: 'stop_12', name: 'Jaipur Central', lat: 26.9124, lng: 75.7873 }
    ],
    path: [
      [28.7041, 77.1025], [28.6500, 77.0500], [28.4595, 77.0266],
      [28.3500, 76.9000], [28.1989, 76.6189], [28.0000, 76.6000],
      [27.7500, 76.6200], [27.5530, 76.6346], [27.3000, 76.4000],
      [27.1000, 76.1000], [26.9124, 75.7873]
    ],
    schedule: {
      frequency: '20 minutes',
      operatingHours: '6:00 AM - 10:00 PM'
    }
  },
  {
    id: 'route_3',
    name: 'Route 3: South India Circular - Bangalore-Chennai-Hyderabad',
    type: 'bus',
    color: '#95E1D3',
    stops: [
      { id: 'stop_13', name: 'Bangalore Majestic', lat: 12.9716, lng: 77.5946 },
      { id: 'stop_14', name: 'Hosur Junction', lat: 12.7409, lng: 77.8253 },
      { id: 'stop_15', name: 'Vellore Fort', lat: 12.9165, lng: 79.1325 },
      { id: 'stop_16', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
      { id: 'stop_17', name: 'Nellore City', lat: 14.4426, lng: 79.9865 },
      { id: 'stop_18', name: 'Ongole Market', lat: 15.5057, lng: 80.0499 },
      { id: 'stop_19', name: 'Vijayawada Junction', lat: 16.5062, lng: 80.6480 },
      { id: 'stop_20', name: 'Hyderabad Secunderabad', lat: 17.3850, lng: 78.4867 }
    ],
    path: [
      [12.9716, 77.5946], [12.8500, 77.7000], [12.7409, 77.8253],
      [12.8000, 78.2000], [12.9165, 79.1325], [13.0000, 79.5000],
      [13.0827, 80.2707], [13.5000, 80.1000], [14.0000, 80.0000],
      [14.4426, 79.9865], [15.0000, 80.0200], [15.5057, 80.0499],
      [16.0000, 80.3500], [16.5062, 80.6480], [17.0000, 79.8000],
      [17.3850, 78.4867]
    ],
    schedule: {
      frequency: '25 minutes',
      operatingHours: '5:30 AM - 11:30 PM'
    }
  },
  {
    id: 'route_4',
    name: 'Route 4: Kolkata Metro Connect',
    type: 'bus',
    color: '#F38181',
    stops: [
      { id: 'stop_21', name: 'Kolkata Howrah', lat: 22.5726, lng: 88.3639 },
      { id: 'stop_22', name: 'Salt Lake Sector V', lat: 22.5726, lng: 88.4300 },
      { id: 'stop_23', name: 'Durgapur Steel City', lat: 23.5204, lng: 87.3119 },
      { id: 'stop_24', name: 'Asansol Junction', lat: 23.6739, lng: 86.9524 }
    ],
    path: [
      [22.5726, 88.3639], [22.5726, 88.4300], [22.8000, 88.2000],
      [23.0000, 87.8000], [23.2500, 87.5500], [23.5204, 87.3119],
      [23.6000, 87.1500], [23.6739, 86.9524]
    ],
    schedule: {
      frequency: '12 minutes',
      operatingHours: '6:00 AM - 9:00 PM'
    }
  },
  {
    id: 'route_5',
    name: 'Route 5: Punjab Express - North Belt',
    type: 'bus',
    color: '#AA96DA',
    stops: [
      { id: 'stop_25', name: 'Amritsar Golden Temple', lat: 31.6340, lng: 74.8723 },
      { id: 'stop_26', name: 'Jalandhar Cantt', lat: 31.3260, lng: 75.5762 },
      { id: 'stop_27', name: 'Ludhiana Junction', lat: 30.9010, lng: 75.8573 },
      { id: 'stop_28', name: 'Patiala Bus Stand', lat: 30.3398, lng: 76.3869 },
      { id: 'stop_29', name: 'Chandigarh ISBT', lat: 30.7333, lng: 76.7794 }
    ],
    path: [
      [31.6340, 74.8723], [31.5000, 75.2000], [31.3260, 75.5762],
      [31.1500, 75.7000], [30.9010, 75.8573], [30.6000, 76.1000],
      [30.3398, 76.3869], [30.5000, 76.5500], [30.7333, 76.7794]
    ],
    schedule: {
      frequency: '18 minutes',
      operatingHours: '5:00 AM - 10:00 PM'
    }
  },

  // AIRWAYS ROUTES - Much slower, longer journeys
  {
    id: 'airway_1',
    name: 'Air India: Kolkata - Chennai Express',
    type: 'airway',
    color: '#FF9800',
    stops: [
      { id: 'stop_21', name: 'Kolkata Howrah', lat: 22.5726, lng: 88.3639 },
      { id: 'stop_16', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 }
    ],
    path: [
      [22.5726, 88.3639],
      [21.5000, 87.0000],
      [20.0000, 85.5000],
      [18.5000, 84.0000],
      [17.0000, 83.0000],
      [15.5000, 82.0000],
      [14.0000, 81.0000],
      [13.0827, 80.2707]
    ],
    schedule: {
      frequency: '2 hours',
      operatingHours: '6:00 AM - 8:00 PM',
      duration: '2.5 hours'
    }
  },
  {
    id: 'airway_2',
    name: 'IndiGo: Delhi - Bangalore Direct',
    type: 'airway',
    color: '#2196F3',
    stops: [
      { id: 'stop_8', name: 'Delhi ISBT', lat: 28.7041, lng: 77.1025 },
      { id: 'stop_13', name: 'Bangalore Majestic', lat: 12.9716, lng: 77.5946 }
    ],
    path: [
      [28.7041, 77.1025],
      [26.5000, 77.3000],
      [24.0000, 77.5000],
      [21.5000, 77.6000],
      [19.0000, 77.6000],
      [16.5000, 77.6000],
      [14.0000, 77.6000],
      [12.9716, 77.5946]
    ],
    schedule: {
      frequency: '3 hours',
      operatingHours: '5:00 AM - 10:00 PM',
      duration: '3 hours'
    }
  },
  {
    id: 'airway_3',
    name: 'SpiceJet: Mumbai - Kolkata Route',
    type: 'airway',
    color: '#E91E63',
    stops: [
      { id: 'stop_1', name: 'Mumbai Central', lat: 19.0760, lng: 72.8777 },
      { id: 'stop_21', name: 'Kolkata Howrah', lat: 22.5726, lng: 88.3639 }
    ],
    path: [
      [19.0760, 72.8777],
      [19.5000, 75.0000],
      [20.0000, 77.5000],
      [20.5000, 80.0000],
      [21.0000, 82.5000],
      [21.5000, 85.0000],
      [22.0000, 86.5000],
      [22.5726, 88.3639]
    ],
    schedule: {
      frequency: '4 hours',
      operatingHours: '6:00 AM - 9:00 PM',
      duration: '2.5 hours'
    }
  },
  {
    id: 'airway_4',
    name: 'Air Asia: Jaipur - Hyderabad Connect',
    type: 'airway',
    color: '#9C27B0',
    stops: [
      { id: 'stop_12', name: 'Jaipur Central', lat: 26.9124, lng: 75.7873 },
      { id: 'stop_20', name: 'Hyderabad Secunderabad', lat: 17.3850, lng: 78.4867 }
    ],
    path: [
      [26.9124, 75.7873],
      [25.0000, 76.2000],
      [23.0000, 76.7000],
      [21.0000, 77.2000],
      [19.0000, 77.7000],
      [17.3850, 78.4867]
    ],
    schedule: {
      frequency: '5 hours',
      operatingHours: '7:00 AM - 7:00 PM',
      duration: '2 hours'
    }
  }
];

// Active buses and flights with realistic speeds
export const activeBuses = [
  // BUS ROUTES - VERY SLOW (5-8 km/h coordinate movement)
  { busId: 'MH-01-BUS-1001', routeId: 'route_1', startIndex: 0, speed: 6, type: 'bus' },
  { busId: 'MH-01-BUS-1002', routeId: 'route_1', startIndex: 10, speed: 7, type: 'bus' },
  { busId: 'DL-02-BUS-2001', routeId: 'route_2', startIndex: 0, speed: 5, type: 'bus' },
  { busId: 'KA-03-BUS-3001', routeId: 'route_3', startIndex: 0, speed: 6, type: 'bus' },
  { busId: 'TN-03-BUS-3002', routeId: 'route_3', startIndex: 8, speed: 5, type: 'bus' },
  { busId: 'WB-04-BUS-4001', routeId: 'route_4', startIndex: 0, speed: 8, type: 'bus' },
  { busId: 'PB-05-BUS-5001', routeId: 'route_5', startIndex: 0, speed: 6, type: 'bus' },
  
  // AIRWAYS - EXTREMELY slow (simulating long journey times, 2-4 km/h coordinate movement)
  { busId: 'AI-101', routeId: 'airway_1', startIndex: 0, speed: 3, type: 'airway' },
  { busId: '6E-202', routeId: 'airway_2', startIndex: 0, speed: 4, type: 'airway' },
  { busId: 'SG-303', routeId: 'airway_3', startIndex: 0, speed: 2, type: 'airway' },
  { busId: 'I5-404', routeId: 'airway_4', startIndex: 0, speed: 4, type: 'airway' }
];

// Helper function to find routes between two stops
export function findOptimalRoute(startStopId, endStopId) {
  const results = [];
  
  routesData.forEach(route => {
    const startIndex = route.stops.findIndex(stop => stop.id === startStopId);
    const endIndex = route.stops.findIndex(stop => stop.id === endStopId);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const stopsCount = Math.abs(endIndex - startIndex);
      // Calculate time based on type
      let estimatedTime;
      if (route.type === 'airway') {
        estimatedTime = parseInt(route.schedule.duration) * 60; // Convert hours to minutes
      } else {
        estimatedTime = stopsCount * 12; // 12 minutes per stop for bus
      }
      
      results.push({
        routeId: route.id,
        routeName: route.name,
        routeColor: route.color,
        routeType: route.type,
        startStop: route.stops[startIndex].name,
        endStop: route.stops[endIndex].name,
        stopsCount: stopsCount,
        estimatedTime: estimatedTime,
        isDirect: true
      });
    }
  });
  
  // Sort: Bus routes first (by stops), then airways (by time)
  return results.sort((a, b) => {
    if (a.routeType === b.routeType) {
      return a.routeType === 'bus' ? a.stopsCount - b.stopsCount : a.estimatedTime - b.estimatedTime;
    }
    return a.routeType === 'bus' ? -1 : 1;
  });
}

// Get all unique stops across all routes
export function getAllStops() {
  const stopsMap = new Map();
  
  routesData.forEach(route => {
    route.stops.forEach(stop => {
      if (!stopsMap.has(stop.id)) {
        stopsMap.set(stop.id, {
          ...stop,
          routes: [{ id: route.id, type: route.type }]
        });
      } else {
        const existing = stopsMap.get(stop.id);
        existing.routes.push({ id: route.id, type: route.type });
      }
    });
  });
  
  return Array.from(stopsMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}