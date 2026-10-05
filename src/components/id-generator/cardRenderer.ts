// High-Resolution Canvas Renderer for MumbaiOnChain & Devcon 8 ID Cards
import type { CityLocation } from './citiesData';
import {
  calculateViewport,
  INDIA_COASTLINE,
  STATE_POLYGONS,
  INDIA_MAP_CITIES,
  generateGeodesicArc,
  generateRailwayRoute,
  calculateHaversineDistance,
  MUMBAI_METADATA,
  type CityMetadata
} from './geoEngine';

export type CardTemplate = 'classic' | 'postcard' | 'journey';
export type CardTheme = 'night' | 'marine' | 'gateway' | 'monsoon' | 'cyber';

export interface CardRenderOptions {
  template: CardTemplate;
  theme: CardTheme;
  handle: string;
  displayName: string;
  tagline: string;
  message: string;
  idNumber: number;
  avatarImage: HTMLImageElement | null;
  photoZoom: number; // 1.0 to 2.0
  city: CityLocation;
  cityMetadata?: CityMetadata;
  travelMode?: 'flight' | 'train';
  progress?: number; // 0 to 1 for Journey animation
  artworkImage?: HTMLImageElement | null;
}

const TEAL = '#5FE3D6';
const PEACH = '#F6A067';
const DISCLAIMER = 'Unofficial ID for Devcon 8, not affiliated with the Ethereum Foundation or Devcon';

// Pixel Art Sprites
const PAL: Record<string, string> = {
  K: '#17131F',
  W: '#FFFFFF',
  Y: '#FFD23F',
  O: '#F29E0C',
  T: '#5FE3D6',
  P: '#F6A067',
  S: '#CFEFFF',
  c: '#E7B375',
  C: '#B5722C',
  G: '#B9BFD3',
  R: '#E63946'
};

const SPRITES: Record<string, string[]> = {
  chai: [
    'SSSSSSSSSS',
    'SccccccccS',
    'SCcCCcCCcS',
    ' SCcCCcCS ',
    ' SCcCCcCS ',
    ' SCcCCcCS ',
    '  SCcCCS  ',
    '  SSSSSS  '
  ],
  taxi: [
    '    KKKK    ',
    '   YYYYYY   ',
    '  YSSYYSSY  ',
    ' YYSSYYSSYY ',
    'KKKKKKKKKKKK',
    'YYYYYYYYYYYY',
    'KKKKKKKKKKKW',
    ' KGGK  KGGK '
  ],
  plane: [
    '      W      ',
    '     WWW     ',
    '     WTW     ',
    '     WWW     ',
    '    WWWWW    ',
    '  WWWWWWWWW  ',
    'WWWWWWWWWWWWW',
    'WW   WWW   WW',
    '     WWW     ',
    '     WWW     ',
    '    WWWWW    ',
    '   WWPWPWW   '
  ],
  train: [
    '  KKKKKKKKKK  ',
    ' KKKKSSSSKKKK ',
    ' KKKKSSSSKKKK ',
    ' KKKKKKKKKKKK ',
    ' KTTTTTTTTTTK ',
    ' KWWKWWWWKWWK ',
    ' KWWKWWWWKWWK ',
    ' KTTTTTTTTTTK ',
    ' KKKKKKKKKKKK ',
    '  KYK    KYK  ',
    '  KKK    KKK  '
  ]
};

const spriteCache: Record<string, HTMLCanvasElement> = {};

