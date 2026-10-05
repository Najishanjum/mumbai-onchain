// Real Geographic Map Data and Vector Renderer for MumbaiOnChain Journey Card
// Contains boundary polygons for Indian States, coastlines, and dynamic bounding box projection.

export interface GeoPolygon {
  name: string;
  type: 'state' | 'country';
  centroid: [number, number]; // [lat, lon]
  coordinates: [number, number][]; // Array of [lat, lon] points
}

export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  importance: number; // 1 (major hub) to 3 (regional)
}

// 1. Precise State Boundary Polygons (Central, Western, Northern, Southern & Eastern India)
export const STATE_POLYGONS: GeoPolygon[] = [
  // MAHARASHTRA
  {
    name: 'MAHARASHTRA',
    type: 'state',
    centroid: [19.5, 75.8],
    coordinates: [
      [20.15, 72.75], [20.65, 73.05], [21.05, 73.85], [21.45, 74.25], [21.85, 74.55],
      [21.60, 75.35], [21.45, 76.15], [21.40, 77.05], [21.55, 77.75], [21.75, 78.45],
      [21.60, 79.25], [21.50, 79.95], [21.35, 80.45], [20.90, 80.40], [20.45, 80.55],
      [19.75, 80.35], [19.10, 80.20], [18.75, 80.05], [18.85, 79.25], [19.35, 78.75],
      [19.85, 77.85], [19.25, 77.35], [18.45, 77.65], [18.15, 77.45], [17.75, 76.95],
      [17.45, 76.45], [17.15, 75.75], [17.05, 75.25], [16.65, 74.85], [16.05, 74.45],
      [15.80, 74.15], [15.65, 73.85], [15.80, 73.55], [16.50, 73.30], [17.30, 73.15],
      [18.15, 72.95], [18.90, 72.80], [19.30, 72.75], [19.75, 72.70], [20.15, 72.75]
    ]
  },
  // MADHYA PRADESH
  {
    name: 'MADHYA PRADESH',
    type: 'state',
    centroid: [23.6, 78.4],
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
    type: 'state',
    centroid: [22.4, 71.5],
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
    type: 'state',
    centroid: [21.3, 81.8],
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
    type: 'state',
    centroid: [17.9, 79.1],
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
    type: 'state',
    centroid: [26.6, 73.8],
    coordinates: [
      [24.55, 72.85], [24.15, 73.45], [23.55, 73.95], [23.15, 74.75], [23.65, 74.85],
      [24.15, 74.95], [24.65, 75.25], [25.15, 75.85], [25.65, 76.65], [26.25, 77.25],
      [26.85, 77.95], [27.45, 77.85], [27.95, 77.35], [28.25, 76.75], [28.65, 76.15],
      [29.15, 75.45], [29.75, 75.15], [30.15, 74.45], [29.85, 73.75], [29.15, 72.85],
      [28.45, 72.15], [27.65, 71.25], [26.95, 70.45], [26.15, 70.25], [25.45, 71.05],
      [24.65, 72.15], [24.55, 72.85]
    ]
  },
  // KARNATAKA
  {
    name: 'KARNATAKA',
    type: 'state',
    centroid: [14.8, 75.9],
    coordinates: [
      [15.80, 74.15], [16.05, 74.45], [16.65, 74.85], [17.05, 75.25], [17.15, 75.75],
      [17.45, 76.45], [17.75, 76.95], [17.45, 77.45], [16.85, 77.35], [16.35, 77.75],
      [15.75, 77.45], [15.15, 77.15], [14.45, 77.45], [13.85, 77.75], [13.25, 78.25],
      [12.85, 78.25], [12.45, 77.75], [12.05, 77.15], [11.85, 76.45], [12.05, 75.75],
      [12.65, 75.15], [13.35, 74.75], [14.15, 74.45], [14.85, 74.15], [15.45, 73.85],
      [15.80, 74.15]
    ]
  },
  // GOA
  {
    name: 'GOA',
    type: 'state',
    centroid: [15.35, 74.05],
    coordinates: [
      [15.65, 73.85], [15.80, 74.15], [15.45, 74.25], [14.95, 74.10], [14.90, 73.95],
      [15.30, 73.75], [15.65, 73.85]
    ]
  },
  // UTTAR PRADESH
  {
    name: 'UTTAR PRADESH',
    type: 'state',
    centroid: [27.0, 80.6],
    coordinates: [
      [27.45, 77.85], [26.85, 77.95], [26.75, 78.65], [26.25, 79.15], [25.65, 79.35],
      [25.25, 79.85], [25.05, 80.45], [24.85, 81.35], [24.55, 82.25], [24.25, 82.85],
      [24.05, 83.55], [24.55, 83.85], [25.15, 83.95], [25.65, 84.45], [26.25, 84.35],
      [27.15, 83.95], [27.75, 82.95], [28.25, 81.95], [28.65, 80.95], [29.15, 80.15],
      [29.85, 79.35], [30.15, 78.45], [29.75, 77.65], [28.95, 77.35], [28.25, 77.55],
      [27.45, 77.85]
    ]
  },
  // ODISHA
  {
    name: 'ODISHA',
    type: 'state',
    centroid: [20.6, 84.4],
    coordinates: [
      [22.35, 83.45], [22.65, 84.15], [22.45, 85.15], [22.15, 86.45], [21.75, 87.25],
      [21.25, 86.95], [20.55, 86.65], [19.95, 86.15], [19.35, 85.15], [18.95, 84.65],
      [18.45, 84.15], [18.75, 83.45], [19.25, 82.85], [19.95, 82.25], [20.75, 82.65],
      [21.35, 82.85], [21.95, 83.35], [22.35, 83.45]
    ]
  },
  // ANDHRA PRADESH
  {
    name: 'ANDHRA PRADESH',
    type: 'state',
    centroid: [15.6, 79.6],
    coordinates: [
      [18.45, 84.15], [17.95, 83.45], [17.45, 82.45], [16.85, 81.95], [16.35, 81.35],
      [15.85, 80.45], [15.25, 80.05], [14.45, 80.15], [13.75, 80.25], [13.35, 79.95],
      [13.25, 79.25], [13.25, 78.25], [13.85, 77.75], [14.45, 77.45], [15.15, 77.15],
      [15.75, 77.45], [16.35, 77.75], [16.85, 77.35], [17.45, 77.45], [16.85, 78.45],
      [16.15, 79.25], [16.45, 79.75], [16.85, 80.15], [17.05, 80.75], [17.45, 81.25],
      [17.85, 81.25], [18.25, 80.55], [18.75, 83.45], [18.45, 84.15]
    ]
  },
  // DELHI NCR
  {
    name: 'DELHI NCR',
    type: 'state',
    centroid: [28.65, 77.2],
    coordinates: [
      [28.85, 76.95], [28.85, 77.35], [28.55, 77.45], [28.45, 77.15], [28.55, 76.85], [28.85, 76.95]
    ]
  }
];

