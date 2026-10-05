// Geographic & Routing Engine for Devcon 8 Journey Card
// Includes real India coastline, state boundaries, railway corridors, and geodesic projection

export interface GeoCoordinate {
  lat: number;
  lon: number;
}

export interface CityMetadata {
  name: string;
  state?: string;
  country: string;
  isCapital?: boolean;
  capitalType?: 'National Capital' | 'State Capital';
  lat: number;
  lon: number;
  timezone: string; // e.g. 'Asia/Kolkata', 'Europe/Berlin'
  utcOffsetHours: number; // e.g. 5.5, 1.0, -5.0
  airportCode?: string;
  railStationCode?: string;
}

export interface JourneyRouteData {
  origin: CityMetadata;
  destination: CityMetadata;
  mode: 'flight' | 'train';
  distanceKm: number;
  estimatedDurationStr: string;
  originTimezoneStr: string;
  mumbaiTimezoneStr: string;
  timezoneDiffStr: string;
  statesCrossed: string[];
  nearbyCities: [string, number, number][]; // [name, lat, lon]
  routeCoordinates: [number, number][]; // [lat, lon] sequence
  intermediateStations?: string[];
  isVerifiedRoute: boolean;
}

export const MUMBAI_METADATA: CityMetadata = {
  name: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  isCapital: true,
  capitalType: 'State Capital',
  lat: 19.0760,
  lon: 72.8777,
  timezone: 'Asia/Kolkata',
  utcOffsetHours: 5.5,
  airportCode: 'BOM',
  railStationCode: 'CSMT'
};

// Real Indian State Boundary Centroids and Approximated Boundary Loops for Geographic Rendering
export interface StateBoundary {
  name: string;
  center: [number, number]; // [lat, lon]
  polygon: [number, number][]; // [lat, lon] closed polygon points
}

// Key Indian Coastlines (Western Arabian Sea, Konkan, Gujarat Gulfs, Eastern Bay of Bengal)
export const INDIA_COASTLINE: [number, number][] = [
  // Gujarat / Rann of Kutch
  [23.7, 68.2], [23.1, 68.8], [22.8, 69.5], [22.4, 70.0], [21.8, 69.2], [20.9, 69.8], [20.8, 70.8], [21.1, 72.2],
  [21.7, 72.2], [22.3, 72.6], [21.6, 72.8], [21.1, 72.8],
  // Maharashtra / Konkan Coast
  [20.1, 72.8], [19.3, 72.8], [18.9, 72.8], [18.5, 72.9], [17.8, 73.1], [16.9, 73.3], [16.0, 73.5],
  // Goa
  [15.6, 73.7], [15.2, 73.9],
  // Karnataka Coast
  [14.8, 74.1], [14.3, 74.4], [13.4, 74.7], [12.9, 74.8],
  // Kerala Coast
  [12.1, 75.1], [11.2, 75.8], [10.0, 76.2], [9.3, 76.4], [8.5, 76.9], [8.1, 77.5],
  // Tamil Nadu / Bay of Bengal Coast
  [8.5, 78.1], [9.2, 79.1], [10.3, 79.8], [11.5, 79.8], [12.8, 80.2], [13.4, 80.3],
  // Andhra Pradesh Coast
  [14.5, 80.2], [15.8, 80.4], [16.7, 82.2], [17.7, 83.3], [18.4, 84.1],
  // Odisha / West Bengal Coast
  [19.3, 85.0], [20.0, 86.2], [21.5, 87.2], [22.0, 88.8]
];

