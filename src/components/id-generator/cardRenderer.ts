// High-Resolution Canvas Renderer for MumbaiOnChain ID Cards

import { MUMBAI_COORDS, getGreatCirclePoints, calculateDistanceKm, MAP_NODES, STATES_OUTLINES, CityLocation } from './citiesData';

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
  progress?: number; // 0 to 1 for Journey animation
  artworkImage?: HTMLImageElement | null;
}

const TEAL = '#5FE3D6';
const LAVENDER = '#B59CF2';
const PEACH = '#F6A067';
const INK = '#FFF8F0';
const NIGHT = '#121338';
const DISCLAIMER = 'Unofficial ID for MumbaiOnChain & Devcon 8. Built for the community.';

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
  G: '#B9BFD3'
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

function drawSprite(
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
  ctx.shadowColor = 'rgba(20,10,30,0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(s, (-s.width * k) / 2, (-s.height * k) / 2, s.width * k, s.height * k);
  ctx.restore();
}

// Rounded rectangle helper
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

// 3-color smooth gradient
function gradient3(ctx: CanvasRenderingContext2D, x1: number, x2: number, theme: CardTheme = 'night') {
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  if (theme === 'marine') {
    g.addColorStop(0, '#38BDF8');
    g.addColorStop(0.5, '#F59E0B');
    g.addColorStop(1, '#EF4444');
  } else if (theme === 'gateway') {
    g.addColorStop(0, '#C084FC');
    g.addColorStop(0.5, '#34D399');
    g.addColorStop(1, '#60A5FA');
  } else if (theme === 'cyber') {
    g.addColorStop(0, '#00F0FF');
    g.addColorStop(0.5, '#7000FF');
    g.addColorStop(1, '#FF007A');
  } else {
    // Night & Monsoon default
    g.addColorStop(0, TEAL);
    g.addColorStop(0.5, LAVENDER);
    g.addColorStop(1, PEACH);
  }
  return g;
}

