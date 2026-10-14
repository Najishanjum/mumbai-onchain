import { useEffect, useState } from 'react';
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
      color: { dark: '#0D1316', light: '#FFFFFF' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [personId, width]);
  return qr;
}

const SIZES = {
  md: { w: 224, h: 316, avatar: 'w-[84px]! h-[84px]!', name: 'text-[24px]', qr: 172 },
  lg: { w: 264, h: 372, avatar: 'w-[100px]! h-[100px]!', name: 'text-[28px]', qr: 216 },
} as const;

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
  /** Controlled from outside (e.g. "Show QR" buttons); otherwise the badge keeps its own state. */
  flipped?: boolean;
  onFlip?: (next: boolean) => void;
}) {
  const [own, setOwn] = useState(false);
  const flipped = flippedProp ?? own;
  const s = SIZES[size];
  const qr = usePassQr(person.id);
  const handle = person.xHandle ? `@${person.xHandle.replace(/^@/, '')}` : person.city;

  const toggle = () => {
    const next = !flipped;
    if (flippedProp === undefined) setOwn(next);
    onFlip?.(next);
  };

  return (
    <div className="flex flex-col items-center">
      <Lanyard />

      <div className="badge-stage" style={{ width: s.w, height: s.h }}>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={flipped}
          aria-label={flipped ? 'Show the front of your badge' : 'Show your QR code'}
          className={`badge-card block w-full h-full p-0 border-0 bg-transparent text-[var(--app-badge-ink)] ${flipped ? 'is-flipped' : ''}`}
        >
          <div className="badge-face rounded-[18px] bg-[var(--app-badge)] border border-black/5 overflow-hidden flex flex-col items-center text-center">
            <span className="w-11 h-2 rounded-full bg-[var(--app-badge-ink)] mt-3" aria-hidden="true" />
            <BadgeHeader />
            <PersonAvatar
              name={person.name}
              avatarUrl={person.avatar}
              size="xl"
              className={`mt-3 rounded-full! border-0! ${s.avatar}`}
            />
            <span className={`app-title mt-3 px-4 leading-tight line-clamp-2 ${s.name}`}>{person.name}</span>
            {handle && <span className="mt-0.5 px-4 text-[14px] text-[var(--app-badge-muted)] truncate max-w-full">{handle}</span>}
            <span
              className="mt-auto w-full h-12 flex items-center justify-center text-[17px] font-extrabold tracking-[0.14em] text-[var(--app-badge-ink)]"
              style={{ background: roleColor(person.category) }}
            >
              {(person.category || 'Attendee').toUpperCase()}
            </span>
          </div>

          <div className="badge-face is-back rounded-[18px] bg-[var(--app-badge)] border border-black/5 flex flex-col items-center justify-center gap-3">
            <span className="absolute top-3 w-11 h-2 rounded-full bg-[var(--app-badge-ink)]" aria-hidden="true" />
            {qr ? (
              <img
                src={qr}
                alt={`QR code for ${person.name}'s profile`}
                className="rounded-xl bg-white p-1.5"
                style={{ width: s.qr, height: s.qr }}
              />
            ) : (
              <span className="rounded-xl bg-[var(--app-pressed)]" style={{ width: s.qr, height: s.qr }} />
            )}
            <span className="text-[15px] font-bold">Scan to connect</span>
            <span className="app-mono text-[11px] text-[var(--app-badge-muted)]">Tap to turn back</span>
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
      <Lanyard />
      <button
        type="button"
        onClick={onCreate}
        className="app-press w-[224px] h-[260px] rounded-[18px] border-2 border-dashed border-[var(--app-faint)] bg-[var(--app-surface)] flex flex-col items-center justify-center gap-2 px-6 text-center"
      >
        <span className="app-mono text-[10px] font-semibold tracking-[0.12em] text-[var(--app-muted)]">MUMBAI ONCHAIN WEEK</span>
        <span className="app-title text-[22px] leading-tight">Make your badge</span>
        <span className="text-[14px] text-[var(--app-muted)]">Your name, role and a QR people scan to add you.</span>
        <span className="mt-2 h-11 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-bold inline-flex items-center">
          Create profile
        </span>
      </button>
    </div>
  );
}

const STRAP_TEXT = 'MUMBAI ONCHAIN WEEK · '.repeat(4);

/** One side of the lanyard: role-coloured webbing printed with the event name. */
function Strap({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="absolute bottom-0 w-[26px] h-[124px] origin-bottom overflow-hidden bg-[var(--app-primary)] border-x border-black/15 flex justify-center"
      style={{
        left: side === 'left' ? 'calc(50% - 25px)' : 'calc(50% - 1px)',
        transform: `rotate(${side === 'left' ? -15 : 15}deg)`,
      }}
    >
      <span className="app-mono [writing-mode:vertical-rl] whitespace-nowrap text-[9px] font-semibold tracking-[0.18em] leading-[26px] text-[var(--app-on-primary)]">
        {STRAP_TEXT}
      </span>
    </div>
  );
}

/** The branded lanyard: two printed straps, a crimp and a swivel clasp. */
export function Lanyard() {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div className="relative w-[180px] h-[112px]">
        <Strap side="left" />
        <Strap side="right" />
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

/** Event branding at the top of the badge, under the slot. */
function BadgeHeader() {
  return (
    <div className="w-full mt-2.5 px-4 pb-3 flex items-center gap-2.5 border-b border-dashed border-black/10">
      <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-full shrink-0" />
      <span className="flex flex-col items-start leading-tight text-left">
        <span className="text-[14px] font-extrabold tracking-[0.02em]">MUMBAI ONCHAIN</span>
        <span className="app-mono text-[10px] text-[var(--app-badge-muted)]">WEEK 2026 · 31 OCT – 7 NOV</span>
      </span>
    </div>
  );
}
