import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ShieldCheck } from 'lucide-react';
import type { AdminRole } from '../lib/useAdmin';
import { usePeopleStore } from '../lib/usePeopleStore';
import type { Community } from '../lib/useCommunities';
import { PersonAvatar } from '../components/PersonAvatar';
import { CommunityLogo } from './CommunitySheet';

/** Where the switcher can take you: the app, admin mode, or a community you lead. */
export type ModeTarget = { kind: 'app' } | { kind: 'admin' } | { kind: 'community'; id: string };

/**
 * The badge top right in admin and community mode (ADMIN ⌄, LEAD ⌄): switch
 * between you (the app), admin mode and the communities you lead.
 */
export function ModeMenu({
  current,
  adminRole,
  led,
  onPick,
}: {
  current: Exclude<ModeTarget, { kind: 'app' }>;
  adminRole: AdminRole | null;
  /** Communities this account leads. */
  led: Community[];
  onPick: (target: ModeTarget) => void;
}) {
  const { myProfile } = usePeopleStore();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const roleName = adminRole === 'owner' ? 'Owner' : 'Admin';
  const badge = current.kind === 'admin' ? roleName : 'Lead';
  const pick = (t: ModeTarget) => {
    setOpen(false);
    const same = t.kind === current.kind && (t.kind !== 'community' || (current.kind === 'community' && t.id === current.id));
    if (!same) onPick(t);
  };
  const row = 'app-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:bg-[var(--app-pressed)]';
  const tick = <Check className="w-5 h-5 text-[var(--app-primary)] shrink-0" aria-hidden="true" />;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${badge} mode. Switch mode`}
        className="app-press h-9 pl-3.5 pr-2.5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[12px] font-extrabold tracking-[0.14em] inline-flex items-center gap-1"
      >
        {badge.toUpperCase()}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-72 max-h-[70dvh] overflow-y-auto p-1.5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] shadow-[0_16px_40px_rgba(0,0,0,0.35)] z-20">
          <p className="px-3 pt-1.5 pb-1 text-[12px] font-bold text-[var(--app-muted)]">Switch to</p>
          <button type="button" role="menuitem" className={row} onClick={() => pick({ kind: 'app' })}>
            <PersonAvatar name={myProfile?.name ?? 'You'} avatarUrl={myProfile?.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold truncate">{myProfile?.name ?? 'You'}</span>
              <span className="block text-[13px] text-[var(--app-muted)]">The app</span>
            </span>
          </button>
          {adminRole && (
            <button type="button" role="menuitemradio" aria-checked={current.kind === 'admin'} className={row} onClick={() => pick({ kind: 'admin' })}>
              <span className="w-9 h-9 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold">{roleName}</span>
                <span className="block text-[13px] text-[var(--app-muted)]">Review and manage</span>
              </span>
              {current.kind === 'admin' && tick}
            </button>
          )}
          {led.map((c) => {
            const here = current.kind === 'community' && current.id === c.id;
            return (
              <button key={c.id} type="button" role="menuitemradio" aria-checked={here} className={row} onClick={() => pick({ kind: 'community', id: c.id })}>
                <CommunityLogo c={c} size={36} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{c.community_name}</span>
                  <span className="block text-[13px] text-[var(--app-muted)]">Lead</span>
                </span>
                {here && tick}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
