import { useEffect, useRef, useState } from 'react';
import { BarChart3, Bell, ChevronLeft, Handshake, Images, MapPin, Users } from 'lucide-react';
import type { AdminRole } from '../../lib/useAdmin';
import { useOverview } from './shared';
import { AdminOverview } from './AdminOverview';
import { AdminPlaces } from './AdminPlaces';
import { AdminPartners } from './AdminPartners';
import { AdminStories } from './AdminStories';
import { AdminNotify } from './AdminNotify';
import { AdminTeam } from './AdminTeam';

export const ADMIN_TABS = ['overview', 'places', 'partners', 'stories', 'notify', 'team'] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

const TABS: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'partners', label: 'Partners', icon: Handshake },
  { id: 'stories', label: 'Stories', icon: Images },
  { id: 'notify', label: 'Notify', icon: Bell },
  { id: 'team', label: 'Team', icon: Users },
];

/** Admin mode: its own screens and tab bar, over the app. */
export default function AdminMode({ role, initialTab = 'overview', onExit }: { role: AdminRole; initialTab?: AdminTab; onExit: () => void }) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
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
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top)+6px)] px-2 pb-2 flex items-center gap-2 border-b border-[var(--app-line)]">
        <button type="button" onClick={onExit} className="app-press h-11 pl-1 pr-3 rounded-full inline-flex items-center gap-0.5 text-[16px] font-semibold">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          App
        </button>
        <div className="flex-1" />
        <span className="mr-3 h-7 px-3 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[12px] font-extrabold tracking-[0.14em] inline-flex items-center">
          {role === 'owner' ? 'OWNER' : 'ADMIN'}
        </span>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain pt-3 pb-8">
        {tab === 'overview' && <AdminOverview data={overview.data} error={overview.error} onReviewPlaces={() => setTab('places')} onReviewPartners={() => setTab('partners')} />}
        {tab === 'places' && <AdminPlaces onChanged={overview.refresh} />}
        {tab === 'partners' && <AdminPartners onChanged={overview.refresh} />}
        {tab === 'stories' && <AdminStories onChanged={overview.refresh} />}
        {tab === 'notify' && <AdminNotify reach={overview.data?.push_people ?? null} />}
        {tab === 'team' && <AdminTeam role={role} />}
      </div>

      <nav aria-label="Admin" className="shrink-0 bg-[var(--app-surface)]/92 backdrop-blur-xl border-t border-[var(--app-line)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 h-16 max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-[3px] ${active ? 'text-[var(--app-ink)]' : 'text-[var(--app-muted)]'}`}
              >
                <span className={`w-14 h-8 rounded-full flex items-center justify-center ${active ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : ''}`}>
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
