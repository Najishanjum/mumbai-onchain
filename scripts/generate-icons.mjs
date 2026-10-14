// Generates every PWA icon from the master logo in brand/.
// Run after changing the logo: `npm run icons`
import sharp from 'sharp';
import { copyFile, mkdir } from 'node:fs/promises';

const SRC = 'brand/mumbai-onchain-logo.png';
// The master is 1254px square: emblem on top, "Mumbai Onchain" wordmark below.
// At home-screen sizes the wordmark is unreadable, so icons use the emblem only.
const WORDMARK_TOP = 770;
// The dot of the "i" in "Mumbai" rises to the emblem's baseline, right of x=960.
const EMBLEM_RIGHT = 960;
const BG = '#FFFFFF'; // iOS fills transparent icon pixels with black, so icons get a solid background

const meta = await sharp(SRC).metadata();
// Two pipelines on purpose: within one, sharp runs trim before extract.
const top = await sharp(SRC)
  .extract({ left: 0, top: 0, width: Math.min(EMBLEM_RIGHT, meta.width), height: WORDMARK_TOP })
  .toBuffer();
const emblem = await sharp(top).trim().toBuffer();

async function icon(file, size, padding, background) {
  const inner = Math.round(size * (1 - padding * 2));
  const art = await sharp(emblem)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${file}`);
}

await mkdir('public/icons', { recursive: true });
await mkdir('public/brand', { recursive: true });

const clear = { r: 0, g: 0, b: 0, alpha: 0 };
await icon('favicon-64.png', 64, 0.02, clear);
await icon('icon-192.png', 192, 0.08, BG);
// Chrome only offers install with a plain (purpose "any") 512 icon, not just a maskable one.
await icon('icon-512.png', 512, 0.08, BG);
// Maskable: launchers crop to a circle of 80% diameter, so keep the emblem well inside it.
await icon('icon-maskable-512.png', 512, 0.15, BG);
await icon('apple-touch-icon-180.png', 180, 0.1, BG);
// iOS also probes these fixed root paths. Without real files there, the SPA
// fallback answers with index.html (HTTP 200), and iOS can end up showing a
// letter tile instead of the icon.
await copyFile('public/icons/apple-touch-icon-180.png', 'public/apple-touch-icon.png');
await copyFile('public/icons/apple-touch-icon-180.png', 'public/apple-touch-icon-precomposed.png');

// Full logo with wordmark, for the install sheet and splash.
await sharp(SRC).resize(480, 480).webp({ quality: 88 }).toFile('public/brand/logo.webp');

console.log('Icons written to public/icons and public/brand');
