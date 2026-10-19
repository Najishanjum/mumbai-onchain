import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { roleColor } from '../Badge';

// The moment of switching between the app and admin mode: your badge flips
// from your role to an ADMIN badge (or back), while the other side loads.

export const ADMIN_AMBER = '#F2B648';
const DURATION = 1700;
const REDUCED = 600;

export function AdminSwitch({
  direction,
  name,
  category,
  onDone,
}: {
  direction: 'in' | 'out';
  name: string;
  category: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(onDone, reduced ? REDUCED : DURATION);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const roleFace = (
    <div className="admin-switch-face" style={{ background: roleColor(category) }}>
      <span className="admin-switch-hole" aria-hidden="true" />
      <span className="text-[13px] font-extrabold tracking-[0.14em] text-[#0D1316]">{category.toUpperCase()}</span>
      <span className="mt-1 text-[17px] font-extrabold text-[#0D1316] px-3 text-center leading-tight line-clamp-2">{name}</span>
    </div>
  );
  const adminFace = (
    <div className="admin-switch-face admin-switch-back">
      <span className="admin-switch-hole" aria-hidden="true" />
      <ShieldCheck className="w-9 h-9 text-[#1A1408]" strokeWidth={2.2} aria-hidden="true" />
      <span className="mt-2 text-[15px] font-extrabold tracking-[0.2em] text-[#1A1408]">ADMIN</span>
      <span className="mt-1 text-[14px] font-bold text-[#1A1408]/75 px-3 text-center leading-tight line-clamp-2">{name}</span>
    </div>
  );

  return (
    <div className="app fixed inset-0 z-[90] flex flex-col items-center justify-center gap-8 bg-[var(--app-bg)] admin-switch-in" role="status" aria-live="polite">
      <div className={`admin-switch-card ${direction === 'in' ? 'is-to-admin' : 'is-to-app'}`}>
        <div className="admin-switch-side">{direction === 'in' ? roleFace : adminFace}</div>
        <div className="admin-switch-side admin-switch-flip">{direction === 'in' ? adminFace : roleFace}</div>
      </div>
      <div className="w-56 text-center">
        <p className="text-[18px] font-extrabold">{direction === 'in' ? 'Switching to admin…' : 'Back to the app…'}</p>
        <div className="mt-3 h-1.5 rounded-full bg-[var(--app-pressed)] overflow-hidden" aria-hidden="true">
          <div className="admin-switch-progress h-full rounded-full" style={{ background: direction === 'in' ? ADMIN_AMBER : roleColor(category) }} />
        </div>
      </div>
    </div>
  );
}
