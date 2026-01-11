// linear interpolation for smooth marker movement
export function interpolatePosition(start, end, progress) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress
  };
}

// dist btw coords
export function calculateDistance(pos1, pos2) {
  const R = 6371; 
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// easing function for smooth animation
export function easeInOutCubic(t) {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}