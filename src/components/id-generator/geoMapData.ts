// High-Precision Geographic Vector Map Engine for Journey ID Card
// Supports both:
// 1. Regional Central/Western India Topographic Map (with state borders, dot-matrix land, bathymetric contours, city nodes)
// 2. Full World Topographic Map (with continents, glowing India outline, transatlantic/transcontinental arcs, and flight badges)

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

// 1. Western Coastline of India (Kathiawar to Konkan/Goa)
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
  [22.10, 72.55], // Gulf of Khambhat head
  [21.80, 72.75],
  [21.17, 72.83], // Surat
  [20.45, 72.85], // Daman
  [19.85, 72.75], // Dahanu
  [19.08, 72.82], // Mumbai
  [18.60, 72.88], // Alibaug
  [18.15, 72.95], // Murud
  [17.40, 73.15], // Ratnagiri
  [16.50, 73.30], // Malvan
  [15.80, 73.65], // Vengurla
  [15.35, 73.80], // Goa
  [14.60, 74.25], // Karwar
  [13.80, 74.60]  // Bhatkal
];

// 2. India State Boundaries (Regional View)
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
  }
];

// 3. World Continents Vector Polygons (for Global / International World View matching reference)
export const WORLD_CONTINENT_POLYGONS: GeoPolygon[] = [
  // NORTH AMERICA (USA, Canada, Mexico, Alaska)
  {
    name: 'NORTH AMERICA',
    centroid: [42.0, -102.0],
    coordinates: [
      [71.0, -156.0], [70.0, -135.0], [68.0, -115.0], [65.0, -90.0], [60.0, -65.0],
      [52.0, -55.0], [47.0, -53.0], [44.0, -66.0], [41.0, -72.0], [35.0, -75.0],
      [30.0, -81.0], [25.0, -80.0], [25.0, -97.0], [20.0, -97.0], [18.5, -92.0],
      [15.5, -88.0], [10.0, -84.0], [8.5, -79.0], [7.5, -80.0], [10.0, -85.0],
      [16.0, -95.0], [20.0, -105.0], [24.0, -110.0], [32.0, -117.0], [37.5, -122.5],
      [48.0, -124.5], [54.0, -130.0], [59.0, -138.0], [60.0, -150.0], [65.0, -168.0],
      [71.0, -156.0]
    ]
  },
  // GREENLAND
  {
    name: 'GREENLAND',
    centroid: [72.0, -40.0],
    coordinates: [
      [76.0, -68.0], [82.0, -30.0], [80.0, -18.0], [70.0, -22.0], [60.0, -44.0],
      [65.0, -52.0], [76.0, -68.0]
    ]
  },
  // SOUTH AMERICA
  {
    name: 'SOUTH AMERICA',
    centroid: [-15.0, -60.0],
    coordinates: [
      [12.0, -72.0], [10.5, -62.0], [5.0, -52.0], [0.0, -48.0], [-5.0, -35.0],
      [-12.0, -37.0], [-23.0, -42.0], [-32.0, -52.0], [-40.0, -62.0], [-54.0, -68.0],
      [-52.0, -75.0], [-40.0, -74.0], [-30.0, -71.5], [-18.0, -71.0], [-5.0, -81.0],
      [2.0, -79.0], [8.5, -77.5], [12.0, -72.0]
    ]
  },
  // EUROPE & SCANDINAVIA
  {
    name: 'EUROPE',
    centroid: [52.0, 15.0],
    coordinates: [
      [36.0, -9.0], [43.5, -9.0], [47.5, -4.5], [51.0, 2.0], [54.0, 8.5],
      [58.0, 6.0], [62.0, 5.0], [71.0, 26.0], [68.0, 38.0], [60.0, 32.0],
      [54.0, 22.0], [46.0, 30.0], [42.0, 28.0], [36.0, 23.0], [38.0, 15.0],
      [41.0, 14.0], [44.0, 8.0], [42.0, 3.0], [36.0, -5.5], [36.0, -9.0]
    ]
  },
  // UNITED KINGDOM & IRELAND
  {
    name: 'BRITISH ISLES',
    centroid: [54.0, -3.0],
    coordinates: [
      [50.0, -5.0], [52.0, 1.5], [58.5, -3.0], [58.0, -6.0], [55.0, -6.0],
      [51.5, -10.0], [50.0, -5.0]
    ]
  },
  // AFRICA
  {
    name: 'AFRICA',
    centroid: [2.0, 20.0],
    coordinates: [
      [36.0, -5.5], [37.0, 10.0], [32.0, 32.0], [28.0, 34.0], [22.0, 37.0],
      [12.0, 44.0], [11.0, 51.0], [4.0, 48.0], [-5.0, 40.0], [-15.0, 40.0],
      [-26.0, 33.0], [-34.5, 20.0], [-34.0, 18.0], [-22.0, 14.0], [-10.0, 13.0],
      [0.0, 9.0], [4.5, 2.0], [5.0, -8.0], [10.0, -14.0], [15.0, -17.0],
      [23.0, -16.0], [32.0, -10.0], [36.0, -5.5]
    ]
  },
  // ASIA & MIDDLE EAST
  {
    name: 'ASIA',
    centroid: [48.0, 90.0],
    coordinates: [
      [70.0, 32.0], [75.0, 60.0], [76.0, 100.0], [72.0, 130.0], [68.0, 170.0],
      [60.0, 165.0], [50.0, 142.0], [40.0, 130.0], [30.0, 122.0], [22.0, 114.0],
      [10.0, 107.0], [1.5, 104.0], [6.0, 100.0], [16.0, 96.0], [22.0, 90.0],
      [22.0, 89.0], [20.0, 86.0], [13.0, 80.2], [8.0, 77.0], [15.0, 74.0],
      [21.0, 72.8], [24.0, 68.0], [25.0, 62.0], [24.0, 57.0], [15.0, 53.0],
      [12.5, 44.0], [25.0, 35.0], [35.0, 36.0], [42.0, 42.0], [50.0, 50.0],
      [58.0, 55.0], [65.0, 42.0], [70.0, 32.0]
    ]
  },
  // JAPAN
  {
    name: 'JAPAN',
    centroid: [36.0, 138.0],
    coordinates: [
      [45.0, 142.0], [43.0, 145.0], [35.0, 140.0], [31.0, 130.5], [34.0, 131.0],
      [38.0, 138.0], [45.0, 142.0]
    ]
  },
  // AUSTRALIA & NZ
  {
    name: 'AUSTRALIA',
    centroid: [-25.0, 134.0],
    coordinates: [
      [-12.0, 131.0], [-11.0, 142.0], [-18.0, 146.0], [-27.0, 153.5], [-37.5, 150.0],
      [-39.0, 144.0], [-35.0, 136.0], [-32.0, 128.0], [-34.5, 115.0], [-22.0, 114.0],
      [-16.0, 123.0], [-12.0, 131.0]
    ]
  }
];

