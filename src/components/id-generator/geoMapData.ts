// High-Precision Geographic Vector Map Engine for Journey ID Card
// Matches the exact Western/Central India topographic contour coastline, land dot-matrix, and state boundaries.

export interface GeoPolygon {
  name: string;
  centroid: [number, number]; // [lat, lon]
  coordinates: [number, number][];
}

export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  importance: number;
}

// 1. Detailed Western Coastline of India (from Kutch & Kathiawar down past Mumbai to Konkan/Goa)
export const WEST_COASTLINE_COORDS: [number, number][] = [
  [24.00, 68.80],
  [23.50, 68.50],
  [23.10, 68.70],
  [22.80, 69.10],
  [22.45, 69.80],
  [22.20, 69.20],
  [21.65, 69.45],
  [21.10, 70.05],
  [20.75, 70.90],
  [20.90, 71.55],
  [21.30, 72.20],
  [21.75, 72.40],
  [22.10, 72.55], // Gulf of Khambhat inner head
  [21.80, 72.75],
  [21.17, 72.83], // Surat
  [20.45, 72.85], // Daman
  [19.85, 72.75], // Dahanu
  [19.08, 72.82], // Mumbai / Salsette Island
  [18.60, 72.88], // Alibaug
  [18.15, 72.95], // Murud
  [17.40, 73.15], // Ratnagiri
  [16.50, 73.30], // Malvan
  [15.80, 73.65], // Vengurla
  [15.35, 73.80], // Goa
  [14.60, 74.25], // Karwar
  [13.80, 74.60]  // Bhatkal
];

// 2. Comprehensive Indian State Boundaries
export const STATE_POLYGONS: GeoPolygon[] = [
  // MAHARASHTRA
  {
    name: 'MAHARASHTRA',
    centroid: [19.45, 76.10],
    coordinates: [
      [20.15, 72.75], [20.65, 73.05], [21.05, 73.85], [21.45, 74.25], [21.85, 74.55],
      [21.60, 75.35], [21.45, 76.15], [21.40, 77.05], [21.55, 77.75], [21.75, 78.45],
      [21.60, 79.25], [21.50, 79.95], [21.35, 80.45], [20.90, 80.40], [20.45, 80.55],
      [19.75, 80.35], [19.10, 80.20], [18.75, 80.05], [18.85, 79.25], [19.35, 78.75],
      [19.85, 77.85], [19.25, 77.35], [18.45, 77.65], [18.15, 77.45], [17.75, 76.95],
      [17.45, 76.45], [17.15, 75.75], [17.05, 75.25], [16.65, 74.85], [16.05, 74.45],
      [15.80, 74.15], [15.65, 73.85], [15.80, 73.55], [16.50, 73.30], [17.40, 73.15],
      [18.15, 72.95], [18.90, 72.80], [19.30, 72.75], [19.75, 72.70], [20.15, 72.75]
    ]
  },
  // MADHYA PRADESH
  {
    name: 'MADHYA PRADESH',
    centroid: [23.60, 78.20],
    coordinates: [
      [21.85, 74.55], [22.25, 74.35], [22.75, 74.50], [23.15, 74.75], [23.65, 74.85],
      [24.15, 74.95], [24.65, 75.25], [25.15, 75.85], [25.65, 76.65], [26.25, 77.25],
      [26.85, 77.95], [26.75, 78.65], [26.25, 79.15], [25.65, 79.35], [25.25, 79.85],
      [25.05, 80.45], [24.85, 81.35], [24.55, 82.25], [24.25, 82.85], [23.85, 82.65],
      [23.25, 82.05], [22.85, 81.65], [22.35, 81.15], [21.85, 80.45], [21.50, 79.95],
      [21.60, 79.25], [21.75, 78.45], [21.55, 77.75], [21.40, 77.05], [21.45, 76.15],
      [21.60, 75.35], [21.85, 74.55]
    ]
  },
  // GUJARAT
  {
    name: 'GUJARAT',
    centroid: [22.40, 71.30],
    coordinates: [
      [20.15, 72.75], [20.65, 73.05], [21.05, 73.85], [21.45, 74.25], [21.85, 74.55],
      [22.25, 74.35], [22.75, 74.50], [23.15, 74.75], [23.55, 73.95], [24.15, 73.45],
      [24.55, 72.85], [24.65, 72.15], [24.45, 71.45], [24.25, 70.75], [23.95, 69.85],
      [23.75, 68.85], [23.25, 68.55], [22.75, 69.15], [22.45, 69.95], [22.15, 69.45],
      [21.55, 69.45], [20.85, 70.45], [20.85, 71.25], [21.15, 72.15], [21.65, 72.55],
      [21.35, 72.75], [20.65, 72.85], [20.15, 72.75]
    ]
  },
  // CHHATTISGARH
  {
    name: 'CHHATTISGARH',
    centroid: [21.20, 81.80],
    coordinates: [
      [23.85, 82.65], [24.25, 82.85], [24.05, 83.55], [23.55, 83.95], [22.95, 83.95],
      [22.35, 83.45], [21.95, 83.35], [21.35, 82.85], [20.75, 82.65], [19.95, 82.25],
      [19.15, 81.85], [18.25, 81.35], [17.85, 81.25], [18.25, 80.55], [18.75, 80.05],
      [19.10, 80.20], [19.75, 80.35], [20.45, 80.55], [20.90, 80.40], [21.35, 80.45],
      [21.85, 80.45], [22.35, 81.15], [22.85, 81.65], [23.25, 82.05], [23.85, 82.65]
    ]
  },
  // TELANGANA
  {
    name: 'TELANGANA',
    centroid: [17.90, 79.10],
    coordinates: [
      [19.85, 77.85], [19.35, 78.75], [18.85, 79.25], [18.75, 80.05], [18.25, 80.55],
      [17.85, 81.25], [17.45, 81.25], [17.05, 80.75], [16.85, 80.15], [16.45, 79.75],
      [16.15, 79.25], [16.05, 78.45], [16.35, 77.75], [16.85, 77.35], [17.45, 77.45],
      [17.75, 76.95], [18.15, 77.45], [18.45, 77.65], [19.25, 77.35], [19.85, 77.85]
    ]
  },
  // RAJASTHAN
  {
    name: 'RAJASTHAN',
    centroid: [26.50, 73.80],
    coordinates: [
      [24.55, 72.85], [24.15, 73.45], [23.55, 73.95], [23.15, 74.75], [23.65, 74.85],
      [24.15, 74.95], [24.65, 75.25], [25.15, 75.85], [25.65, 76.65], [26.25, 77.25],
      [26.85, 77.95], [27.45, 77.85], [27.95, 77.35], [28.25, 76.75], [28.65, 76.15],
      [29.15, 75.45], [29.75, 75.15], [30.15, 74.45], [29.85, 73.75], [29.15, 72.85],
      [28.45, 72.15], [27.65, 71.25], [26.95, 70.45], [26.15, 70.25], [25.45, 71.05],
      [24.65, 72.15], [24.55, 72.85]
    ]
  }
];

