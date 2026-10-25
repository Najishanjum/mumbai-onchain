import { useEffect, useState } from 'react';

// Each community's own colour, from its logo, so its community mode looks
// like its own app. Remembered per community, so the second launch has it
// straight away. Logos without a clear colour (black and white wordmarks)
// get a hue from the name instead, so no two communities look the same.

const KEY = 'mo_accent_';

function nameHue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return [h, s, l];
}

/** The logo's main colourful hue and how saturated it is, or null when it has none (or can't be read). */
function logoHue(url: string): Promise<{ h: number; s: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const px = ctx.getImageData(0, 0, size, size).data;
        // Hue buckets weighted by how colourful each pixel is; greys, white and black don't count.
        const buckets = Array.from({ length: 24 }, () => ({ w: 0, s: 0, x: 0, y: 0 }));
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 160) continue;
          const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
          if (s < 0.3 || l < 0.12 || l > 0.92) continue;
          const b = buckets[Math.floor(h / 15) % 24];
          const w = s * (1 - Math.abs(l - 0.5));
          b.w += w;
          b.s += s * w;
          b.x += Math.cos((h * Math.PI) / 180) * w;
          b.y += Math.sin((h * Math.PI) / 180) * w;
        }
        const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
        if (best.w < 2) return resolve(null);
        resolve({ h: ((Math.atan2(best.y, best.x) * 180) / Math.PI + 360) % 360, s: best.s / best.w });
      } catch {
        resolve(null); // a logo from a site that doesn't allow reading it
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export interface Accent {
  hue: number;
  sat: number;
}

/** The community's colour: remembered, then read from the logo, else from its name. */
export function useCommunityAccent(id: string, name: string, logoUrl: string | undefined): Accent {
  const [accent, setAccent] = useState<Accent>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY + id) || 'null');
      if (saved && typeof saved.hue === 'number') return saved;
    } catch {
      // first launch of this community
    }
    return { hue: nameHue(name), sat: 0.7 };
  });
  useEffect(() => {
    if (!logoUrl) return;
    let live = true;
    void logoHue(logoUrl).then((found) => {
      if (!live || !found) return;
      const next = { hue: Math.round(found.h), sat: Math.min(0.9, Math.max(0.55, found.s)) };
      setAccent(next);
      try {
        localStorage.setItem(KEY + id, JSON.stringify(next));
      } catch {
        // fine: worked out again next time
      }
    });
    return () => {
      live = false;
    };
  }, [id, logoUrl]);
  return accent;
}

/**
 * CSS variables that re-colour everything inside community mode: buttons,
 * tabs, titles and the background glow. Lighter on dark, deeper on light, so
 * text on it stays readable.
 */
export function accentVars(a: Accent, light: boolean): Record<string, string> {
  const s = Math.round(a.sat * 100);
  const main = `hsl(${a.hue} ${s}% ${light ? 40 : 62}%)`;
  const deep = `hsl(${(a.hue + 25) % 360} ${s}% ${light ? 30 : 48}%)`;
  return {
    '--c-accent': main,
    '--c-accent-2': deep,
    '--app-primary': main,
    // Yellows and greens are light even at 40%: dark text on them, white on the rest.
    '--app-on-primary': !light || (a.hue > 40 && a.hue < 190) ? '#0B0B0F' : '#FFFFFF',
    '--app-primary-soft': `hsl(${a.hue} ${s}% ${light ? 40 : 62}% / 0.16)`,
    '--app-glow': `radial-gradient(120% 60% at 85% -10%, hsl(${a.hue} ${s}% 50% / ${light ? 0.18 : 0.32}), transparent 60%), radial-gradient(90% 50% at 0% 0%, hsl(${(a.hue + 40) % 360} ${s}% 50% / ${light ? 0.1 : 0.18}), transparent 60%)`,
  };
}