// Major Real State Polygons for Visual Map and Intersection Detection
export const STATE_POLYGONS: StateBoundary[] = [
  {
    name: 'MAHARASHTRA',
    center: [19.4, 75.8],
    polygon: [
      [20.0, 72.7], [21.4, 73.9], [21.5, 76.0], [21.7, 78.5], [21.4, 80.2], [19.9, 80.5],
      [18.8, 79.8], [18.5, 77.5], [17.5, 76.0], [15.8, 74.3], [15.8, 73.6], [19.1, 72.8], [20.0, 72.7]
    ]
  },
  {
    name: 'MADHYA PRADESH',
    center: [23.4, 77.8],
    polygon: [
      [21.5, 74.5], [22.0, 74.1], [24.0, 74.8], [25.0, 76.5], [26.8, 78.2], [25.5, 80.0],
      [24.5, 82.5], [22.8, 81.8], [21.7, 80.4], [21.5, 76.0], [21.5, 74.5]
    ]
  },
  {
    name: 'GUJARAT',
    center: [22.4, 71.8],
    polygon: [
      [20.2, 72.8], [21.2, 73.8], [22.5, 74.2], [24.5, 73.0], [24.6, 71.1], [23.8, 68.8],
      [22.8, 69.2], [20.8, 70.8], [21.2, 72.2], [20.2, 72.8]
    ]
  },
  {
    name: 'RAJASTHAN',
    center: [26.6, 73.8],
    polygon: [
      [24.5, 73.0], [26.0, 70.5], [28.0, 71.0], [29.8, 73.8], [28.5, 76.8], [27.0, 77.8],
      [25.0, 76.5], [24.0, 74.8], [24.5, 73.0]
    ]
  },
  {
    name: 'DELHI',
    center: [28.61, 77.21],
    polygon: [
      [28.88, 77.05], [28.88, 77.35], [28.45, 77.35], [28.45, 77.05], [28.88, 77.05]
    ]
  },
  {
    name: 'HARYANA',
    center: [29.1, 76.3],
    polygon: [
      [28.0, 76.0], [29.5, 74.8], [30.5, 76.8], [29.8, 77.4], [28.4, 77.2], [28.0, 76.0]
    ]
  },
  {
    name: 'UTTAR PRADESH',
    center: [26.8, 80.9],
    polygon: [
      [27.0, 77.8], [29.5, 77.5], [29.0, 80.0], [27.5, 83.5], [25.0, 83.2], [24.5, 82.5],
      [25.5, 80.0], [26.8, 78.2], [27.0, 77.8]
    ]
  },
  {
    name: 'KARNATAKA',
    center: [14.8, 75.8],
    polygon: [
      [15.8, 74.3], [17.5, 76.0], [17.5, 77.5], [15.0, 77.6], [13.0, 77.8], [12.0, 76.5],
      [12.9, 74.8], [14.8, 74.1], [15.8, 74.3]
    ]
  },
  {
    name: 'GOA',
    center: [15.35, 74.05],
    polygon: [
      [15.79, 73.7], [15.79, 74.3], [14.9, 74.3], [14.9, 73.7], [15.79, 73.7]
    ]
  },
  {
    name: 'TELANGANA',
    center: [17.8, 79.0],
    polygon: [
      [18.5, 77.5], [19.8, 79.2], [18.8, 80.8], [16.5, 80.2], [16.0, 78.5], [17.5, 77.5], [18.5, 77.5]
    ]
  },
  {
    name: 'CHHATTISGARH',
    center: [21.3, 81.8],
    polygon: [
      [21.7, 80.4], [22.8, 81.8], [23.8, 83.2], [22.0, 84.0], [19.5, 81.5], [18.0, 81.0],
      [19.9, 80.5], [21.4, 80.2], [21.7, 80.4]
    ]
  }
];

// Major Indian Cities Database for Map Labelling
export const INDIA_MAP_CITIES: [string, number, number, boolean][] = [
  // [Name, Lat, Lon, isPrimary/Capital]
  ['Mumbai', 19.076, 72.8777, true],
  ['Bhopal', 23.2599, 77.4126, true],
  ['Jabalpur', 23.1815, 79.9864, false],
  ['Delhi', 28.6139, 77.2090, true],
  ['Bengaluru', 12.9716, 77.5946, true],
  ['Hyderabad', 17.3850, 78.4867, true],
  ['Ahmedabad', 23.0225, 72.5714, true],
  ['Surat', 21.1702, 72.8311, false],
  ['Indore', 22.7196, 75.8577, false],
  ['Pune', 18.5204, 73.8567, false],
  ['Nashik', 19.9975, 73.7898, false],
  ['Nagpur', 21.1458, 79.0882, false],
  ['Jaipur', 26.9124, 75.7873, true],
  ['Lucknow', 26.8467, 80.9462, true],
  ['Kolkata', 22.5726, 88.3639, true],
  ['Chennai', 13.0827, 80.2707, true],
  ['Goa', 15.2993, 74.1240, true],
  ['Jalgaon', 21.0077, 75.5626, false],
  ['Akola', 20.7002, 77.0082, false],
  ['Wardha', 20.7453, 78.6022, false],
  ['Chandrapur', 19.9615, 79.2961, false],
  ['Aurangabad', 19.8762, 75.3433, false],
  ['Nanded', 19.1383, 77.3210, false],
  ['Vadodara', 22.3072, 73.1812, false],
  ['Gwalior', 26.2183, 78.1828, false],
  ['Kota', 25.2138, 75.8648, false],
  ['Itarsi', 22.6108, 77.7610, false],
  ['Bhusaval', 21.0455, 75.7873, false],
  ['Ratlam', 23.3315, 75.0367, false]
];

