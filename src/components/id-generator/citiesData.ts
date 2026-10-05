// Geodesic distance, coordinate databases and search for MumbaiOnChain Journey Card

export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
  country: string;
  isDomestic?: boolean;
}

export const MUMBAI_COORDS: [number, number] = [19.0760, 72.8777];

// Global Nations, Major Hubs, and Comprehensive Indian Cities
export const PRESET_CITIES: CityLocation[] = [
  // Global Countries & Continents (Direct matches for country searches like 'USA', 'Germany', etc.)
  { name: 'USA', lat: 37.0902, lon: -95.7129, country: 'United States', isDomestic: false },
  { name: 'United States', lat: 37.0902, lon: -95.7129, country: 'United States', isDomestic: false },
  { name: 'United Kingdom', lat: 55.3781, lon: -3.4360, country: 'UK', isDomestic: false },
  { name: 'Germany', lat: 51.1657, lon: 10.4515, country: 'Germany', isDomestic: false },
  { name: 'France', lat: 46.2276, lon: 2.2137, country: 'France', isDomestic: false },
  { name: 'Japan', lat: 36.2048, lon: 138.2529, country: 'Japan', isDomestic: false },
  { name: 'Canada', lat: 56.1304, lon: -106.3468, country: 'Canada', isDomestic: false },
  { name: 'Australia', lat: -25.2744, lon: 133.7751, country: 'Australia', isDomestic: false },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore', isDomestic: false },
  { name: 'UAE', lat: 23.4241, lon: 53.8478, country: 'UAE', isDomestic: false },
  { name: 'Switzerland', lat: 46.8182, lon: 8.2275, country: 'Switzerland', isDomestic: false },
  { name: 'Netherlands', lat: 52.1326, lon: 5.2913, country: 'Netherlands', isDomestic: false },
  { name: 'Portugal', lat: 39.3999, lon: -8.2245, country: 'Portugal', isDomestic: false },
  { name: 'Spain', lat: 40.4637, lon: -3.7492, country: 'Spain', isDomestic: false },
  { name: 'Italy', lat: 41.8719, lon: 12.5674, country: 'Italy', isDomestic: false },
  { name: 'South Korea', lat: 35.9078, lon: 127.7669, country: 'South Korea', isDomestic: false },
  { name: 'Brazil', lat: -14.2350, lon: -51.9253, country: 'Brazil', isDomestic: false },
  { name: 'Argentina', lat: -38.4161, lon: -63.6167, country: 'Argentina', isDomestic: false },
  { name: 'Nigeria', lat: 9.0820, lon: 8.6753, country: 'Nigeria', isDomestic: false },
  { name: 'Kenya', lat: -0.0236, lon: 37.9062, country: 'Kenya', isDomestic: false },
  { name: 'South Africa', lat: -30.5595, lon: 22.9375, country: 'South Africa', isDomestic: false },
  { name: 'Vietnam', lat: 14.0583, lon: 108.2772, country: 'Vietnam', isDomestic: false },
  { name: 'Thailand', lat: 15.8700, lon: 100.9925, country: 'Thailand', isDomestic: false },
  { name: 'Indonesia', lat: -0.7893, lon: 113.9213, country: 'Indonesia', isDomestic: false },
  { name: 'Turkey', lat: 38.9637, lon: 35.2433, country: 'Turkey', isDomestic: false },
  { name: 'Poland', lat: 51.9194, lon: 19.1451, country: 'Poland', isDomestic: false },

  // Global Major Metros & Web3 Capitals
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'USA', isDomestic: false },
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA', isDomestic: false },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', isDomestic: false },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', isDomestic: false },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050, country: 'Germany', isDomestic: false },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', isDomestic: false },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France', isDomestic: false },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea', isDomestic: false },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'Thailand', isDomestic: false },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, country: 'Canada', isDomestic: false },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, country: 'Hong Kong', isDomestic: false },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia', isDomestic: false },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417, country: 'Switzerland', isDomestic: false },
  { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, country: 'Netherlands', isDomestic: false },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393, country: 'Portugal', isDomestic: false },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, country: 'Argentina', isDomestic: false },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, country: 'Brazil', isDomestic: false },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'Turkey', isDomestic: false },
  { name: 'Austin', lat: 30.2672, lon: -97.7431, country: 'USA', isDomestic: false },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321, country: 'USA', isDomestic: false },
  { name: 'Denver', lat: 39.7392, lon: -104.9903, country: 'USA', isDomestic: false },
  { name: 'Boston', lat: 42.3601, lon: -71.0589, country: 'USA', isDomestic: false },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'USA', isDomestic: false },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA', isDomestic: false },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA', isDomestic: false },
  { name: 'Vancouver', lat: 49.2827, lon: -123.1207, country: 'Canada', isDomestic: false },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631, country: 'Australia', isDomestic: false },
  { name: 'Auckland', lat: -36.8485, lon: 174.7633, country: 'New Zealand', isDomestic: false },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219, country: 'Kenya', isDomestic: false },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, country: 'Nigeria', isDomestic: false },
  { name: 'Cape Town', lat: -33.9249, lon: 18.4241, country: 'South Africa', isDomestic: false },
  { name: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, country: 'Vietnam', isDomestic: false },
  { name: 'Taipei', lat: 25.0330, lon: 121.5654, country: 'Taiwan', isDomestic: false },
  { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, country: 'Israel', isDomestic: false },
  { name: 'Vienna', lat: 48.2082, lon: 16.3738, country: 'Austria', isDomestic: false },
  { name: 'Warsaw', lat: 52.2297, lon: 21.0122, country: 'Poland', isDomestic: false },
  { name: 'Stockholm', lat: 59.3293, lon: 18.0686, country: 'Sweden', isDomestic: false },

  // India Core & Regional Tech Hubs
  { name: 'Jabalpur', lat: 23.1815, lon: 79.9864, country: 'India', isDomestic: true },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, country: 'India', isDomestic: true },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, country: 'India', isDomestic: true },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, country: 'India', isDomestic: true },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, country: 'India', isDomestic: true },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, country: 'India', isDomestic: true },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, country: 'India', isDomestic: true },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'India', isDomestic: true },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, country: 'India', isDomestic: true },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, country: 'India', isDomestic: true },
  { name: 'Indore', lat: 22.7196, lon: 75.8577, country: 'India', isDomestic: true },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126, country: 'India', isDomestic: true },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882, country: 'India', isDomestic: true },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462, country: 'India', isDomestic: true },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, country: 'India', isDomestic: true },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673, country: 'India', isDomestic: true },
  { name: 'Goa', lat: 15.2993, lon: 74.1240, country: 'India', isDomestic: true },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898, country: 'India', isDomestic: true },
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812, country: 'India', isDomestic: true },
  { name: 'Patna', lat: 25.5941, lon: 85.1376, country: 'India', isDomestic: true },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, country: 'India', isDomestic: true },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, country: 'India', isDomestic: true },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362, country: 'India', isDomestic: true },
  { name: 'Amravati', lat: 20.9320, lon: 77.7523, country: 'India', isDomestic: true },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433, country: 'India', isDomestic: true },
  { name: 'Nanded', lat: 19.1383, lon: 77.3210, country: 'India', isDomestic: true },
  { name: 'Chandrapur', lat: 19.9615, lon: 79.2961, country: 'India', isDomestic: true },
  { name: 'Akola', lat: 20.7002, lon: 77.0082, country: 'India', isDomestic: true },
  { name: 'Udaipur', lat: 24.5854, lon: 73.7125, country: 'India', isDomestic: true },
  { name: 'Gwalior', lat: 26.2183, lon: 78.1828, country: 'India', isDomestic: true },
  { name: 'Dehradun', lat: 30.3165, lon: 78.0322, country: 'India', isDomestic: true },
  { name: 'Coimbatore', lat: 11.0168, lon: 76.9558, country: 'India', isDomestic: true },
  { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366, country: 'India', isDomestic: true },
  { name: 'Ranchi', lat: 23.3441, lon: 85.3096, country: 'India', isDomestic: true },
  { name: 'Raipur', lat: 21.2514, lon: 81.6296, country: 'India', isDomestic: true },
  { name: 'Varanasi', lat: 25.3176, lon: 82.9739, country: 'India', isDomestic: true },
  { name: 'Kanpur', lat: 26.4499, lon: 80.3319, country: 'India', isDomestic: true },
  { name: 'Agra', lat: 27.1767, lon: 78.0081, country: 'India', isDomestic: true },
  { name: 'Jodhpur', lat: 26.2389, lon: 73.0243, country: 'India', isDomestic: true },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India', isDomestic: true }
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

// Search & Geocoding Resolver for any user-typed region or query
export async function searchGlobalLocations(query: string): Promise<CityLocation[]> {
  const q = query.trim().toLowerCase();
  if (!q) return PRESET_CITIES.slice(0, 10);

  // 1. Check local preset matches
  const localMatches = PRESET_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      (q === 'usa' && (c.country === 'USA' || c.name === 'USA')) ||
      (q === 'uk' && (c.country === 'UK' || c.name === 'United Kingdom'))
  );

  if (localMatches.length > 0) {
    return localMatches;
  }

  // 2. Fetch live geocoding via OpenStreetMap Nominatim for any unlisted custom location/region
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const country = item.address?.country || item.display_name.split(',').pop()?.trim() || 'Global';
          const isDomestic = country.toLowerCase().includes('india');
          const name = item.name || item.display_name.split(',')[0].trim();
          return {
            name,
            lat,
            lon,
            country,
            isDomestic
          };
        });
      }
    }
  } catch {
    // Network or offline fallback
  }

  return [];
}