// Draw ID Badge (Peach with 3D drop shadow)
export function drawIdBadge(
  ctx: CanvasRenderingContext2D,
  idNumber: number,
  x: number,
  y: number,
  size = 20
) {
  const idStr = idNumber ? String(idNumber).padStart(4, '0') : '----';
  const text = `MOC ID NO. ${idStr}`;

  ctx.save();
  ctx.font = `700 ${size}px "Pixelify Sans", "IBM Plex Mono", monospace`;
  const textWidth = ctx.measureText(text).width;
  const w = textWidth + size * 1.5;
  const h = size * 1.6;

  // Shadow bottom layer
  ctx.fillStyle = '#17131F';
  ctx.fillRect(x, y + h, w, Math.max(3, size * 0.16));

  // Front Peach badge
  ctx.fillStyle = PEACH;
  ctx.fillRect(x, y, w, h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#17131F';
  ctx.fillText(text, x + size * 0.75, y + h / 2 + 1);
  ctx.restore();
}

// Draw Tagline Badge Pill
function drawTaglinePill(
  ctx: CanvasRenderingContext2D,
  tagline: string,
  cx: number,
  cy: number,
  maxWidth = 700
) {
  if (!tagline) return;
  ctx.save();
  ctx.font = '700 24px "Inter", sans-serif';
  let s = 24;
  while (s > 15 && ctx.measureText(tagline).width > maxWidth - 60) {
    s -= 1;
    ctx.font = `700 ${s}px "Inter", sans-serif`;
  }

  const tw = ctx.measureText(tagline).width;
  const pw = tw + 48;
  const ph = 48;
  const px = cx - pw / 2;
  const py = cy - ph / 2;

  roundRect(ctx, px, py, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(18, 16, 52, 0.85)';
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = TEAL;
  ctx.shadowColor = TEAL;
  ctx.shadowBlur = 8;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagline, cx, cy + 1);
  ctx.restore();
}

// Draw Avatar with glowing outer aura
function drawGlowingAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  img: HTMLImageElement | null,
  handle: string,
  zoom = 1,
  theme: CardTheme = 'night'
) {
  // Radiant moon glow
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 2.2);
  glow.addColorStop(0, 'rgba(95, 227, 214, 0.7)');
  glow.addColorStop(0.5, 'rgba(181, 156, 242, 0.3)');
  glow.addColorStop(1, 'rgba(95, 227, 214, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Gradient outer ring
  const ringWidth = Math.max(6, radius * 0.08);
  ctx.fillStyle = gradient3(ctx, cx - radius, cx + radius, theme);
  ctx.beginPath();
  ctx.arc(cx, cy, radius + ringWidth, 0, Math.PI * 2);
  ctx.fill();

  // Inner black separation gap
  ctx.fillStyle = NIGHT;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.fill();

  // Circular clipped avatar photo
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.naturalWidth > 0) {
    const s = Math.min(img.naturalWidth, img.naturalHeight) / Math.max(1, zoom);
    const sx = (img.naturalWidth - s) / 2;
    const sy = (img.naturalHeight - s) / 2;
    ctx.drawImage(img, sx, sy, s, s, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    // Procedural Fallback Avatar inside circle
    const g = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    g.addColorStop(0, '#3B2F86');
    g.addColorStop(1, '#16194A');
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    ctx.font = `800 ${radius * 0.9}px "Bricolage Grotesque", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF8F0';
    ctx.fillText((handle[0] || 'M').toUpperCase(), cx, cy + 4);
  }
  ctx.restore();
}

// ============================================================================
// TEMPLATE 1: MUMBAI (Signature MumbaiOnChain ID)
// ============================================================================
export function renderMumbaiCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1080,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Background base
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#101236');
  bgGrad.addColorStop(0.5, '#1B1846');
  bgGrad.addColorStop(1, '#0C0A26');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Artwork layer (Gateway of India illustration)
  if (options.artworkImage && options.artworkImage.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(options.artworkImage, 0, 0, w, h);
    ctx.restore();
  }

  // Soft atmospheric gradient overlay
  const atmGrad = ctx.createLinearGradient(0, 0, 0, h);
  atmGrad.addColorStop(0, 'rgba(16, 18, 54, 0.25)');
  atmGrad.addColorStop(0.55, 'rgba(16, 18, 54, 0.45)');
  atmGrad.addColorStop(0.85, 'rgba(12, 10, 38, 0.92)');
  atmGrad.addColorStop(1, '#0C0A26');
  ctx.fillStyle = atmGrad;
  ctx.fillRect(0, 0, w, h);

  // Top Header: MUMBAI ONCHAIN Brand Badge
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 36px "Fraunces", serif';
  ctx.fillStyle = '#FFF8F0';
  ctx.shadowColor = 'rgba(95, 227, 214, 0.6)';
  ctx.shadowBlur = 18;
  ctx.fillText('MUMBAI ONCHAIN', w / 2, 88);

  ctx.font = '700 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.letterSpacing = '4px';
  ctx.fillText('IDENTITY CREDENTIAL // 2026', w / 2, 116);
  ctx.restore();

  // Floating Ethereum Diamond nodes
  const drawDiamond = (dx: number, dy: number, ds: number, alpha = 0.6) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(95,227,214,0.15)';
    ctx.beginPath();
    ctx.moveTo(dx, dy - ds);
    ctx.lineTo(dx + ds * 0.6, dy);
    ctx.lineTo(dx, dy + ds);
    ctx.lineTo(dx - ds * 0.6, dy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  drawDiamond(120, 580, 52, 0.7);
  drawDiamond(960, 580, 52, 0.7);
  drawDiamond(240, 640, 36, 0.5);
  drawDiamond(840, 640, 36, 0.5);

  // Center Moon & Avatar
  const moonX = w / 2;
  const moonY = 430;
  const avatarRadius = 130;
  drawGlowingAvatar(
    ctx,
    moonX,
    moonY,
    avatarRadius,
    options.avatarImage,
    options.handle,
    options.photoZoom,
    options.theme
  );

  // User Handle / Display Name
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const handleText = `@${options.handle || 'yourhandle'}`;

  // Big handle font
  ctx.font = '800 68px "Bricolage Grotesque", "Inter", sans-serif';
  let fontSize = 68;
  while (fontSize > 36 && ctx.measureText(handleText).width > w - 160) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px "Bricolage Grotesque", "Inter", sans-serif`;
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 24;
  ctx.fillText(handleText, w / 2, 690);

  // Optional display name below handle if different
  if (options.displayName && options.displayName.toLowerCase() !== options.handle.toLowerCase()) {
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,248,240,0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText(options.displayName, w / 2, 730);
  }
  ctx.restore();

  // Tagline Badge Pill
  drawTaglinePill(ctx, options.tagline, w / 2, 795, w - 160);

  // Bottom Area: ID NO badge, Location, Date, Footer URL
  drawIdBadge(ctx, options.idNumber, 72, 888, 22);

  ctx.save();
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Mumbai, India • 01—08 Nov 2026', 72, 950);

  ctx.textAlign = 'right';
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.fillText('Make yours at', w - 72, 915);
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('mumbai-onchain.vercel.app', w - 72, 946);

  // Disclaimer
  ctx.textAlign = 'center';
  ctx.font = '500 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240, 234, 255, 0.45)';
  ctx.fillText(DISCLAIMER, w / 2, 1024);
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// TEMPLATE 2: POSTCARD (Greetings From Mumbai)
// ============================================================================
export function renderPostcardCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1440,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Outer dark background
  ctx.fillStyle = '#0B0A22';
  ctx.fillRect(0, 0, w, h);

  // Pixel border around canvas
  ctx.fillStyle = TEAL;
  ctx.fillRect(24, 24, w - 48, 6);
  ctx.fillRect(24, h - 30, w - 48, 6);
  ctx.fillRect(24, 24, 6, h - 48);
  ctx.fillRect(w - 30, 24, 6, h - 48);

  // Corner squares
  [
    [24, 24],
    [w - 42, 24],
    [24, h - 42],
    [w - 42, h - 42]
  ].forEach(([cx, cy]) => {
    ctx.fillStyle = PEACH;
    ctx.fillRect(cx, cy, 18, 18);
  });

  // LEFT SIDE: Photo Postcard Artwork (760 x 936)
  const ix = 72;
  const iy = 72;
  const iw = 760;
  const ih = 936;

  // Teal drop glow around picture frame
  ctx.save();
  ctx.shadowColor = 'rgba(95,227,214,0.5)';
  ctx.shadowBlur = 36;
  ctx.fillStyle = TEAL;
  ctx.fillRect(ix - 12, iy - 12, iw + 24, ih + 24);
  ctx.restore();

  ctx.fillStyle = '#0B0A22';
  ctx.fillRect(ix - 4, iy - 4, iw + 8, ih + 8);

  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  // Background artwork
  if (options.artworkImage && options.artworkImage.naturalWidth > 0) {
    const sc = ih / options.artworkImage.naturalHeight;
    const srcW = iw / sc;
    ctx.drawImage(
      options.artworkImage,
      options.artworkImage.naturalWidth / 2 - srcW / 2,
      0,
      srcW,
      options.artworkImage.naturalHeight,
      ix,
      iy,
      iw,
      ih
    );
  } else {
    const bg = ctx.createLinearGradient(0, iy, 0, iy + ih);
    bg.addColorStop(0, '#E8906A');
    bg.addColorStop(0.5, '#7A5CC0');
    bg.addColorStop(1, '#1B2A5A');
    ctx.fillStyle = bg;
    ctx.fillRect(ix, iy, iw, ih);
  }

  // Vignette overlay
  const g = ctx.createLinearGradient(0, iy + ih * 0.45, 0, iy + ih);
  g.addColorStop(0, 'rgba(11,10,34,0)');
  g.addColorStop(0.45, 'rgba(11,10,34,0.7)');
  g.addColorStop(1, 'rgba(11,10,34,0.96)');
  ctx.fillStyle = g;
  ctx.fillRect(ix, iy, iw, ih);

  // "GREETINGS FROM" Retro Text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 52px "Pixelify Sans", monospace';
  ctx.fillStyle = TEAL;
  ctx.shadowColor = TEAL;
  ctx.shadowBlur = 18;
  ctx.fillText('GREETINGS FROM', ix + 44, iy + ih - 220);
  ctx.shadowBlur = 0;

  // Giant 3D "MUMBAI" text
  ctx.font = '700 168px "Pixelify Sans", monospace';
  ctx.fillStyle = '#7A3A8C';
  ctx.fillText('MUMBAI', ix + 46, iy + ih - 62);

  // Gradient front face
  ctx.fillStyle = gradient3(ctx, ix + 40, ix + 720, options.theme);
  ctx.fillText('MUMBAI', ix + 38, iy + ih - 70);
  ctx.restore();

  // ID Badge on photo top left
  drawIdBadge(ctx, options.idNumber, ix + 24, iy + 24, 26);

  // Retro Taxi sprite on photo top right
  drawSprite(ctx, 'taxi', ix + iw - 90, iy + 92, 140, 0.08);

  // RIGHT SIDE: Postcard Back
  const rx = 900;

  // Dotted vertical perforation line
  for (let y = 100; y < 980; y += 22) {
    ctx.fillStyle = 'rgba(181,156,242,0.45)';
    ctx.fillRect(872, y, 8, 10);
  }

  // Postage Stamp in top right
  const stx = 1150;
  const sty = 74;
  const sw = 226;
  const shh = 270;

  ctx.save();
  ctx.shadowColor = 'rgba(246,160,103,0.45)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = PEACH;
  ctx.fillRect(stx, sty, sw, shh);
  ctx.restore();

  // Scalloped perforated stamp edge
  ctx.fillStyle = '#0B0A22';
  for (let i = 0; i < sw; i += 22) {
    ctx.fillRect(stx + i + 6, sty - 2, 10, 8);
    ctx.fillRect(stx + i + 6, sty + shh - 6, 10, 8);
  }
  for (let j = 0; j < shh; j += 22) {
    ctx.fillRect(stx - 2, sty + j + 6, 8, 10);
    ctx.fillRect(stx + sw - 6, sty + j + 6, 8, 10);
  }

  // Stamp Avatar image
  ctx.fillRect(stx + 16, sty + 16, sw - 32, sw - 32);
  if (options.avatarImage) {
    ctx.drawImage(options.avatarImage, stx + 22, sty + 22, sw - 44, sw - 44);
  } else {
    ctx.fillStyle = '#2B2E86';
    ctx.fillRect(stx + 22, sty + 22, sw - 44, sw - 44);
    ctx.font = '800 72px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText((options.handle[0] || 'M').toUpperCase(), stx + sw / 2, sty + sw / 2 + 10);
  }

  // Stamp Text
  ctx.fillStyle = '#17131F';
  ctx.font = '700 28px "Pixelify Sans", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('INDIA', stx + 18, sty + shh - 18);
  ctx.textAlign = 'right';
  ctx.fillText('8', stx + sw - 18, sty + shh - 18);

  // Circular Postmark Stamp
  const pmx = 1036;
  const pmy = 316;
  const pmc = 'rgba(95,227,214,0.85)';

  const pixelCircle = (cx: number, cy: number, r: number, cell: number) => {
    ctx.fillStyle = pmc;
    for (let a = 0; a < Math.PI * 2; a += cell / r / 1.5) {
      const px = Math.round((cx + Math.cos(a) * r) / cell) * cell;
      const py = Math.round((cy + Math.sin(a) * r) / cell) * cell;
      ctx.fillRect(px - cell / 2, py - cell / 2, cell, cell);
    }
  };
  pixelCircle(pmx, pmy, 92, 8);
  pixelCircle(pmx, pmy, 76, 8);

  ctx.textAlign = 'center';
  ctx.fillStyle = TEAL;
  ctx.font = '700 24px "Pixelify Sans", monospace';
  ctx.fillText('MUMBAI', pmx, pmy - 26);
  ctx.font = '700 30px "Pixelify Sans", monospace';
  ctx.fillText('03.11.26', pmx, pmy + 12);
  ctx.font = '700 20px "Pixelify Sans", monospace';
  ctx.fillText('MUMBAI ONCHAIN', pmx, pmy + 44);

  // Wavy lines on postmark
  for (let k = 0; k < 4; k++) {
    for (let t = 0; t < 6; t++) {
      ctx.fillStyle = pmc;
      ctx.fillRect(pmx - 120 - t * 14, pmy - 40 + k * 26 + Math.round(Math.sin(t * 0.9) * 2) * 4, 12, 6);
    }
  }

  // Message Box (User custom message)
  const mx = rx + 4;
  const my = 420;
  const mw = 476;
  const mh = 330;

  ctx.fillStyle = 'rgba(11,10,34,0.9)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.lineWidth = 4;
  ctx.strokeStyle = LAVENDER;
  ctx.strokeRect(mx, my, mw, mh);

  // "MESSAGE" header tab
  ctx.fillStyle = LAVENDER;
  ctx.fillRect(mx + 20, my - 18, 170, 36);
  ctx.fillStyle = '#17131F';
  ctx.font = '700 24px "Pixelify Sans", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MESSAGE', mx + 38, my + 9);

  // Word-wrapped Message
  const words = (options.message || 'gm from Mumbai! Building onchain.').split(' ');
  const lines: string[] = [];
  let currentLine = '';
  ctx.font = '700 32px "Pixelify Sans", monospace';
  words.forEach((wrd) => {
    const test = currentLine ? `${currentLine} ${wrd}` : wrd;
    if (ctx.measureText(test).width <= mw - 54) {
      currentLine = test;
    } else {
      lines.push(currentLine);
      currentLine = wrd;
    }
  });
  if (currentLine) lines.push(currentLine);

  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  lines.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, mx + 28, my + 64 + i * 44);
  });

  // Handle signature
  const sig = `- @${options.handle || 'yourhandle'}`;
  ctx.fillStyle = PEACH;
  ctx.fillText(sig, mx + 28, my + 64 + Math.min(lines.length, 4) * 44 + 14);

  // Cutting Chai sticker
  drawSprite(ctx, 'chai', mx + mw - 14, my + mh - 14, 88, 0.12);

  // Recipient address
  ctx.textAlign = 'left';
  ctx.font = '700 22px "Pixelify Sans", monospace';
  ctx.fillStyle = PEACH;
  ctx.fillText('TO:', rx + 4, 822);

  ctx.font = '700 30px "Pixelify Sans", monospace';
  [
    ['The Ethereum Fam', 822],
    ['Jio World Centre, BKC', 878],
    ['Mumbai, India', 934]
  ].forEach(([t, yCoord]) => {
    ctx.fillStyle = INK;
    ctx.fillText(String(t), rx + 70, Number(yCoord));
    for (let i = rx + 70; i < 1390; i += 16) {
      ctx.fillStyle = 'rgba(181,156,242,0.45)';
      ctx.fillRect(i, Number(yCoord) + 14, 10, 4);
    }
  });

  // Footer URL & Disclaimer
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240,234,255,0.6)';
  ctx.fillText('mumbai-onchain.vercel.app', rx + 4, 994);

  ctx.textAlign = 'center';
  ctx.font = '500 14px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240,234,255,0.5)';
  ctx.fillText(DISCLAIMER, w / 2, h - 36);

  ctx.restore();
}

