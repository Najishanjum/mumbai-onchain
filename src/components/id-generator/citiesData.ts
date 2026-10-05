// Geodesic distance, coordinate databases and search for MumbaiOnChain Journey Card

export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
  country: string;
  isDomestic?: boolean;
}

export const MUMBAI_COORDS: [number, number] = [19.0760, 72.8777];

export const PRESET_CITIES: CityLocation[] = [
  // India Core & Regional Tech Hubs
  { name: 'Jabalpur', lat: 23.1815, lon: 79.9864, country: 'IN', isDomestic: true },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, country: 'IN', isDomestic: true },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, country: 'IN', isDomestic: true },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, country: 'IN', isDomestic: true },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, country: 'IN', isDomestic: true },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, country: 'IN', isDomestic: true },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, country: 'IN', isDomestic: true },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'IN', isDomestic: true },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, country: 'IN', isDomestic: true },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, country: 'IN', isDomestic: true },
  { name: 'Indore', lat: 22.7196, lon: 75.8577, country: 'IN', isDomestic: true },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126, country: 'IN', isDomestic: true },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882, country: 'IN', isDomestic: true },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462, country: 'IN', isDomestic: true },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, country: 'IN', isDomestic: true },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673, country: 'IN', isDomestic: true },
  { name: 'Goa', lat: 15.2993, lon: 74.1240, country: 'IN', isDomestic: true },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898, country: 'IN', isDomestic: true },
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812, country: 'IN', isDomestic: true },
  { name: 'Patna', lat: 25.5941, lon: 85.1376, country: 'IN', isDomestic: true },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, country: 'IN', isDomestic: true },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, country: 'IN', isDomestic: true },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362, country: 'IN', isDomestic: true },
  { name: 'Amravati', lat: 20.9320, lon: 77.7523, country: 'IN', isDomestic: true },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433, country: 'IN', isDomestic: true },
  { name: 'Nanded', lat: 19.1383, lon: 77.3210, country: 'IN', isDomestic: true },
  { name: 'Chandrapur', lat: 19.9615, lon: 79.2961, country: 'IN', isDomestic: true },
  { name: 'Udaipur', lat: 24.5854, lon: 73.7125, country: 'IN', isDomestic: true },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'IN', isDomestic: true },

  // Global Web3 Hubs
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'AE', isDomestic: false },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'SG', isDomestic: false },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB', isDomestic: false },
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'US', isDomestic: false },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'US', isDomestic: false },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050, country: 'DE', isDomestic: false },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'JP', isDomestic: false },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'TH', isDomestic: false },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR', isDomestic: false },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'KR', isDomestic: false },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, country: 'CA', isDomestic: false },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, country: 'HK', isDomestic: false },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', isDomestic: false },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417, country: 'CH', isDomestic: false },
];

export const MAP_NODES: [string, number, number][] = [
  ['Indore', 22.72, 75.86],
  ['Vadodara', 22.31, 73.18],
  ['Surat', 21.17, 72.83],
  ['Nashik', 20.0, 73.79],
  ['Pune', 18.52, 73.86],
  ['Aurangabad', 19.88, 75.34],
  ['Amravati', 20.93, 77.75],
  ['Nanded', 19.15, 77.31],
  ['Chandrapur', 19.96, 79.3],
  ['Nagpur', 21.15, 79.08],
  ['Bhopal', 23.26, 77.41],
  ['Jabalpur', 23.18, 79.99],
  ['Hyderabad', 17.39, 78.49],
  ['Ahmedabad', 23.02, 72.57],
  ['Bengaluru', 12.97, 77.59]
];

export const STATES_OUTLINES: [string, number, number][] = [
  ['MAHARASHTRA', 19.3, 75.6],
  ['MADHYA PRADESH', 23.4, 78.2],
  ['GUJARAT', 22.6, 71.4],
  ['TELANGANA', 17.9, 79.1],
  ['KARNATAKA', 14.9, 75.9],
  ['CHHATTISGARH', 21.4, 82.0],
  ['RAJASTHAN', 26.6, 73.9],
  ['ANDHRA PRADESH', 15.6, 79.6],
  ['ODISHA', 20.6, 84.4],
  ['UTTAR PRADESH', 27.0, 80.6],
  ['GOA', 15.35, 74.05]
];

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Great-circle Haversine distance in Kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Compute arc interpolation points along the Great Circle
export function getGreatCirclePoints(
  from: [number, number],
  to: [number, number],
  steps: number = 100
): [number, number][] {
  const [lat1, lon1] = [toRad(from[0]), toRad(from[1])];
  const [lat2, lon2] = [toRad(to[0]), toRad(to[1])];

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    if (d < 1e-9) {
      points.push([from[0], from[1]]);
      continue;
    }
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = toDeg(Math.atan2(z, Math.hypot(x, y)));
    const lon = toDeg(Math.atan2(y, x));
    points.push([lat, lon]);
  }
  return points;
}