// 4. Distinct Glowing India Outline (Accented on World Map matching screenshot)
export const INDIA_OUTLINE_COORDS: [number, number][] = [
  [35.5, 74.5], [37.0, 77.0], [34.5, 78.5], [31.5, 79.0], [29.0, 80.5],
  [27.5, 88.5], [28.0, 97.0], [23.5, 93.5], [22.0, 89.0], [20.0, 86.0],
  [16.0, 82.0], [13.0, 80.2], [8.5, 77.5], [8.0, 77.0], [10.0, 76.0],
  [15.0, 74.0], [19.0, 72.8], [21.0, 72.8], [22.5, 69.0], [24.5, 68.5],
  [27.0, 71.0], [30.0, 74.0], [35.5, 74.5]
];

// 5. Geographic Transit Cities from Reference Screenshot
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

// 6. Projection Engine Supporting Both Regional & World Topographic Projections
export interface GeoProjection {
  project: (lat: number, lon: number) => [number, number];
  isInside: (lat: number, lon: number, margin?: number) => boolean;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  scale: number;
  isWorldView: boolean;
  viewBox: { x: number; y: number; w: number; h: number };
}

export function createGeoProjection(
  origin: [number, number],
  mumbai: [number, number],
  viewBox = { x: 30, y: 120, w: 1020, h: 620 }
): GeoProjection {
  const [oLat, oLon] = origin;
  const [mLat, mLon] = mumbai;

  // Calculate Great-Circle distance to determine Regional vs Full World Map
  const dLat = ((mLat - oLat) * Math.PI) / 180;
  const dLon = ((mLon - oLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((oLat * Math.PI) / 180) * Math.cos((mLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const distKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

  // If distance > 2,600 km or longitude span > 35 degrees, switch to World Topographic Map
  const isWorldView = distKm > 2600 || Math.abs(oLon - mLon) > 35;

  if (isWorldView) {
    // World View Projection (Framed with Americas on left, Atlantic in middle, India on right)
    const worldCenterLat = 26.0;
    const worldCenterLon = 10.0;
    const worldScale = viewBox.w / 260; // scale factor

    const cx = viewBox.x + viewBox.w / 2;
    const cy = viewBox.y + viewBox.h / 2 + 30;

    const project = (lat: number, lon: number): [number, number] => {
      let normLon = lon;
      if (normLon < -160) normLon += 360;
      const px = cx + (normLon - worldCenterLon) * worldScale * 1.02;
      const py = cy - (lat - worldCenterLat) * worldScale * 1.22;
      return [px, py];
    };

    const isInside = (lat: number, lon: number, margin = 60): boolean => {
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
      minLat: -60,
      maxLat: 75,
      minLon: -140,
      maxLon: 160,
      scale: worldScale,
      isWorldView: true,
      viewBox
    };
  }

  // Regional View Projection (Framing Central/Western India with State Polygons & Exact Coastline)
  const minLatRaw = Math.min(oLat, mLat);
  const maxLatRaw = Math.max(oLat, mLat);
  const minLonRaw = Math.min(oLon, mLon);
  const maxLonRaw = Math.max(oLon, mLon);

  const spanLat = Math.max(1.8, maxLatRaw - minLatRaw);
  const spanLon = Math.max(2.2, maxLonRaw - minLonRaw);

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
    isWorldView: false,
    viewBox
  };
}
