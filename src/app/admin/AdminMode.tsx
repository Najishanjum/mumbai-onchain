import { useEffect, useRef, useState } from 'react';
import { BarChart3, Bell, CalendarDays, Check, ChevronDown, Handshake, Images, MapPin, ShieldCheck, Users } from 'lucide-react';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { PersonAvatar } from '../../components/PersonAvatar';
import { AdminEvents } from './AdminEvents';
import type { AdminRole } from '../../lib/useAdmin';
import { useOverview } from './shared';
import { AdminOverview } from './AdminOverview';
import { AdminPlaces } from './AdminPlaces';
import { AdminPartners } from './AdminPartners';
import { AdminStories } from './AdminStories';
import { AdminNotify } from './AdminNotify';
import { AdminTeam } from './AdminTeam';

export const ADMIN_TABS = ['overview', 'events', 'places', 'partners', 'stories', 'notify', 'team'] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

const TABS: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'partners', label: 'Partners', icon: Handshake },
  { id: 'stories', label: 'Stories', icon: Images },
  { id: 'notify', label: 'Notify', icon: Bell },
  { id: 'team', label: 'Team', icon: Users },
];

/** The ADMIN / OWNER badge: opens a switcher between you (the app) and admin mode. */
function ModeMenu({ role, onExit }: { role: AdminRole; onExit: () => void }) {
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
  const roleName = role === 'owner' ? 'Owner' : 'Admin';
  const row = 'app-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:bg-[var(--app-pressed)]';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${roleName} mode. Switch mode`}
        className="app-press h-9 pl-3.5 pr-2.5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[12px] font-extrabold tracking-[0.14em] inline-flex items-center gap-1"
      >
        {roleName.toUpperCase()}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <p className="px-3 pt-1.5 pb-1 text-[12px] font-bold text-[var(--app-muted)]">Switch to</p>
          <button
            type="button"
            role="menuitem"
            className={row}
            onClick={() => {
              setOpen(false);
              onExit();
            }}
          >
            <PersonAvatar name={myProfile?.name ?? 'You'} avatarUrl={myProfile?.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold truncate">{myProfile?.name ?? 'You'}</span>
              <span className="block text-[13px] text-[var(--app-muted)]">The app</span>
            </span>
          </button>
          <button type="button" role="menuitemradio" aria-checked="true" className={row} onClick={() => setOpen(false)}>
            <span className="w-9 h-9 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px]" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold">{roleName}</span>
              <span className="block text-[13px] text-[var(--app-muted)]">Review and manage</span>
            </span>
            <Check className="w-5 h-5 text-[var(--app-primary)]" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Admin mode: its own screens and tab bar, over the app. */
export default function AdminMode({ role, initialTab = 'overview', onExit }: { role: AdminRole; initialTab?: AdminTab; onExit: () => void }) {
  // Team is the owner's: only they can change it.
  const tabs = role === 'owner' ? TABS : TABS.filter((t) => t.id !== 'team');
  const [tab, setTab] = useState<AdminTab>(tabs.some((t) => t.id === initialTab) ? initialTab : 'overview');
  const overview = useOverview();
  const scroller = useRef<HTMLDivElement>(null);
  const waiting: Partial<Record<AdminTab, number>> = { places: overview.data?.places_pending ?? 0, partners: overview.data?.partners_pending ?? 0 };

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab]);

  // The page behind doesn't scroll while admin mode is up.
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  return (
    <div className="app fixed inset-0 z-[58] flex flex-col bg-[var(--app-bg)] [background-image:var(--app-glow)] bg-no-repeat">
      {/* No back button top left: people tap it expecting "back", not "leave
          admin". Leaving is in the mode menu on the badge, top right. */}
      <header className="relative z-10 shrink-0 pt-[calc(env(safe-area-inset-top)+6px)] px-4 pb-2 h-[calc(env(safe-area-inset-top)+58px)] flex items-center gap-2 border-b border-[var(--app-line)]">
        <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
        <span className="flex-1 text-[16px] font-bold truncate">Mumbai Onchain</span>
        <ModeMenu role={role} onExit={onExit} />
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain pt-3 pb-8">
        {tab === 'overview' && <AdminOverview data={overview.data} error={overview.error} onReviewPlaces={() => setTab('places')} onReviewPartners={() => setTab('partners')} />}
        {tab === 'events' && <AdminEvents />}
        {tab === 'places' && <AdminPlaces onChanged={overview.refresh} />}
        {tab === 'partners' && <AdminPartners onChanged={overview.refresh} />}
        {tab === 'stories' && <AdminStories onChanged={overview.refresh} />}
        {tab === 'notify' && <AdminNotify reach={overview.data?.push_people ?? null} />}
        {tab === 'team' && role === 'owner' && <AdminTeam role={role} />}
      </div>

      <nav aria-label="Admin" className="shrink-0 bg-[var(--app-surface)]/92 backdrop-blur-xl border-t border-[var(--app-line)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-16 max-w-lg mx-auto" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-[3px] ${active ? 'text-[var(--app-ink)]' : 'text-[var(--app-muted)]'}`}
              >
                {/* Seven tabs (owner) leave ~53px each on a phone: a narrower pill. */}
                <span className={`${tabs.length > 6 ? 'w-11' : 'w-14'} h-8 rounded-full flex items-center justify-center ${active ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : ''}`}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                </span>
                <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
                {(waiting[id] ?? 0) > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 min-w-5 h-5 px-1 rounded-full bg-[var(--app-live)] text-white text-[11px] font-bold flex items-center justify-center" aria-label={`${waiting[id]} waiting`}>
                    {waiting[id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