// 2. Geographic Cities Index with Real Coordinates & Importance
export const REAL_CITIES: MapCity[] = [
  // Core Transit & Regional Hubs
  { name: 'Jabalpur', lat: 23.1815, lon: 79.9864, importance: 1 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126, importance: 1 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577, importance: 1 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882, importance: 1 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, importance: 1 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898, importance: 1 },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433, importance: 2 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, importance: 1 },
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812, importance: 2 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, importance: 1 },
  { name: 'Amravati', lat: 20.9320, lon: 77.7523, importance: 2 },
  { name: 'Nanded', lat: 19.1383, lon: 77.3210, importance: 2 },
  { name: 'Chandrapur', lat: 19.9615, lon: 79.2961, importance: 3 },
  { name: 'Jalgaon', lat: 21.0077, lon: 75.5626, importance: 2 },
  { name: 'Solapur', lat: 17.6599, lon: 75.9064, importance: 2 },
  { name: 'Kolhapur', lat: 16.7050, lon: 74.2433, importance: 2 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, importance: 1 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, importance: 1 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, importance: 1 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, importance: 1 },
  { name: 'Udaipur', lat: 24.5854, lon: 73.7125, importance: 2 },
  { name: 'Kota', lat: 25.2138, lon: 75.8648, importance: 2 },
  { name: 'Gwalior', lat: 26.2183, lon: 78.1828, importance: 2 },
  { name: 'Raipur', lat: 21.2514, lon: 81.6296, importance: 1 },
  { name: 'Bilaspur', lat: 22.0797, lon: 82.1409, importance: 2 },
  { name: 'Rewa', lat: 24.5362, lon: 81.3037, importance: 3 },
  { name: 'Satna', lat: 24.6005, lon: 80.8322, importance: 3 },
  { name: 'Sagar', lat: 23.8388, lon: 78.7378, importance: 3 },
  { name: 'Ujjain', lat: 23.1765, lon: 75.7885, importance: 2 },
  { name: 'Goa (Panaji)', lat: 15.4909, lon: 73.8278, importance: 1 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, importance: 1 }
];

// 3. Dynamic Geographic Projection Engine (fitBounds)
export interface GeoProjection {
  project: (lat: number, lon: number) => [number, number];
  isInside: (lat: number, lon: number, margin?: number) => boolean;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  zoomLevel: number;
}

export function createGeoProjection(
  origin: [number, number],
  mumbai: [number, number],
  viewBox = { x: 40, y: 130, w: 1000, h: 600 }
): GeoProjection {
  const [oLat, oLon] = origin;
  const [mLat, mLon] = mumbai;

  // Calculate bounding rectangle
  const minLatRaw = Math.min(oLat, mLat);
  const maxLatRaw = Math.max(oLat, mLat);
  const minLonRaw = Math.min(oLon, mLon);
  const maxLonRaw = Math.max(oLon, mLon);

  const spanLat = Math.max(1.5, maxLatRaw - minLatRaw);
  const spanLon = Math.max(1.5, maxLonRaw - minLonRaw);

  // Dynamic Geographic Padding (Ensures surrounding states are framed clearly without zooming out to all Asia)
  let padLat = Math.max(1.6, spanLat * 0.42);
  let padLon = Math.max(2.0, spanLon * 0.45);

  // For closer distances (like Jabalpur -> Mumbai, Bhopal -> Mumbai), add generous contextual padding to display full states
  if (spanLat < 6 && spanLon < 9) {
    padLat = Math.max(2.4, 4.5 - spanLat * 0.4);
    padLon = Math.max(3.0, 5.5 - spanLon * 0.4);
  }

  const minLat = minLatRaw - padLat;
  const maxLat = maxLatRaw + padLat;
  const minLon = minLonRaw - padLon;
  const maxLon = maxLonRaw + padLon;

  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;

  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);

  // Determine scaling to fit viewBox precisely
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

  const isInside = (lat: number, lon: number, margin = 20): boolean => {
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
    zoomLevel: scale
  };
}
