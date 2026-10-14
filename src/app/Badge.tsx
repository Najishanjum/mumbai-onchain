import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import type { PersonCategory, PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { profileUrl } from './qr';

/** Band colour for a role, as printed on real event badges. */
export function roleColor(category: PersonCategory | string | undefined): string {
  const key = (category || 'other').toLowerCase();
  const known = ['builder', 'founder', 'student', 'volunteer', 'attendee'];
  return `var(--role-${known.includes(key) ? key : 'other'})`;
}

/** The person's pass QR as a data URL (high error correction for dim screens). */
export function usePassQr(personId: string, width = 560): string {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(profileUrl(personId), {
      width,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#121419', light: '#FFFFFF' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [personId, width]);
  return qr;
}

// ── Badge pattern ────────────────────────────────────────────────────────
// Shapes from the Mumbai Onchain logo, which stands for the whole week rather
// than any one event: the petals and flame, the Gateway arch, the sea, the
// Ethereum diamond and the three pixel squares.
const SHAPES = {
  petal: 'M20 2C31 12 34 25 20 38C6 25 9 12 20 2Z',
  flame: 'M20 2C27 12 33 20 33 27A13 13 0 0 1 7 27C7 20 13 12 20 2Z',
  arch: 'M3 39V19A17 17 0 0 1 37 19V39H28V21A8 8 0 0 0 12 21V39Z',
  quarter: 'M1 1H39A38 38 0 0 1 1 39Z',
  circle: 'M20 3A17 17 0 1 1 19.99 3Z',
  diamond: 'M20 2L33 20L20 27L7 20ZM20 30L33 23L20 38L7 23Z',
  sea: 'M1 14C8 8 13 8 20 14S32 20 39 14V22C32 28 27 28 20 22S8 16 1 22ZM1 30C8 24 13 24 20 30S32 36 39 30V39H1Z',
} as const;
type ShapeName = keyof typeof SHAPES | 'pixels';
const SHAPE_NAMES: ShapeName[] = ['petal', 'flame', 'arch', 'quarter', 'circle', 'diamond', 'sea', 'petal', 'quarter', 'arch'];
const TILE_STYLES = [
  { opacity: 1, outline: false },
  { opacity: 0.55, outline: false },
  { opacity: 0.25, outline: false },
  { opacity: 0, outline: true },
];

/** Small seeded random generator, so a person's pattern never changes. */
function seeded(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

interface Tile {
  shape: ShapeName;
  rotate: number;
  opacity: number;
  outline: boolean;
}

/** 4×3 tiles, different for every person, with the logo's pixels in one of them. */
function makePattern(seedText: string): Tile[] {
  const rnd = seeded(seedText);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const tiles: Tile[] = Array.from({ length: 12 }, () => {
    const style = pick(TILE_STYLES);
    return { shape: pick(SHAPE_NAMES), rotate: pick([0, 90, 180, 270]), opacity: style.opacity, outline: style.outline };
  });
  tiles[Math.floor(rnd() * 12)] = { shape: 'pixels', rotate: 0, opacity: 1, outline: false };
  return tiles;
}

function PatternTile({ tile, color }: { tile: Tile; color: string }) {
  if (tile.shape === 'pixels') {
    // The three squares beside the logo, in the logo's own colours.
    return (
      <svg viewBox="0 0 40 40" className="w-full aspect-square block" aria-hidden="true">
        <rect x="22" y="6" width="9" height="9" fill="#A875FF" />
        <rect x="9" y="16" width="9" height="9" fill="#FF7A1F" />
        <rect x="22" y="26" width="9" height="9" fill="#FFC93A" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="w-full aspect-square block" aria-hidden="true">
      <path
        d={SHAPES[tile.shape]}
        transform={`rotate(${tile.rotate} 20 20)`}
        fill={tile.outline ? 'none' : color}
        fillOpacity={tile.opacity}
        stroke={tile.outline ? color : 'none'}
        strokeWidth={tile.outline ? 2 : 0}
      />
    </svg>
  );
}

// The badge is a physical card, so it keeps its own dark colours in either theme.
const CARD = '#121419';
const CARD_MUTED = '#A6ADB7';

const SIZES = {
  md: { w: 240, h: 344, avatar: 'w-[76px]! h-[76px]!', name: 'text-[24px]', qr: 180, strap: 120 },
  lg: { w: 272, h: 390, avatar: 'w-[88px]! h-[88px]!', name: 'text-[28px]', qr: 210, strap: 150 },
} as const;

/** Event lanyard: one strap in the role colour, one black, joined by a buckle and a clasp. */
export function Lanyard({ color, height = 120 }: { color: string; height?: number }) {
  const strap = 'absolute bottom-0 w-[30px] origin-bottom overflow-hidden flex justify-center';
  const text = '[writing-mode:vertical-rl] whitespace-nowrap text-[12px] font-extrabold leading-[30px]';
  const words = 'Mumbai Onchain  ◆  '.repeat(4);
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div className="relative w-[200px]" style={{ height: height - 8 }}>
        <div
          className={strap}
          style={{
            height,
            left: 'calc(50% - 29px)',
            transform: 'rotate(-15deg)',
            background: `linear-gradient(180deg, color-mix(in srgb, ${color} 55%, ${CARD}), ${color})`,
          }}
        >
          <span className={text} style={{ color: CARD }}>{words}</span>
        </div>
        <div
          className={`${strap} border border-white/10`}
          style={{ height, left: 'calc(50% - 1px)', transform: 'rotate(15deg)', background: CARD }}
        >
          <span className={text} style={{ color }}>{words}</span>
        </div>
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-7 w-14 h-6 rounded-md border-2"
          style={{ background: color, borderColor: CARD }}
        />
      </div>
      <svg width="28" height="44" viewBox="0 0 28 44" className="-mt-1 text-[var(--app-clip)]">
        <rect x="5" y="0" width="18" height="10" rx="3" fill="currentColor" />
        <circle cx="14" cy="17" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M14 22v4" stroke="currentColor" strokeWidth="3" />
        <path d="M9 26h10a2 2 0 0 1 2 2v6a7 7 0 0 1-14 0v-6a2 2 0 0 1 2-2z" fill="currentColor" />
        <path d="M14 40v4" stroke="currentColor" strokeWidth="3" />
      </svg>
    </div>
  );
}

/**
 * The attendee badge hanging from a lanyard. Tap it to spin it round on the
 * strap: the front is who you are, the back is the QR people scan to add you.
 */
export function LanyardBadge({
  person,
  size = 'md',
  flipped: flippedProp,
  onFlip,
}: {
  person: PersonProfile;
  size?: keyof typeof SIZES;
  /** Controlled from outside (e.g. the pass sheet opens on the QR); otherwise the badge keeps its own state. */
  flipped?: boolean;
  onFlip?: (next: boolean) => void;
}) {
  const [own, setOwn] = useState(false);
  const flipped = flippedProp ?? own;
  const s = SIZES[size];
  const qr = usePassQr(person.id);
  const color = roleColor(person.category);
  const pattern = useMemo(() => makePattern(person.id), [person.id]);
  const handle = person.xHandle ? `@${person.xHandle.replace(/^@/, '')}` : '';
  const tile = s.w / 4;

  const toggle = () => {
    const next = !flipped;
    if (flippedProp === undefined) setOwn(next);
    onFlip?.(next);
  };

  return (
    <div className="flex flex-col items-center">
      <Lanyard color={color} height={s.strap} />

      <div className="badge-stage" style={{ width: s.w, height: s.h }}>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={flipped}
          aria-label={flipped ? 'Show the front of your badge' : 'Show your QR code'}
          className={`badge-card block w-full h-full p-0 border-0 bg-transparent text-[#F2F3F5] ${flipped ? 'is-flipped' : ''}`}
        >
          <div className="badge-face rounded-[18px] overflow-hidden flex flex-col text-left" style={{ background: CARD }}>
            <div className="relative grid grid-cols-4" style={{ height: tile * 3 }}>
              {pattern.map((t, i) => (
                <PatternTile key={i} tile={t} color={color} />
              ))}
              <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-11 h-2 rounded-full" style={{ background: CARD }} aria-hidden="true" />
              <span className="absolute left-2.5 top-6 h-8 pl-1 pr-3 rounded-full flex items-center gap-1.5" style={{ background: CARD }}>
                <img src="/icons/icon-192.png" alt="" className="w-6 h-6 rounded-full" />
                <span className="text-[11px] font-extrabold">Mumbai Onchain</span>
              </span>
            </div>
            <PersonAvatar
              name={person.name}
              avatarUrl={person.avatar}
              size="xl"
              className={`-mt-14 ml-4 rounded-2xl! border-4! border-[#121419]! ${s.avatar}`}
            />
            <div className="flex-1 px-4 pt-2.5 pb-4 flex flex-col justify-between min-h-0">
              <div className="min-w-0">
                <div className={`app-title leading-tight truncate ${s.name}`}>{person.name}</div>
                <div className="app-mono mt-0.5 text-[11px] font-semibold tracking-[0.06em]" style={{ color }}>
                  {(person.category || 'Attendee').toUpperCase()}
                  {person.city ? ` · ${person.city.toUpperCase()}` : ''}
                </div>
              </div>
              <div className="app-mono flex justify-between text-[10px]" style={{ color: CARD_MUTED }}>
                <span className="truncate">{handle}</span>
                <span className="shrink-0">ONCHAIN WEEK 2026</span>
              </div>
            </div>
          </div>

          <div
            className="badge-face is-back rounded-[18px] flex flex-col items-center justify-center gap-3"
            style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 45%, ${CARD}))`, color: CARD }}
          >
            {qr ? (
              <img src={qr} alt={`QR code for ${person.name}'s profile`} className="rounded-2xl bg-white p-2" style={{ width: s.qr, height: s.qr }} />
            ) : (
              <span className="rounded-2xl bg-white/70" style={{ width: s.qr, height: s.qr }} />
            )}
            <span className="text-[16px] font-extrabold">Scan to connect</span>
            <span className="app-mono text-[11px] font-semibold">MUMBAI ONCHAIN WEEK</span>
          </div>
        </button>
      </div>
    </div>
  );
}

/** Empty badge on the lanyard, for people who haven't made a profile yet. */
export function BlankBadge({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <Lanyard color="var(--app-primary)" height={150} />
      <button
        type="button"
        onClick={onCreate}
        className="app-press w-[272px] h-[340px] rounded-[18px] border-2 border-dashed border-[var(--app-faint)] bg-[var(--app-surface)] flex flex-col items-center justify-center gap-2 px-7 text-center"
      >
        <img src="/icons/icon-192.png" alt="" className="w-12 h-12 rounded-full" />
        <span className="app-title mt-1 text-[24px] leading-tight">Make your badge</span>
        <span className="text-[15px] text-[var(--app-muted)]">Your name, role and a QR people scan to add you.</span>
        <span className="mt-3 h-11 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-bold inline-flex items-center">
          Create profile
        </span>
      </button>
    </div>
  );
}