function getSprite(name: keyof typeof SPRITES): HTMLCanvasElement {
  if (spriteCache[name]) return spriteCache[name];
  const rows = SPRITES[name];
  const w = Math.max(...rows.map((r) => r.length)) + 4;
  const h = rows.length + 4;
  const grid: (string | null)[][] = Array.from({ length: h }, () => Array(w).fill(null));

  rows.forEach((r, y) => {
    [...r].forEach((ch, x) => {
      if (ch !== ' ') grid[y + 2][x + 2] = PAL[ch];
    });
  });

  const has = (g: (string | null)[][], x: number, y: number) =>
    y >= 0 && y < h && x >= 0 && x < w && g[y][x];

  const ring = (g: (string | null)[][], col: string) => {
    const n = g.map((r) => r.slice());
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!g[y][x] && (has(g, x + 1, y) || has(g, x - 1, y) || has(g, x, y + 1) || has(g, x, y - 1))) {
          n[y][x] = col;
        }
      }
    }
    return n;
  };

  const outlined = ring(ring(grid, '#17131F'), '#FFD23F');
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    outlined.forEach((r, yy) => {
      r.forEach((col, xx) => {
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(xx, yy, 1, 1);
        }
      });
    });
  }
  return (spriteCache[name] = canvas);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: keyof typeof SPRITES,
  cx: number,
  cy: number,
  width: number,
  rot = 0
) {
  const s = getSprite(name);
  const k = width / s.width;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = 'rgba(20,10,30,0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(s, (-s.width * k) / 2, (-s.height * k) / 2, s.width * k, s.height * k);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDevconLogo(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Prismatic Diamond Eye
  ctx.save();
  ctx.shadowColor = '#5FE3D6';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(24, 0);
  ctx.lineTo(0, 32);
  ctx.lineTo(-24, 0);
  ctx.closePath();
  const grad = ctx.createLinearGradient(-24, -32, 24, 32);
  grad.addColorStop(0, '#B59CF2');
  grad.addColorStop(0.5, '#5FE3D6');
  grad.addColorStop(1, '#F6A067');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eye Iris
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#070920';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#5FE3D6';
  ctx.fill();
  ctx.restore();

  // DEVCON VIII INDIA Text
  ctx.font = '900 24px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#B59CF2';
  ctx.fillText('DEV', -34, 4);
  ctx.font = '700 11px "IBM Plex Mono", monospace';
  ctx.fillText('VIII', -34, 18);

  ctx.textAlign = 'left';
  ctx.font = '900 24px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#B59CF2';
  ctx.fillText('CON', 34, 4);
  ctx.font = '700 11px "IBM Plex Mono", monospace';
  ctx.fillText('INDIA', 34, 18);

  ctx.restore();
}

function drawGlowingAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  img: HTMLImageElement | null,
  handle: string,
  zoom = 1.0,
  theme: CardTheme = 'night'
) {
  ctx.save();
  const radius = size / 2;

  // Outer Ring Glow
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = theme === 'marine' ? PEACH : TEAL;
  ctx.lineWidth = 3;
  ctx.shadowColor = theme === 'marine' ? PEACH : TEAL;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Avatar clipping circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const minSide = Math.min(iw, ih);
    const sw = minSide / zoom;
    const sh = minSide / zoom;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, size, size);
  } else {
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, '#2D2875');
    grad.addColorStop(1, '#0C0D2A');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, size, size);

    ctx.fillStyle = '#FFF8F0';
    ctx.font = `800 ${size * 0.44}px "Bricolage Grotesque", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((handle[0] || 'D').toUpperCase(), cx, cy + 2);
  }
  ctx.restore();
}

function drawTaglinePill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number
) {
  ctx.save();
  ctx.font = '700 24px "Bricolage Grotesque", sans-serif';
  const tw = Math.min(maxW, ctx.measureText(text).width + 54);
  const th = 52;
  const x = cx - tw / 2;
  const y = cy - th / 2;

  roundRect(ctx, x, y, tw, th, 26);
  const grad = ctx.createLinearGradient(x, y, x + tw, y);
  grad.addColorStop(0, '#5FE3D6');
  grad.addColorStop(0.5, '#B59CF2');
  grad.addColorStop(1, '#F6A067');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(18, 19, 56, 0.85)';
  ctx.fill();

  ctx.fillStyle = '#FFF8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawIdBadge(
  ctx: CanvasRenderingContext2D,
  idNumber: number,
  x: number,
  y: number,
  size = 20
) {
  const formatted = String(idNumber).padStart(4, '0');
  const text = `ID NO. ${formatted}`;

  ctx.save();
  ctx.font = `800 ${size}px "IBM Plex Mono", monospace`;
  const w = ctx.measureText(text).width + 24;
  const h = size + 16;

  roundRect(ctx, x, y - h / 2, w, h, 8);
  ctx.fillStyle = PEACH;
  ctx.fill();

  ctx.fillStyle = '#070920';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 12, y);
  ctx.restore();
}

// ============================================================================
// TEMPLATE 1: CLASSIC SIGNATURE CARD
// ============================================================================
export function renderMumbaiCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1080,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#070920');
  bg.addColorStop(0.5, '#12102E');
  bg.addColorStop(1, '#1A123E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Border glow
  ctx.strokeStyle = 'rgba(95, 227, 214, 0.4)';
  ctx.lineWidth = 4;
  roundRect(ctx, 32, 32, w - 64, h - 64, 36);
  ctx.stroke();

  // Top Brand
  drawDevconLogo(ctx, w / 2, 96, 1.1);

  // Large Central Avatar
  drawGlowingAvatar(ctx, w / 2, 340, 220, options.avatarImage, options.handle, options.photoZoom, options.theme);

  // Display Name & Handle
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 52px "Bricolage Grotesque", sans-serif';
  ctx.fillText(options.displayName || `@${options.handle}`, w / 2, 530);

  ctx.fillStyle = 'rgba(181, 156, 242, 0.9)';
  ctx.font = '600 28px "IBM Plex Mono", monospace';
  ctx.fillText(`@${options.handle || 'yourhandle'}`, w / 2, 580);

  // Tagline
  drawTaglinePill(ctx, options.tagline, w / 2, 670, w - 160);

  // ID & Event Info
  drawIdBadge(ctx, options.idNumber, 72, 780, 24);

  ctx.textAlign = 'left';
  ctx.font = '700 22px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Mumbai, India • 3–6 Nov 2026', 72, 850);

  ctx.textAlign = 'right';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.fillText('devcon8-id.vercel.app', w - 72, 850);

  // Disclaimer
  ctx.textAlign = 'center';
  ctx.font = '500 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240, 234, 255, 0.5)';
  ctx.fillText(DISCLAIMER, w / 2, h - 54);

  ctx.restore();
}

// ============================================================================
// TEMPLATE 2: POSTCARD CARD
// ============================================================================
export function renderPostcardCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1080,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Vintage cyberpunk postcard style
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0E0C28');
  bg.addColorStop(1, '#1E1644');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawDevconLogo(ctx, 160, 96, 0.9);

  // Header Title
  ctx.textAlign = 'right';
  ctx.font = '900 48px "Fraunces", serif';
  ctx.fillStyle = '#FFF8F0';
  ctx.fillText('GREETINGS FROM', w - 72, 90);
  ctx.font = '900 56px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = TEAL;
  ctx.fillText('MUMBAI', w - 72, 146);

  // Postcard content split
  const mx = 72;
  const my = 220;
  const mw = w - 144;
  const mh = 500;

  roundRect(ctx, mx, my, mw, mh, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(181, 156, 242, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Avatar Stamp
  drawGlowingAvatar(ctx, mx + 110, my + 130, 160, options.avatarImage, options.handle, options.photoZoom, options.theme);

  // Postcard message text
  ctx.textAlign = 'left';
  ctx.font = '600 24px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`@${options.handle || 'yourhandle'}`, mx + 220, my + 100);

  ctx.font = '400 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const msg = `"${options.message || "Building the future from Mumbai. See you onchain at Devcon 8!"}"`;
  ctx.fillText(msg, mx + 220, my + 150);

  // Tagline & Stamp
  drawTaglinePill(ctx, options.tagline, w / 2, 780, w - 160);
  drawIdBadge(ctx, options.idNumber, 72, 870, 22);

  ctx.textAlign = 'right';
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Mumbai, India • 3–6 Nov 2026', w - 72, 870);

  ctx.textAlign = 'center';
  ctx.font = '500 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240, 234, 255, 0.5)';
  ctx.fillText(DISCLAIMER, w / 2, h - 54);

  ctx.restore();
}

// ============================================================================
// TEMPLATE 3: JOURNEY TO DEVCON 8 (Interactive Real Geographic Map Card)
// ============================================================================
export function renderJourneyCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1080,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const originLat = options.cityMetadata?.lat || options.city?.lat || 23.1815;
  const originLon = options.cityMetadata?.lon || options.city?.lon || 79.9864;
  const originName = (options.cityMetadata?.name || options.city?.name || 'Jabalpur').toUpperCase();
  const travelMode = options.travelMode || 'flight';

  // 1. Dynamic Geodesic / Railway Route Calculation
  let routeCoords: [number, number][];
  let distanceKm: number;

  if (travelMode === 'train') {
    const railResult = generateRailwayRoute(originName, { lat: originLat, lon: originLon });
    routeCoords = railResult.coords;
    distanceKm = railResult.distanceKm;
  } else {
    routeCoords = generateGeodesicArc(originLat, originLon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon, 60);
    distanceKm = calculateHaversineDistance(originLat, originLon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon);
  }

  // 2. Dynamic Viewport Framing (fitBounds)
  const viewport = calculateViewport(originLat, originLon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon);
  const project = (lat: number, lon: number): [number, number] => {
    return viewport.project(lat, lon, w, h * 0.72, 80);
  };

  // 3. Background: Deep Navy Oceanic Abyss
  const ocean = ctx.createRadialGradient(w / 2, h * 0.4, 100, w / 2, h / 2, 840);
  ocean.addColorStop(0, '#16194A');
  ocean.addColorStop(0.6, '#0D0F2E');
  ocean.addColorStop(1, '#070920');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // 4. Subtle Dotted Geographic Grid Matrix
  ctx.fillStyle = 'rgba(181, 156, 242, 0.12)';
  const gridStep = 32;
  for (let gx = 40; gx < w - 40; gx += gridStep) {
    for (let gy = 140; gy < h * 0.74; gy += gridStep) {
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }

  // 5. Geographic Coastlines (Arabian Sea & Western/Central India)
  ctx.save();
  ctx.strokeStyle = 'rgba(95, 227, 214, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(95, 227, 214, 0.4)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  let firstCoast = true;
  for (const [cLat, cLon] of INDIA_COASTLINE) {
    const [cx, cy] = project(cLat, cLon);
    if (firstCoast) {
      ctx.moveTo(cx, cy);
      firstCoast = false;
    } else {
      ctx.lineTo(cx, cy);
    }
  }
  ctx.stroke();
  ctx.restore();

  // 6. State Boundaries & Labeled Territories
  for (const state of STATE_POLYGONS) {
    const [stX, stY] = project(state.center[0], state.center[1]);

    // Draw thin state boundary polygon
    ctx.save();
    ctx.strokeStyle = 'rgba(181, 156, 242, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    state.polygon.forEach(([pLat, pLon], pIdx) => {
      const [px, py] = project(pLat, pLon);
      if (pIdx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();

    // Labeled State Centroid in Dotted Uppercase Mono Typography (matching screenshot)
    if (stX > 60 && stX < w - 60 && stY > 160 && stY < h * 0.72) {
      ctx.save();
      ctx.font = '800 18px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(181, 156, 242, 0.22)';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText(state.name, stX, stY);
      ctx.restore();
    }
  }

  // 7. Surrounding Regional Geographic Cities (matching screenshot nodes)
  for (const [cityName, cLat, cLon] of INDIA_MAP_CITIES) {
    if (cityName.toUpperCase() === originName || cityName === 'Mumbai') continue;
    const [nx, ny] = project(cLat, cLon);

    if (nx > 70 && nx < w - 70 && ny > 160 && ny < h * 0.7) {
      ctx.fillStyle = 'rgba(95, 227, 214, 0.75)';
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '600 14px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cityName, nx + 8, ny + 4);
    }
  }

  // 8. Glowing Route Line (Flight Geodesic vs Railway Track)
  const projectedRoute = routeCoords.map(([rLat, rLon]) => project(rLat, rLon));

  if (travelMode === 'train') {
    // Railway Track Styling: High-tech dual rails & sleepers
    ctx.save();
    ctx.strokeStyle = 'rgba(246, 160, 103, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    projectedRoute.forEach(([rx, ry], idx) => {
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // Railway Sleepers (Dashed Track Ties)
    ctx.strokeStyle = '#F6A067';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    projectedRoute.forEach(([rx, ry], idx) => {
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.restore();
  } else {
    // Flight Geodesic Curve (Glow + Dotted Lavender Path matching screenshot)
    ctx.save();
    ctx.shadowColor = '#5FE3D6';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(95, 227, 214, 0.45)';
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    projectedRoute.forEach(([rx, ry], idx) => {
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // Solid Inner Core
    ctx.strokeStyle = '#B59CF2';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    projectedRoute.forEach(([rx, ry], idx) => {
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.restore();
  }

  // 9. Mumbai Destination Marker (Peach concentric beacon + label)
  const [mumX, mumY] = project(MUMBAI_METADATA.lat, MUMBAI_METADATA.lon);

  for (let r = 1; r <= 3; r++) {
    ctx.strokeStyle = `rgba(246, 160, 103, ${0.7 - r * 0.18})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mumX, mumY, r * 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = PEACH;
  ctx.beginPath();
  ctx.arc(mumX, mumY, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // Mumbai Label Pill
  ctx.save();
  const mLabel = 'MUMBAI • DEVCON 8';
  ctx.font = '800 16px "Pixelify Sans", monospace';
  const mlw = ctx.measureText(mLabel).width + 32;
  roundRect(ctx, mumX - mlw / 2, mumY + 22, mlw, 36, 18);
  ctx.fillStyle = PEACH;
  ctx.fill();
  ctx.fillStyle = '#070920';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mLabel, mumX, mumY + 40);
  ctx.restore();

  // 10. Origin City Marker & Badge
  const [srcX, srcY] = project(originLat, originLon);

  // Origin Glowing Avatar / Badge (matching circular node with "8" in screenshot)
  drawGlowingAvatar(
    ctx,
    srcX,
    srcY - 24,
    52,
    options.avatarImage,
    options.handle,
    options.photoZoom,
    'night'
  );

  // Origin City Teal Label Pill
  ctx.save();
  ctx.font = '800 16px "Pixelify Sans", monospace';
  const clw = ctx.measureText(originName).width + 30;
  roundRect(ctx, srcX - clw / 2, srcY + 32, clw, 34, 17);
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.fillStyle = '#070920';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(originName, srcX, srcY + 49);
  ctx.restore();

  // 11. Animated Travel Vehicle (Plane ✈️ or Train 🚆)
  const progress = options.progress !== undefined ? options.progress : 0.65;
  const pIdx = Math.min(
    projectedRoute.length - 1,
    Math.max(0, Math.floor(progress * (projectedRoute.length - 1)))
  );
  const currentPos = projectedRoute[pIdx];
  const nextPos = projectedRoute[Math.min(projectedRoute.length - 1, pIdx + 1)];
  const angle = Math.atan2(nextPos[1] - currentPos[1], nextPos[0] - currentPos[0]) + Math.PI / 2;

  if (travelMode === 'train') {
    drawSprite(ctx, 'train', currentPos[0], currentPos[1], 44, angle);
  } else {
    drawSprite(ctx, 'plane', currentPos[0], currentPos[1], 48, angle);
  }

  // 12. Top-Left: Devcon VIII India Branding & Moon Glow (matching Screenshot 3)
  drawDevconLogo(ctx, 160, 96, 1.05);

  // 13. Top-Right: Pill `BHOPAL → MUMBAI` and bold `660 km` (matching Screenshot 3)
  const destBadge = `${originName}  ➔  MUMBAI`;
  const kmBadge = `${distanceKm.toLocaleString()} km`;

  const bw = 310;
  const bh = 90;
  const bx = w - 64 - bw;
  const by = 48;

  roundRect(ctx, bx, by, bw, bh, 20);
  ctx.fillStyle = 'rgba(20, 23, 72, 0.88)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(181, 156, 242, 0.4)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '700 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(destBadge, bx + bw / 2, by + 30);

  ctx.font = '800 36px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(kmBadge, bx + bw / 2, by + 70);

  // 14. Bottom Section: Handle, Tagline Pill, ID, Date, Website & Disclaimer (matching Screenshot 3)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 62px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 22;
  ctx.fillText(`@${options.handle || 'yourhandle'}`, w / 2, 770);
  ctx.restore();

  // Tagline
  drawTaglinePill(ctx, options.tagline || "I'm going to Devcon 8", w / 2, 840, w - 160);

  // ID Badge & Location Bottom Left
  drawIdBadge(ctx, options.idNumber, 64, 905, 22);

  ctx.save();
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Mumbai, India · 3–6 Nov 2026', 64, 956);

  // Bottom Right: Make yours at devcon8-id.vercel.app
  ctx.textAlign = 'right';
  ctx.font = '600 16px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.fillText('Make yours at', w - 64, 922);
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('devcon8-id.vercel.app', w - 64, 952);

  // Footer Disclaimer
  ctx.textAlign = 'center';
  ctx.font = '500 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240, 234, 255, 0.45)';
  ctx.fillText(DISCLAIMER, w / 2, 1024);
  ctx.restore();

  ctx.restore();
}
