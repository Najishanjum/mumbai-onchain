import QRCode, { type BitMatrix } from 'qrcode';
import type { PersonProfile } from '../types/person';
import { makePattern, roleKey, SHAPES } from './Badge';
import { profileUrl } from './qr';
import { CIRCLES, RINGS } from './Scene';

// "Save card": the badge, a QR lock-screen wallpaper and an X post, drawn
// straight onto a canvas from the same shapes and colours as the badge.
// (Screenshotting the DOM is unreliable on iPhone: missing fonts, blank photos.)

export type CardFormat = 'wallpaper' | 'post' | 'badge';

export const FORMATS: Record<CardFormat, { label: string; w: number; h: number; hint: string }> = {
  wallpaper: {
    label: 'Wallpaper',
    w: 1170,
    h: 2532,
    hint: 'Set it as your lock screen. People scan the QR straight off your phone, no unlocking needed.',
  },
  post: { label: 'X post', w: 1600, h: 900, hint: 'Share that you’ll be at Mumbai Onchain, with your QR.' },
  badge: { label: 'Badge', w: 1080, h: 1350, hint: 'Your badge on its own, for Instagram or WhatsApp.' },
};

const SANS = 'Manrope, system-ui, sans-serif';
const MONO = '"Red Hat Mono", ui-monospace, monospace';
const INK = '#121419';

interface Palette {
  role: string;
  roleDeep: string;
  card: string;
  cardInk: string;
  cardMuted: string;
  /** Colour printed on the card: the deep role shade on white, the bright one on black. */
  accent: string;
}

function palette(person: PersonProfile): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const key = roleKey(person.category);
  const role = v(`--role-${key}`, '#4FC3F7');
  const roleDeep = v(`--role-${key}-deep`, '#0A6CA3');
  const card = v('--badge-card', '#F6F5F2');
  const dark = parseInt(card.replace('#', '').slice(0, 2), 16) < 128;
  return { role, roleDeep, card, cardInk: v('--badge-ink', INK), cardMuted: v('--badge-muted', '#5A616B'), accent: dark ? role : roleDeep };
}