// 3. Exact Geographic Transit Cities from Reference Screenshot
export const REAL_CITIES: MapCity[] = [
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126, importance: 1 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577, importance: 1 },
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812, importance: 1 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, importance: 1 },
  { name: 'Amravati', lat: 20.9320, lon: 77.7523, importance: 1 },
  { name: 'Akola', lat: 20.7002, lon: 77.0082, importance: 1 },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433, importance: 1 },
  { name: 'Chandrapur', lat: 19.9615, lon: 79.2961, importance: 1 },
  { name: 'Nanded', lat: 19.1383, lon: 77.3210, importance: 1 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882, importance: 2 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, importance: 2 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898, importance: 2 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, importance: 2 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, importance: 2 },
  { name: 'Jabalpur', lat: 23.1815, lon: 79.9864, importance: 1 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, importance: 1 }
];

// 4. Projection Engine with Smooth Bounding Box
export interface GeoProjection {
  project: (lat: number, lon: number) => [number, number];
  isInside: (lat: number, lon: number, margin?: number) => boolean;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  scale: number;
  viewBox: { x: number; y: number; w: number; h: number };
}

export function createGeoProjection(
  origin: [number, number],
  mumbai: [number, number],
  viewBox = { x: 30, y: 120, w: 1020, h: 620 }
): GeoProjection {
  const [oLat, oLon] = origin;
  const [mLat, mLon] = mumbai;

  const minLatRaw = Math.min(oLat, mLat);
  const maxLatRaw = Math.max(oLat, mLat);
  const minLonRaw = Math.min(oLon, mLon);
  const maxLonRaw = Math.max(oLon, mLon);

  const spanLat = Math.max(1.8, maxLatRaw - minLatRaw);
  const spanLon = Math.max(2.2, maxLonRaw - minLonRaw);

  // Geographic Padding calibrated to match Devcon reference framing
  let padLat = Math.max(1.8, spanLat * 0.45);
  let padLon = Math.max(2.4, spanLon * 0.48);

  if (spanLat < 6 && spanLon < 10) {
    padLat = Math.max(2.2, 4.2 - spanLat * 0.35);
    padLon = Math.max(2.8, 5.2 - spanLon * 0.35);
  }

  const minLat = minLatRaw - padLat;
  const maxLat = maxLatRaw + padLat;
  const minLon = minLonRaw - padLon;
  const maxLon = maxLonRaw + padLon;

  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;

  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);

  const scaleX = viewBox.w / (lonRange * cosLat);
  const scaleY = viewBox.h / latRange;
  const scale = Math.min(scaleX, scaleY);

  const cx = viewBox.x + viewBox.w / 2;
  const cy = viewBox.y + viewBox.h / 2;
  const centerLon = (minLon + maxLon) / 2;

  const project = (lat: number, lon: number): [number, number] => {
    const px = cx + (lon - centerLon) * cosLat * scale;
    const py = cy - (lat - centerLat) * scale;
    return [px, py];
  };

  const isInside = (lat: number, lon: number, margin = 30): boolean => {
    const [px, py] = project(lat, lon);
    return (
      px >= viewBox.x - margin &&
      px <= viewBox.x + viewBox.w + margin &&
      py >= viewBox.y - margin &&
      py <= viewBox.y + viewBox.h + margin
    );
  };

  return {
    project,
    isInside,
    minLat,
    maxLat,
    minLon,
    maxLon,
    scale,
    viewBox
  };
}