// ============================================================================
// TEMPLATE 3: JOURNEY (Map & Animated Geodesic Flight Route to Mumbai)
// ============================================================================
export function renderJourneyCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions,
  w = 1080,
  h = 1080
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const fromCity = options.city || { name: 'Jabalpur', lat: 23.18, lon: 79.99, country: 'IN', isDomestic: true };
  const fromCoord: [number, number] = [fromCity.lat, fromCity.lon];
  const distanceKm = calculateDistanceKm(fromCoord[0], fromCoord[1], MUMBAI_COORDS[0], MUMBAI_COORDS[1]);
  const isDomestic = fromCity.country === 'IN';

  // 1. Base Layer: Navy Ocean & Ambient Glow
  const ocean = ctx.createRadialGradient(w / 2, h * 0.45, 100, w / 2, h / 2, 820);
  ocean.addColorStop(0, '#141748');
  ocean.addColorStop(1, '#070920');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // Map projection coordinates:
  // Center roughly between origin and Mumbai
  const lat0 = (fromCoord[0] + MUMBAI_COORDS[0]) / 2;
  const lon0 = (fromCoord[1] + MUMBAI_COORDS[1]) / 2;
  const cl = Math.cos((lat0 * Math.PI) / 180);

  const spanX = Math.max(1.2, Math.abs(fromCoord[1] - MUMBAI_COORDS[1]) * cl);
  const spanY = Math.max(1.2, Math.abs(fromCoord[0] - MUMBAI_COORDS[0]));

  const scale = Math.max(22, Math.min(560 / spanX, 360 / spanY, isDomestic ? 110 : 45));
  const cx0 = w / 2;
  const cy0 = 460;

  const project = (lat: number, lon: number): [number, number] => {
    return [cx0 + (lon - lon0) * cl * scale, cy0 - (lat - lat0) * scale];
  };

  // 2. Latitude / Longitude Grids
  ctx.strokeStyle = 'rgba(181,156,242,0.1)';
  ctx.lineWidth = 1.5;
  for (let lo = -180; lo <= 180; lo += 5) {
    const [px] = project(lat0, lo);
    if (px > 0 && px < w) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }
  for (let la = -80; la <= 80; la += 5) {
    const [, py] = project(la, lon0);
    if (py > 0 && py < h) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }
  }

  // 3. Indian State / Region Map Outlines
  STATES_OUTLINES.forEach(([stateName, sLat, sLon]) => {
    const [sx, sy] = project(sLat, sLon);
    if (sx > 40 && sx < w - 40 && sy > 40 && sy < h - 40) {
      ctx.fillStyle = 'rgba(181, 156, 242, 0.16)';
      ctx.font = '700 16px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(stateName, sx, sy);
    }
  });

  // Map Waypoint Nodes
  MAP_NODES.forEach(([nodeName, nLat, nLon]) => {
    const [nx, ny] = project(nLat, nLon);
    if (nx > 60 && nx < w - 60 && ny > 60 && ny < h - 60) {
      ctx.fillStyle = 'rgba(95, 227, 214, 0.7)';
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(nodeName, nx + 7, ny + 4);
    }
  });

  // 4. Geodesic Flight Route
  const routePoints = getGreatCirclePoints(fromCoord, MUMBAI_COORDS, 80);
  const projectedRoute = routePoints.map(([rLat, rLon]) => project(rLat, rLon));

  // Glowing Outer Route Arc
  ctx.save();
  ctx.shadowColor = TEAL;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = 'rgba(95, 227, 214, 0.45)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  projectedRoute.forEach(([rx, ry], idx) => {
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();
  ctx.restore();

  // Solid Inner Route Arc
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  projectedRoute.forEach(([rx, ry], idx) => {
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Mumbai Destination Beacon (Radiating concentric rings)
  const [mumX, mumY] = project(MUMBAI_COORDS[0], MUMBAI_COORDS[1]);

  for (let r = 1; r <= 3; r++) {
    ctx.strokeStyle = `rgba(246, 160, 103, ${0.7 - r * 0.18})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mumX, mumY, r * 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = PEACH;
  ctx.beginPath();
  ctx.arc(mumX, mumY, 7, 0, Math.PI * 2);
  ctx.fill();

  // Mumbai Label Pill
  ctx.save();
  const mLabel = 'MUMBAI • DEVCON 8';
  ctx.font = '700 16px "Pixelify Sans", monospace';
  const mlw = ctx.measureText(mLabel).width + 30;
  roundRect(ctx, mumX - mlw / 2, mumY + 24, mlw, 36, 18);
  ctx.fillStyle = PEACH;
  ctx.fill();
  ctx.fillStyle = '#17131F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mLabel, mumX, mumY + 42);
  ctx.restore();

  // 6. Source City Origin Marker with Avatar Badge
  const [srcX, srcY] = project(fromCoord[0], fromCoord[1]);

  // Glowing departure marker with avatar
  drawGlowingAvatar(
    ctx,
    srcX,
    srcY - 20,
    44,
    options.avatarImage,
    options.handle,
    options.photoZoom,
    options.theme
  );

  // Source City Pill
  ctx.save();
  const cName = fromCity.name.toUpperCase();
  ctx.font = '700 16px "Pixelify Sans", monospace';
  const clw = ctx.measureText(cName).width + 28;
  roundRect(ctx, srcX - clw / 2, srcY + 36, clw, 32, 16);
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.fillStyle = '#17131F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cName, srcX, srcY + 52);
  ctx.restore();

  // 7. Airplane Sprite along the Flight Path
  const progress = options.progress !== undefined ? options.progress : 0.72;
  const pIdx = Math.min(
    projectedRoute.length - 1,
    Math.max(0, Math.floor(progress * (projectedRoute.length - 1)))
  );
  const currentPlane = projectedRoute[pIdx];
  const nextPlane = projectedRoute[Math.min(projectedRoute.length - 1, pIdx + 1)];
  const angle = Math.atan2(nextPlane[1] - currentPlane[1], nextPlane[0] - currentPlane[0]) + Math.PI / 2;

  drawSprite(ctx, 'plane', currentPlane[0], currentPlane[1], 48, angle);

  // 8. Top Header Badges
  // Brand Header Top Left
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '900 28px "Fraunces", serif';
  ctx.fillStyle = '#FFF8F0';
  ctx.fillText('MUMBAI ONCHAIN', 64, 72);
  ctx.font = '700 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.fillText('JOURNEY TO MUMBAI // 2026', 64, 96);

  // Distance Badge Top Right
  const destBadge = `${fromCity.name.toUpperCase()}  ➔  MUMBAI`;
  const kmBadge = `${distanceKm.toLocaleString()} km`;

  const bw = 320;
  const bh = 94;
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
  ctx.fillText(destBadge, bx + bw / 2, by + 32);

  ctx.font = '800 36px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(kmBadge, bx + bw / 2, by + 72);
  ctx.restore();

  // 9. Bottom Handle, Tagline & ID
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 58px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(`@${options.handle || 'yourhandle'}`, w / 2, 770);
  ctx.restore();

  // Tagline
  drawTaglinePill(ctx, options.tagline, w / 2, 840, w - 160);

  // ID Badge & Location Bottom
  drawIdBadge(ctx, options.idNumber, 64, 896, 22);

  ctx.save();
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Mumbai, India • 01—08 Nov 2026', 64, 956);

  ctx.textAlign = 'right';
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.fillStyle = TEAL;
  ctx.fillText('Make yours at', w - 64, 922);
  ctx.font = '700 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('mumbai-onchain.vercel.app', w - 64, 952);

  // Disclaimer
  ctx.textAlign = 'center';
  ctx.font = '500 13px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(240, 234, 255, 0.45)';
  ctx.fillText(DISCLAIMER, w / 2, 1024);
  ctx.restore();

  ctx.restore();
}