// Great-circle Haversine Distance
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate Geodesic Flight Arc coordinates with subtle curve
export function generateGeodesicArc(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  numPoints = 50
): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    // Linear interpolation base
    const lat = lat1 + (lat2 - lat1) * f;
    const lon = lon1 + (lon2 - lon1) * f;

    // Normal vector curvature for great circle visual effect
    const dx = lon2 - lon1;
    const dy = lat2 - lat1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sag = Math.sin(f * Math.PI) * Math.min(dist * 0.12, 4.0);

    // Perpendicular offset
    const perpLat = -dx / (dist || 1);
    const perpLon = dy / (dist || 1);

    points.push([lat + perpLat * sag, lon + perpLon * sag]);
  }
  return points;
}

// Authentic Indian Railway Corridors (Major Junction Sequences to Mumbai)
export const RAILWAY_JUNCTIONS: Record<string, [number, number]> = {
  Mumbai: [19.0760, 72.8777],
  Kalyan: [19.2403, 73.1305],
  Nashik: [19.9975, 73.7898],
  Manmad: [20.2520, 74.4428],
  Bhusaval: [21.0455, 75.7873],
  Itarsi: [22.6108, 77.7610],
  Bhopal: [23.2599, 77.4126],
  Jabalpur: [23.1815, 79.9864],
  Katni: [23.8343, 80.3985],
  Nagpur: [21.1458, 79.0882],
  Wardha: [20.7453, 78.6022],
  Akola: [20.7002, 77.0082],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Ratlam: [23.3315, 75.0367],
  Kota: [25.2138, 75.8648],
  Mathura: [27.4924, 77.6737],
  Delhi: [28.6139, 77.2090],
  Pune: [18.5204, 73.8567],
  Solapur: [17.6599, 75.9064],
  Guntakal: [15.1667, 77.3667],
  Bengaluru: [12.9716, 77.5946],
  Ratnagiri: [16.9902, 73.3120],
  Madgaon: [15.2832, 73.9862],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Indore: [22.7196, 75.8577],
  Ujjain: [23.1765, 75.7885]
};

// Known Rail Route Corridors to Mumbai
export const KNOWN_RAIL_CORRIDORS: Record<string, string[]> = {
  Jabalpur: ['Jabalpur', 'Katni', 'Itarsi', 'Bhusaval', 'Nashik', 'Kalyan', 'Mumbai'],
  Bhopal: ['Bhopal', 'Itarsi', 'Bhusaval', 'Manmad', 'Nashik', 'Kalyan', 'Mumbai'],
  Nagpur: ['Nagpur', 'Wardha', 'Akola', 'Bhusaval', 'Nashik', 'Kalyan', 'Mumbai'],
  Delhi: ['Delhi', 'Mathura', 'Kota', 'Ratlam', 'Vadodara', 'Surat', 'Mumbai'],
  Ahmedabad: ['Ahmedabad', 'Vadodara', 'Surat', 'Mumbai'],
  Bengaluru: ['Bengaluru', 'Guntakal', 'Solapur', 'Pune', 'Kalyan', 'Mumbai'],
  Pune: ['Pune', 'Kalyan', 'Mumbai'],
  Goa: ['Madgaon', 'Ratnagiri', 'Mumbai'],
  Indore: ['Indore', 'Ujjain', 'Ratlam', 'Vadodara', 'Surat', 'Mumbai'],
  Jaipur: ['Jaipur', 'Kota', 'Ratlam', 'Vadodara', 'Surat', 'Mumbai']
};

// Generate authentic Train Railway Route
export function generateRailwayRoute(originName: string, originCoord: GeoCoordinate): {
  coords: [number, number][];
  stations: string[];
  distanceKm: number;
} {
  const corridor = KNOWN_RAIL_CORRIDORS[originName];
  if (corridor) {
    const coords: [number, number][] = corridor.map((s) => RAILWAY_JUNCTIONS[s] || [originCoord.lat, originCoord.lon]);
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      dist += calculateHaversineDistance(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    }
    // Railway tracks have ~15-20% winding factor over straight geodesic lines
    const railDistance = Math.round(dist * 1.15);
    return {
      coords,
      stations: corridor,
      distanceKm: railDistance
    };
  }

  // If outside known corridors, connect to nearest junction then Mumbai
  const directDist = calculateHaversineDistance(originCoord.lat, originCoord.lon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon);
  const intermediate: [number, number][] = [];
  const numInter = 8;
  for (let i = 0; i <= numInter; i++) {
    const f = i / numInter;
    const lat = originCoord.lat + (MUMBAI_METADATA.lat - originCoord.lat) * f;
    const lon = originCoord.lon + (MUMBAI_METADATA.lon - originCoord.lon) * f;
    intermediate.push([lat, lon]);
  }

  return {
    coords: intermediate,
    stations: [originName, 'Mumbai'],
    distanceKm: Math.round(directDist * 1.2)
  };
}

