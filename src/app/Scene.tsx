// An ornate line-art mandala in the style of the Devcon 8 posters and
// classic Indian mandala prints: rings of lotus petals with fan hatching,
// arches, scallops, beads and "eyes". Built once as a handful of paths (one
// per ring) so it stays cheap to rotate on a phone.

type Map = (x: number, y: number) => string;
const RAD = Math.PI / 180;
const n = (v: number) => +v.toFixed(1);

/** Maps local shape coordinates (y up = outward) to a spot on a ring. */
function at(angle: number, r: number): Map {
  const c = Math.cos(angle * RAD);
  const s = Math.sin(angle * RAD);
  return (x, y) => {
    const yy = y - r;
    return `${n(x * c - yy * s)} ${n(x * s + yy * c)}`;
  };
}

function ring(count: number, r: number, draw: (m: Map) => string, offset = 0): string {
  let d = '';
  for (let i = 0; i < count; i++) d += draw(at((i * 360) / count + offset, r));
  return d;
}

/** A pointed lotus petal of half-width w and height h, starting y0 out from the ring. */
const petal = (w: number, h: number, y0 = 0) => (m: Map) =>
  `M${m(0, -y0)}C${m(w, -y0 - h * 0.25)} ${m(w * 0.9, -y0 - h * 0.62)} ${m(0, -y0 - h)}` +
  `C${m(-w * 0.9, -y0 - h * 0.62)} ${m(-w, -y0 - h * 0.25)} ${m(0, -y0)}Z`;

const dot = (x: number, y: number, r: number) => (m: Map) => {
  const [cx, cy] = m(x, y).split(' ').map(Number);
  return `M${n(cx - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
};

const seg = (x1: number, y1: number, x2: number, y2: number) => (m: Map) => `M${m(x1, y1)}L${m(x2, y2)}`;

/** Fan of hatch lines inside a petal, from near its base towards its edge. */
const fan = (w: number, h: number, y0 = 0, lines = 5) => (m: Map) => {
  let d = '';
  const half = (lines - 1) / 2;
  for (let k = -half; k <= half; k++) {
    const f = k / (half + 1);
    d += seg(0, -y0 - h * 0.12, f * w * 0.75, -y0 - h * (0.72 - Math.abs(f) * 0.25))(m);
  }
  return d;
};

const arch = (w: number, h: number) => (m: Map) =>
  `M${m(-w, 0)}L${m(-w, -h * 0.5)}Q${m(-w, -h)} ${m(0, -h)}Q${m(w, -h)} ${m(w, -h * 0.5)}L${m(w, 0)}`;

/** A small circle with a hatched ring around it, centred y out from the ring. */
const eye = (y: number, r: number) => (m: Map) => {
  let d = dot(0, y, r)(m) + dot(0, y, r * 0.6)(m) + dot(0, y, r * 0.22)(m);
  for (let k = 0; k < 12; k++) {
    const a = k * 30 * RAD;
    d += seg(Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, Math.cos(a) * r, y + Math.sin(a) * r)(m);
  }
  return d;
};

const join = (...parts: ((m: Map) => string)[]) => (m: Map) => parts.map((p) => p(m)).join('');

// [path, stroke width] per ring, inside out.
export const RINGS: [string, number][] = [
  [ring(16, 10, petal(6, 28)) + ring(8, 0, petal(4, 12), 22.5), 1.4],
  [ring(36, 50, dot(0, 0, 2.2)), 1.2],
  [ring(16, 56, join(petal(16, 64), petal(8, 44, 6), seg(0, -8, 0, -50))), 1.4],
  [ring(96, 128, seg(0, 0, 0, -18)), 1],
  [ring(12, 152, join(petal(40, 108), petal(28, 86, 8), petal(7, 24, 12), fan(28, 86, 8))), 1.5],
  [ring(12, 152, join(petal(20, 64), petal(10, 42, 6)), 15), 1.3],
  [ring(72, 272, (m) => `M${m(-11.9, 0)}Q${m(0, -14)} ${m(11.9, 0)}`), 1.2],
  [ring(24, 290, join(arch(36, 66), arch(28, 54), arch(20, 42), seg(0, -66, 0, -72), dot(0, -76, 3), seg(-10, 0, -10, -22), seg(0, 0, 0, -28), seg(10, 0, 10, -22))), 1.3],
  [ring(60, 370, dot(0, 0, 2.6)), 1.1],
  [ring(12, 386, join(petal(78, 112), petal(62, 96, 6), petal(44, 78, 12), eye(-48, 17), dot(0, -122, 4))), 1.6],
  [ring(12, 386, join(petal(30, 104, 10), petal(18, 80, 18), fan(18, 80, 18, 5), dot(0, -122, 3)), 15), 1.3],
  [ring(48, 266, petal(8, 22), 3.75), 1.1],
];
export const CIRCLES = [8, 44, 120, 124, 148, 266, 272, 362, 376, 382];

function Mandala() {
  return (
    <svg viewBox="-500 -500 1000 1000" className="app-scene-mandala" fill="none" stroke="url(#scene-mandala-ink)" strokeLinecap="round">
      <defs>
        <linearGradient id="scene-mandala-ink" x1="-500" y1="-500" x2="500" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--mandala-1)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--mandala-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--mandala-3)' }} />
        </linearGradient>
      </defs>
      {CIRCLES.map((r) => (
        <circle key={r} r={r} strokeWidth={r % 2 ? 1 : 1.4} />
      ))}
      <circle r="496" strokeWidth="1.4" strokeDasharray="2 9" />
      {RINGS.map(([d, w], i) => (
        <path key={i} d={d} strokeWidth={w} />
      ))}
    </svg>
  );
}

/**
 * The Aurora behind every screen (Appearance → Background): soft saffron,
 * pink and mint glows drifting at the top, fading into black, with the
 * mandala turning slowly off the top-right edge (styles in index.css).
 * Fixed, behind everything, never takes taps; CSS hides it on Plain.
 */
export function Scene() {
  return (
    <div className="app-scene" aria-hidden="true">
      <span className="aurora-blob is-a" />
      <span className="aurora-blob is-b" />
      <span className="aurora-blob is-c" />
      <div className="app-scene-mandala-fade">
        <Mandala />
      </div>
    </div>
  );
}