function loadImage(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * The profile photo, ready to draw into an exportable canvas. The badge on
 * screen already loaded it without CORS, and iPhone Safari reused that cached
 * copy for the first CORS request, so the first image of a session came out
 * without the photo. Fetching it fresh as a blob sidesteps that cache, and a
 * blob URL is same-origin, so the canvas stays exportable.
 */
async function loadPhoto(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (!/^https?:/.test(src)) return loadImage(src);
  // A URL of its own: the service worker (CacheFirst for Storage photos) also
  // keeps the badge's non-CORS copy and would hand that back here.
  const cardSrc = `${src}${src.includes('?') ? '&' : '?'}card=1`;
  try {
    const res = await fetch(cardSrc, { mode: 'cors', cache: 'reload' });
    if (!res.ok) throw new Error(String(res.status));
    const url = URL.createObjectURL(await res.blob());
    const img = await loadImage(url);
    // Keep the URL alive until the image is drawn; it's tiny and per render.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return img;
  } catch {
    return loadImage(cardSrc, true);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws an image to fill a box, cropping the overflow, like object-fit: cover. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

// ── Background ───────────────────────────────────────────────────────────
// The app's Aurora: near-black, saffron, pink and mint glows at the top and
// the line mandala off the top-right corner.

function drawAurora(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0A0A0C';
  ctx.fillRect(0, 0, w, h);
  const glow = (cx: number, cy: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(10,10,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  const m = Math.max(w, h);
  glow(w * 0.05, -m * 0.02, m * 0.5, 'rgba(255,122,31,0.55)');
  glow(w * 1.0, m * 0.04, m * 0.45, 'rgba(255,79,163,0.45)');
  glow(w * 0.5, m * 0.22, m * 0.4, 'rgba(110,240,194,0.28)');

  // Mandala, faded away from the middle like in the app.
  const size = m * 0.75;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.translate(w - size * 0.18, size * 0.1);
  ctx.scale(size / 1000, size / 1000);
  const ink = ctx.createLinearGradient(-500, -500, 500, 500);
  ink.addColorStop(0, '#F2C879');
  ink.addColorStop(0.5, '#F7A38C');
  ink.addColorStop(1, '#F2A1C8');
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  for (const r of CIRCLES) {
    ctx.lineWidth = r % 2 ? 1 : 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const [d, lw] of RINGS) {
    ctx.lineWidth = lw;
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}

// ── Badge ────────────────────────────────────────────────────────────────
// The classic card at 272×362 design units (the "lg" badge), scaled by s.

interface Assets {
  logo: HTMLImageElement | null;
  avatar: HTMLImageElement | null;
  matrix: BitMatrix | null;
}

function drawBadge(ctx: CanvasRenderingContext2D, person: PersonProfile, p: Palette, a: Assets, x: number, y: number, s: number) {
  const W = 272 * s;
  const H = 362 * s;
  const tile = W / 4;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 40 * s;
  ctx.shadowOffsetY = 18 * s;
  ctx.fillStyle = p.card;
  roundRect(ctx, x, y, W, H, 18 * s);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, W, H, 18 * s);
  ctx.clip();

  // Pattern: 4×3 logo shapes, the same ones as this person's badge in the app.
  makePattern(person.id).forEach((t, i) => {
    const tx = x + (i % 4) * tile;
    const ty = y + Math.floor(i / 4) * tile;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(tile / 40, tile / 40);
    if (t.shape === 'pixels') {
      ctx.fillStyle = '#A875FF';
      ctx.fillRect(22, 6, 9, 9);
      ctx.fillStyle = '#FF7A1F';
      ctx.fillRect(9, 16, 9, 9);
      ctx.fillStyle = '#FFC93A';
      ctx.fillRect(22, 26, 9, 9);
    } else {
      ctx.translate(20, 20);
      ctx.rotate((t.rotate * Math.PI) / 180);
      ctx.translate(-20, -20);
      const path = new Path2D(SHAPES[t.shape]);
      if (t.outline) {
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2;
        ctx.stroke(path);
      } else {
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = p.accent;
        ctx.fill(path);
      }
    }
    ctx.restore();
  });

  // Lanyard slot and the logo chip.
  ctx.fillStyle = '#0A0A0C';
  roundRect(ctx, x + W / 2 - 22 * s, y + 10 * s, 44 * s, 8 * s, 4 * s);
  ctx.fill();
  ctx.font = `800 ${11 * s}px ${SANS}`;
  const chipW = 4 * s + 24 * s + 6 * s + ctx.measureText('Mumbai Onchain').width + 12 * s;
  ctx.fillStyle = p.card;
  roundRect(ctx, x + 10 * s, y + 24 * s, chipW, 32 * s, 16 * s);
  ctx.fill();
  if (a.logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 26 * s, y + 40 * s, 12 * s, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(a.logo, x + 14 * s, y + 28 * s, 24 * s, 24 * s);
    ctx.restore();
  }
  ctx.fillStyle = p.cardInk;
  ctx.textBaseline = 'middle';
  ctx.fillText('Mumbai Onchain', x + 44 * s, y + 40.5 * s);

  // Photo (or initials), overlapping the pattern.
  const av = 88 * s;
  const avX = x + 16 * s;
  const avY = y + tile * 3 - 56 * s;
  ctx.fillStyle = p.card;
  roundRect(ctx, avX - 4 * s, avY - 4 * s, av + 8 * s, av + 8 * s, 20 * s);
  ctx.fill();
  ctx.save();
  roundRect(ctx, avX, avY, av, av, 16 * s);
  ctx.clip();
  if (a.avatar) drawCover(ctx, a.avatar, avX, avY, av, av);
  else {
    ctx.fillStyle = '#2A2E35';
    ctx.fillRect(avX, avY, av, av);
    ctx.fillStyle = p.role;
    ctx.font = `800 ${32 * s}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(initials(person.name), avX + av / 2, avY + av / 2 + 2 * s);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  // Name, role and footer.
  const left = x + 16 * s;
  const maxW = W - 32 * s;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = p.cardInk;
  let size = 28;
  ctx.font = `800 ${size * s}px ${SANS}`;
  while (ctx.measureText(person.name).width > maxW && size > 18) {
    size -= 1;
    ctx.font = `800 ${size * s}px ${SANS}`;
  }
  ctx.fillText(person.name, left, avY + av + 38 * s);
  ctx.fillStyle = p.accent;
  ctx.font = `600 ${11 * s}px ${MONO}`;
  const roleLine = `${(person.category || 'Attendee').toUpperCase()}${person.city ? ` · ${person.city.toUpperCase()}` : ''}`;
  ctx.fillText(roleLine, left, avY + av + 58 * s, maxW);
  ctx.fillStyle = p.cardMuted;
  ctx.font = `500 ${10 * s}px ${MONO}`;
  const handle = person.xHandle ? `@${person.xHandle.replace(/^@/, '')}` : '';
  ctx.fillText(handle, left, y + H - 16 * s, maxW / 2);
  ctx.textAlign = 'right';
  ctx.fillText('ONCHAIN WEEK 2026', x + W - 16 * s, y + H - 16 * s);
  ctx.textAlign = 'left';
  ctx.restore();
}

// A second shade the QR fades into, from the role colour: dark enough on
// white to keep every phone camera happy.
const QR_FADE = '#9C2A63';

/**
 * A styled QR: rounded dots and finder squares in a role-colour gradient,
 * with the logo in the middle (error correction H tolerates the gap).
 */
function drawStyledQr(ctx: CanvasRenderingContext2D, m: BitMatrix, logo: HTMLImageElement | null, p: Palette, x: number, y: number, size: number) {
  const n = m.size;
  const cell = size / n;
  const ink = ctx.createLinearGradient(x, y, x + size, y + size);
  ink.addColorStop(0, p.roleDeep);
  ink.addColorStop(1, QR_FADE);
  const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const mid = (n - 1) / 2;
  const hole = Math.floor(n * 0.11);

  ctx.fillStyle = ink;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!m.get(r, c) || finder(r, c)) continue;
      if (Math.abs(r - mid) <= hole && Math.abs(c - mid) <= hole) continue;
      roundRect(ctx, x + c * cell + cell * 0.07, y + r * cell + cell * 0.07, cell * 0.86, cell * 0.86, cell * 0.32);
      ctx.fill();
    }
  }
  for (const [r0, c0] of [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]) {
    const fx = x + c0 * cell;
    const fy = y + r0 * cell;
    ctx.fillStyle = ink;
    roundRect(ctx, fx, fy, cell * 7, cell * 7, cell * 2.2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, fx + cell, fy + cell, cell * 5, cell * 5, cell * 1.5);
    ctx.fill();
    ctx.fillStyle = ink;
    roundRect(ctx, fx + cell * 2, fy + cell * 2, cell * 3, cell * 3, cell);
    ctx.fill();
  }
  // Logo in a white circle in the middle.
  const cx = x + size / 2;
  const cy = y + size / 2;
  const lr = (hole + 0.6) * cell;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, lr, 0, Math.PI * 2);
  ctx.fill();
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, lr * 0.86, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - lr * 0.86, cy - lr * 0.86, lr * 1.72, lr * 1.72);
    ctx.restore();
  }
}

/** The styled QR on a white rounded tile. */
function drawQr(ctx: CanvasRenderingContext2D, a: Assets, p: Palette, x: number, y: number, size: number) {
  const pad = size * 0.07;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, x, y, size, size, size * 0.1);
  ctx.fill();
  if (a.matrix) drawStyledQr(ctx, a.matrix, a.logo, p, x + pad, y + pad, size - pad * 2);
}


function centerText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number) {
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, y, maxW);
  ctx.textAlign = 'left';
}

/** Shrinks a font until the text fits, starting from `size` px. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxW: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > size * 0.5) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
}

// ── Formats ──────────────────────────────────────────────────────────────

function drawWallpaper(ctx: CanvasRenderingContext2D, person: PersonProfile, p: Palette, a: Assets, w: number, h: number) {
  drawAurora(ctx, w, h);
  // Lock screen: the clock covers about the top quarter and the flashlight and
  // camera buttons the bottom ~14%, so the card sits in between.
  const cardW = w * 0.84;
  const cardX = (w - cardW) / 2;
  const cardTop = h * 0.335;
  const D = w * 0.22;
  const qrSize = cardW * 0.76;
  const qrY = cardTop + D / 2 + w * 0.05;
  const handleY = qrY + qrSize + w * 0.1;
  const subY = handleY + w * 0.058;
  const cardH = subY + w * 0.065 - cardTop;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = w * 0.05;
  ctx.shadowOffsetY = w * 0.02;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, cardX, cardTop, cardW, cardH, w * 0.085);
  ctx.fill();
  ctx.restore();

  if (a.matrix) drawStyledQr(ctx, a.matrix, a.logo, p, (w - qrSize) / 2, qrY, qrSize);

  // Profile photo in a circle on top of the card, ringed in the role colour.
  const cx = w / 2;
  ctx.fillStyle = p.role;
  ctx.beginPath();
  ctx.arc(cx, cardTop, D / 2, 0, Math.PI * 2);
  ctx.fill();
  const inner = D / 2 - w * 0.012;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cardTop, inner, 0, Math.PI * 2);
  ctx.clip();
  if (a.avatar) drawCover(ctx, a.avatar, cx - inner, cardTop - inner, inner * 2, inner * 2);
  else {
    ctx.fillStyle = '#2A2E35';
    ctx.fillRect(cx - inner, cardTop - inner, inner * 2, inner * 2);
    ctx.fillStyle = p.role;
    ctx.font = `800 ${D * 0.36}px ${SANS}`;
    ctx.textBaseline = 'middle';
    centerText(ctx, initials(person.name), cx, cardTop + D * 0.02, D);
  }
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  const handle = person.xHandle ? `@${person.xHandle.replace(/^@/, '')}` : person.name;
  ctx.fillStyle = p.roleDeep;
  fitFont(ctx, handle.toUpperCase(), 800, w * 0.072, SANS, cardW * 0.86);
  centerText(ctx, handle.toUpperCase(), cx, handleY, cardW * 0.86);
  ctx.fillStyle = '#6B7079';
  ctx.font = `600 ${w * 0.028}px ${MONO}`;
  centerText(ctx, 'SCAN TO CONNECT · MUMBAI ONCHAIN', cx, subY, cardW * 0.86);
}


function drawPost(ctx: CanvasRenderingContext2D, person: PersonProfile, p: Palette, a: Assets, w: number, h: number) {
  drawAurora(ctx, w, h);
  const s = (h * 0.78) / 362;
  drawBadge(ctx, person, p, a, w * 0.08, (h - 362 * s) / 2, s);
  const tx = w * 0.08 + 272 * s + w * 0.07;
  const maxW = w - tx - w * 0.06;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${h * 0.034}px ${MONO}`;
  ctx.fillText('DEVCON 8 · IBW · ETHGLOBAL MUMBAI', tx, h * 0.2, maxW);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${h * 0.085}px ${SANS}`;
  ctx.fillText('See you at', tx, h * 0.31, maxW);
  ctx.fillText('Mumbai Onchain', tx, h * 0.405, maxW);
  const qrSize = h * 0.36;
  drawQr(ctx, a, p, tx, h * 0.48, qrSize);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${h * 0.03}px ${SANS}`;
  ctx.fillText('Scan to connect', tx + qrSize + h * 0.04, h * 0.48 + qrSize / 2, maxW - qrSize - h * 0.04);
}

function drawBadgeOnly(ctx: CanvasRenderingContext2D, person: PersonProfile, p: Palette, a: Assets, w: number, h: number) {
  drawAurora(ctx, w, h);
  const s = (w * 0.74) / 272;
  drawBadge(ctx, person, p, a, (w - 272 * s) / 2, h * 0.08, s);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 ${w * 0.03}px ${SANS}`;
  ctx.textBaseline = 'alphabetic';
  centerText(ctx, 'Mumbai Onchain · Nov 2026', w / 2, h * 0.08 + 362 * s + h * 0.06, w * 0.8);
}

// ── Community invite cards ───────────────────────────────────────────────
// For partner communities to post with their invite link: their logo, the
// QR to /app?c=<slug>, and the link written out for anyone who can't scan.

export type CommunityCardFormat = 'post' | 'story';

export const COMMUNITY_FORMATS: Record<CommunityCardFormat, { label: string; w: number; h: number; hint: string }> = {
  post: { label: 'Post', w: 1600, h: 900, hint: 'For X, Telegram and LinkedIn. Post it with the link.' },
  story: { label: 'Story', w: 1080, h: 1920, hint: 'For Instagram, WhatsApp status and Telegram stories.' },
};

// The app's saffron, deep enough on the white QR tile for any camera.
const COMMUNITY_PALETTE: Palette = { role: '#FF8A3D', roleDeep: '#C2410C', card: '#FFFFFF', cardInk: INK, cardMuted: '#5A616B', accent: '#C2410C' };

/** Their logo on a white rounded tile, or their first letter. */
function drawLogoTile(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, name: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, x, y, size, size, size * 0.22);
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.22);
  ctx.clip();
  if (logo) {
    // The whole logo inside the tile, like the app shows it: wide ones aren't cropped.
    const pad = size * 0.1;
    const box = size - pad * 2;
    const scale = Math.min(box / logo.width, box / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, x + (size - lw) / 2, y + (size - lh) / 2, lw, lh);
  }
  else {
    ctx.fillStyle = '#C2410C';
    ctx.font = `800 ${size * 0.5}px ${SANS}`;
    ctx.textBaseline = 'middle';
    centerText(ctx, initials(name).slice(0, 1) || '?', x + size / 2, y + size / 2 + size * 0.02, size);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

/** Wraps a name onto at most two lines that fit maxW. */
function twoLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines.length > 2 ? [lines[0], lines.slice(1).join(' ')] : lines;
}

interface CommunityCardInput {
  name: string;
  logoUrl: string;
  slug: string;
}

function drawCommunityPost(ctx: CanvasRenderingContext2D, c: CommunityCardInput, logo: HTMLImageElement | null, appLogo: HTMLImageElement | null, matrix: BitMatrix, w: number, h: number) {
  drawAurora(ctx, w, h);
  const pad = w * 0.07;
  const tile = h * 0.2;
  drawLogoTile(ctx, logo, c.name, pad, h * 0.13, tile);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${h * 0.03}px ${MONO}`;
  ctx.fillText('IBW · DEVCON 8 · ETHGLOBAL MUMBAI', pad, h * 0.47, w * 0.55);
  const qrSize = h * 0.62;
  const textW = w - pad * 2 - qrSize - w * 0.05;
  ctx.fillStyle = '#FFFFFF';
  fitFont(ctx, c.name, 800, h * 0.085, SANS, textW * 1.6);
  const lines = twoLines(ctx, c.name, textW);
  lines.forEach((l, i) => ctx.fillText(l, pad, h * 0.58 + i * h * 0.095, textW));
  const after = h * 0.58 + lines.length * h * 0.095;
  ctx.fillStyle = '#FF9A55';
  ctx.font = `800 ${h * 0.06}px ${SANS}`;
  ctx.fillText('× Mumbai Onchain', pad, after, textW);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 ${h * 0.032}px ${SANS}`;
  ctx.fillText('Join us in the app for the week', pad, after + h * 0.07, textW);

  const qx = w - pad - qrSize;
  const qy = (h - qrSize) / 2 - h * 0.03;
  drawQr(ctx, { logo: appLogo, avatar: null, matrix }, COMMUNITY_PALETTE, qx, qy, qrSize);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 ${h * 0.03}px ${MONO}`;
  centerText(ctx, `${window.location.host}/app?c=${c.slug}`, qx + qrSize / 2, qy + qrSize + h * 0.06, qrSize * 1.25);
}

function drawCommunityStory(ctx: CanvasRenderingContext2D, c: CommunityCardInput, logo: HTMLImageElement | null, appLogo: HTMLImageElement | null, matrix: BitMatrix, w: number, h: number) {
  drawAurora(ctx, w, h);
  const cx = w / 2;
  // Below the story's top bar, above its reply box.
  const tile = w * 0.26;
  drawLogoTile(ctx, logo, c.name, cx - tile / 2, h * 0.14, tile);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  fitFont(ctx, c.name, 800, w * 0.085, SANS, w * 1.4);
  const lines = twoLines(ctx, c.name, w * 0.84);
  lines.forEach((l, i) => centerText(ctx, l, cx, h * 0.355 + i * w * 0.095, w * 0.84));
  const after = h * 0.355 + lines.length * w * 0.095;
  ctx.fillStyle = '#FF9A55';
  ctx.font = `800 ${w * 0.06}px ${SANS}`;
  centerText(ctx, '× Mumbai Onchain', cx, after, w * 0.84);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 ${w * 0.03}px ${MONO}`;
  centerText(ctx, 'IBW · DEVCON 8 · ETHGLOBAL MUMBAI', cx, after + w * 0.075, w * 0.84);

  const qrSize = w * 0.56;
  const qy = after + w * 0.14;
  drawQr(ctx, { logo: appLogo, avatar: null, matrix }, COMMUNITY_PALETTE, cx - qrSize / 2, qy, qrSize);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${w * 0.045}px ${SANS}`;
  centerText(ctx, 'Scan to join us in the app', cx, qy + qrSize + w * 0.09, w * 0.84);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${w * 0.032}px ${MONO}`;
  centerText(ctx, `${window.location.host}/app?c=${c.slug}`, cx, qy + qrSize + w * 0.15, w * 0.9);
}

/** A partner community's invite card as a PNG file. */
export async function renderCommunityCard(c: CommunityCardInput, format: CommunityCardFormat): Promise<File> {
  const { w, h } = COMMUNITY_FORMATS[format];
  await Promise.all([document.fonts.load(`800 40px Manrope`), document.fonts.load(`600 20px "Red Hat Mono"`)]).catch(() => undefined);
  const matrix = QRCode.create(`${window.location.origin}/app?c=${encodeURIComponent(c.slug)}`, { errorCorrectionLevel: 'H' }).modules;
  const [appLogo, logo] = await Promise.all([loadImage('/icons/icon-192.png'), loadPhoto(c.logoUrl)]);
  const draw = (communityLogo: HTMLImageElement | null) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    if (format === 'post') drawCommunityPost(ctx, c, communityLogo, appLogo, matrix, w, h);
    else drawCommunityStory(ctx, c, communityLogo, appLogo, matrix, w, h);
    return canvas;
  };
  const toFile = (canvas: HTMLCanvasElement) =>
    new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Could not create the image'));
        resolve(new File([blob], `${c.slug}-mumbai-onchain-${format}.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  try {
    return await toFile(draw(logo));
  } catch {
    // A logo served without CORS taints the canvas; use their initial instead.
    return toFile(draw(null));
  }
}

/** Renders one format to a PNG file. */
export async function renderCard(person: PersonProfile, format: CardFormat): Promise<File> {
  const { w, h } = FORMATS[format];
  await Promise.all([document.fonts.load(`800 40px Manrope`), document.fonts.load(`600 20px "Red Hat Mono"`)]).catch(() => undefined);
  // The raw QR modules, drawn as rounded dots; H survives the logo in the middle.
  const matrix = QRCode.create(profileUrl(person.id), { errorCorrectionLevel: 'H' }).modules;
  const [logo, avatar] = await Promise.all([
    loadImage('/icons/icon-192.png'),
    // Photos from Storage need CORS to be drawn and exported; see loadPhoto.
    loadPhoto(person.avatar || ''),
  ]);

  const draw = (assets: Assets) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const p = palette(person);
    if (format === 'wallpaper') drawWallpaper(ctx, person, p, assets, w, h);
    else if (format === 'post') drawPost(ctx, person, p, assets, w, h);
    else drawBadgeOnly(ctx, person, p, assets, w, h);
    return canvas;
  };

  const toFile = (canvas: HTMLCanvasElement) =>
    new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Could not create the image'));
        const name = `mumbai-onchain-${format}-${person.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        resolve(new File([blob], name, { type: 'image/png' }));
      }, 'image/png');
    });

  try {
    return await toFile(draw({ logo, matrix, avatar }));
  } catch {
    // A photo served without CORS taints the canvas; fall back to initials.
    return toFile(draw({ logo, matrix, avatar: null }));
  }
}