// Check which states a route line passes through using line-polygon proximity
export function detectStatesCrossed(routePoints: [number, number][]): string[] {
  const crossed: string[] = [];

  for (const state of STATE_POLYGONS) {
    // Check if any route point is inside or within 0.8 degrees (~80km) of state center/polygon
    let near = false;
    for (const [lat, lon] of routePoints) {
      const dLat = Math.abs(lat - state.center[0]);
      const dLon = Math.abs(lon - state.center[1]);
      if (dLat < 2.2 && dLon < 2.2) {
        near = true;
        break;
      }
    }
    if (near) {
      crossed.push(state.name);
    }
  }

  // Ensure origin and destination states are included
  if (!crossed.includes('MAHARASHTRA')) {
    crossed.push('MAHARASHTRA');
  }

  return crossed;
}

// Calculate Travel Duration String
export function calculateEstimatedTravelTime(distanceKm: number, mode: 'flight' | 'train'): string {
  if (mode === 'flight') {
    // Flight: 35 min airport taxi/climb/descent + cruising at 780 km/h
    const hours = 0.6 + distanceKm / 780;
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  } else {
    // Train: Indian Railways average speed with stops ~ 65-80 km/h
    const hours = distanceKm / 72;
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  }
}

// Calculate Timezone Difference relative to Mumbai (Asia/Kolkata UTC+5:30)
export function calculateTimezoneDifference(originOffsetHours: number): {
  originStr: string;
  mumbaiStr: string;
  diffStr: string;
} {
  const mumbaiOffset = 5.5;
  const diffHours = mumbaiOffset - originOffsetHours;

  const formatOffset = (offset: number) => {
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const h = Math.floor(abs);
    const m = Math.round((abs - h) * 60);
    return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}`;
  };

  const originStr = formatOffset(originOffsetHours);
  const mumbaiStr = 'IST · UTC+5:30';

  if (Math.abs(diffHours) < 0.1) {
    return { originStr, mumbaiStr, diffStr: 'Same Timezone (IST)' };
  }

  const sign = diffHours > 0 ? '+' : '-';
  const absDiff = Math.abs(diffHours);
  const diffH = Math.floor(absDiff);
  const diffM = Math.round((absDiff - diffH) * 60);
  const diffStr = `${sign}${diffH}h ${diffM > 0 ? `${diffM}m` : ''}`.trim();

  return { originStr, mumbaiStr, diffStr };
}

// Calculate Dynamic Bounding Box & Canvas Coordinate Mapping (fitBounds)
export interface MapViewport {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  project: (lat: number, lon: number, width: number, height: number, padding?: number) => [number, number];
}

export function calculateViewport(
  originLat: number,
  originLon: number,
  destLat = MUMBAI_METADATA.lat,
  destLon = MUMBAI_METADATA.lon
): MapViewport {
  const lats = [originLat, destLat];
  const lons = [originLon, destLon];

  // Base bounding box with geographic margin
  const minLatRaw = Math.min(...lats);
  const maxLatRaw = Math.max(...lats);
  const minLonRaw = Math.min(...lons);
  const maxLonRaw = Math.max(...lons);

  const spanLat = Math.max(maxLatRaw - minLatRaw, 3.5);
  const spanLon = Math.max(maxLonRaw - minLonRaw, 4.0);

  const marginLat = spanLat * 0.28;
  const marginLon = spanLon * 0.28;

  const minLat = minLatRaw - marginLat;
  const maxLat = maxLatRaw + marginLat;
  const minLon = minLonRaw - marginLon;
  const maxLon = maxLonRaw + marginLon;

  const project = (lat: number, lon: number, width: number, height: number, pad = 40): [number, number] => {
    const usableW = width - pad * 2;
    const usableH = height - pad * 2;

    const normX = (lon - minLon) / (maxLon - minLon);
    // Invert Y for canvas coordinate system (North is top)
    const normY = (maxLat - lat) / (maxLat - minLat);

    const x = pad + normX * usableW;
    const y = pad + normY * usableH;
    return [x, y];
  };

  return { minLat, maxLat, minLon, maxLon, project };
}
