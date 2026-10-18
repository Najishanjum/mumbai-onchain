import React, { lazy, Suspense, useEffect, useState } from 'react';
import { CalendarDays, Home, User, Users } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { ConnectionStatus, PersonProfile } from '../types/person';
import { PeopleScreen } from './PeopleScreen';
import { VenuesScreen } from './VenuesScreen';
import { EventSheet } from './EventSheet';
import { PersonSheet } from './PersonSheet';
import { PassSheet } from './PassSheet';
import { SaveCardSheet } from './SaveCardSheet';
import { ScannerSheet } from './ScannerSheet';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useApplyAppPrefs } from '../lib/useAppPrefs';
import { useSavedEvents } from '../lib/useSavedEvents';
import { isRealPerson } from '../lib/samples';
import { TodayScreen } from './TodayScreen';
import { Scene } from './Scene';
import { QuickActions } from './QuickActions';

// The map library is large, so the Map screen loads only when it's opened.
const MapScreen = lazy(() => import('./MapScreen'));
import { ScheduleScreen } from './ScheduleScreen';
import { MeScreen } from './MeScreen';
import { AppearanceScreen } from './AppearanceScreen';
import { AboutScreen } from './AboutScreen';
import { FindProfileSheet } from './FindProfileSheet';
import { istDateKey, WEEK_DAYS, WEEK_START, type AppTab } from './time';

const ROLE_KEY = 'mo_app_role';

type StoreTab ='home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator';

// The app's tabs reuse the store's tab state so deep links (?tab=people,
// manifest shortcuts, scanned profile QR codes) work in both layouts.
const toApp: Record<StoreTab, AppTab> = {
  home: 'today',
  timeline: 'schedule',
  events: 'schedule',
  people: 'people',
  map: 'map',
  mymumbai: 'me',
  'id-generator': 'today',
};
const toStore: Record<AppTab, StoreTab> = {
  today: 'home',
  schedule: 'events',
  people: 'people',
  map: 'map',
  me: 'mymumbai',
};

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  // The logo button (Map, Ask, Scan) sits here, between Schedule and People.
  { id: 'people', label: 'People', icon: Users },
  { id: 'me', label: 'Me', icon: User },
];

interface AppShellProps {
  events: EventItem[];
  activeTab: StoreTab;
  setActiveTab: (tab: StoreTab) => void;
  onOpenEvent: (id: string) => void;
  selectedEvent: EventItem | null;
  onCloseEvent: () => void;
  selectedPerson: PersonProfile | null;
  isSelectedPersonMe: boolean;
  onClosePerson: () => void;
  people: PersonProfile[];
  myProfile: PersonProfile | null;
  onEditProfile: () => void;
  onSelectPerson: (id: string) => void;
  onAddSnap: () => void;
  onAsk: () => void;
  accountEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  getConnectionStatus: (id: string) => ConnectionStatus;
}

function defaultDay(): string {
  const today = istDateKey();
  // Before the week, open on its first day rather than an empty "today".
  return today < WEEK_START ? WEEK_DAYS[0] : today;
}

export const AppShell: React.FC<AppShellProps> = ({
  events,
  activeTab,
  setActiveTab,
  onOpenEvent,
  selectedEvent,
  onCloseEvent,
  selectedPerson,
  isSelectedPersonMe,
  onClosePerson,
  people,
  myProfile,
  onEditProfile,
  onSelectPerson,
  onAddSnap,
  onAsk,
  accountEmail,
  onSignIn,
  onSignOut,
  getConnectionStatus,
}) => {
  const { setConnectionStatus } = usePeopleStore();
  useApplyAppPrefs();
  const tab = toApp[activeTab] ?? 'today';
  // Tabs stay mounted once opened and are only hidden when you leave, so
  // coming back is instant: no re-decoding photos or rebuilding the badge.
  const [visited, setVisited] = useState<Set<AppTab>>(() => new Set([tab]));
  if (!visited.has(tab)) setVisited(new Set(visited).add(tab));
  const realPeople = people.filter(isRealPerson);
  const { savedIds, isSaved, toggleSaved } = useSavedEvents();
  const [scheduleDay, setScheduleDay] = useState(defaultDay);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isSaveCardOpen, setIsSaveCardOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const goTo = (next: AppTab) => {
    if (next === tab) {
      // Tapping the current tab scrolls back to the top, as in native apps.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(toStore[next]);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  // The whole app wears the user's badge colour (see index.css). Remembered so
  // the next launch paints in it straight away (index.html reads it).
  const role = myProfile?.category?.toLowerCase() ?? null;
  useEffect(() => {
    const root = document.documentElement;
    try {
      if (role) {
        root.setAttribute('data-app-role', role);
        localStorage.setItem(ROLE_KEY, role);
      } else {
        root.removeAttribute('data-app-role');
        localStorage.removeItem(ROLE_KEY);
      }
    } catch {
      // storage blocked: the colour still applies for this session
    }
  }, [role]);

  // Show the status-bar scrim only once content has scrolled under the clock.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showPass = () => (myProfile ? setIsPassOpen(true) : onEditProfile());

  return (
    <>
      <Scene />
      <div className="app-motif" aria-hidden="true" />
      <div className={`app-statusbar${scrolled ? ' is-scrolled' : ''}`} aria-hidden="true" />
      <main className="app-main min-h-dvh pt-[env(safe-area-inset-top)] pb-[calc(var(--app-tabbar-h)+var(--app-tabbar-pad)+16px)]">
        {visited.has('today') && (
          <div hidden={tab !== 'today'}>
          <TodayScreen
            events={events}
            isSaved={isSaved}
            toggleSaved={toggleSaved}
            onOpenEvent={onOpenEvent}
            onOpenDay={(d) => {
              setScheduleDay(d);
              goTo('schedule');
            }}
            goTo={goTo}
            myProfile={myProfile}
            people={realPeople}
            onShowPass={showPass}
            onScan={() => setIsScannerOpen(true)}
            onAddSnap={onAddSnap}
            onAsk={onAsk}
            onCreateProfile={onEditProfile}
            onFindProfile={() => setIsFindOpen(true)}
            onSaveCard={() => (myProfile ? setIsSaveCardOpen(true) : onEditProfile())}
            onSelectPerson={onSelectPerson}
          />
          </div>
        )}

        {(tab === 'schedule' || tab === 'map') && (
          <div role="tablist" aria-label="Schedule view" className="mx-4 mt-3 mb-1 grid grid-cols-2 p-1 rounded-full bg-[var(--app-segment)]">
            {(
              [
                { id: 'schedule', label: 'Events' },
                { id: 'map', label: 'Venues' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={tab === v.id}
                onClick={() => setActiveTab(toStore[v.id])}
                className={`h-9 rounded-full text-[14px] font-bold ${
                  tab === v.id ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {visited.has('schedule') && (
          <div hidden={tab !== 'schedule'}>
          <ScheduleScreen
            events={events}
            isSaved={isSaved}
            toggleSaved={toggleSaved}
            onOpenEvent={onOpenEvent}
            day={scheduleDay}
            onDayChange={setScheduleDay}
          />
          </div>
        )}

        {visited.has('people') && (
          <div hidden={tab !== 'people'}>
          <PeopleScreen
            onShowPass={showPass}
            onScan={() => setIsScannerOpen(true)}
            onCreateProfile={onEditProfile}
            onSelectPerson={onSelectPerson}
            onAddSnap={onAddSnap}
          />
          </div>
        )}

        {visited.has('map') && (
          <div hidden={tab !== 'map'}>
          <VenuesScreen
            events={events}
            isSaved={isSaved}
            toggleSaved={toggleSaved}
            onOpenEvent={onOpenEvent}
            goTo={goTo}
          />
          </div>
        )}

        {visited.has('me') && (
          <div hidden={tab !== 'me'}>
          <MeScreen
            myProfile={myProfile}
            savedCount={savedIds.length}
            onEditProfile={onEditProfile}
            onShowPass={showPass}
            onScan={() => setIsScannerOpen(true)}
            onOpenPlan={() => goTo('schedule')}
            accountEmail={accountEmail}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onOpenAppearance={() => setIsAppearanceOpen(true)}
            onFindProfile={() => setIsFindOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
          </div>
        )}
      </main>

      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-50 bg-[var(--app-surface)]/92 backdrop-blur-xl border-t border-[var(--app-line)] pb-[var(--app-tabbar-pad)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      >
        <div className="grid grid-cols-5 h-[var(--app-tabbar-h)] max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }, i) => {
            // Venues lives inside Schedule now, so it lights up Schedule.
            const active = id === tab || (id === 'schedule' && tab === 'map');
            const tabButton = (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-[3px] ${
                  active ? 'text-[var(--app-ink)]' : 'text-[var(--app-muted)]'
                }`}
              >
                <span
                  className={`w-14 h-8 rounded-full flex items-center justify-center ${
                    active ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : ''
                  }`}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                </span>
                <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </button>
            );
            if (i !== 2) return tabButton;
            // The round logo in the middle fans out Map, Ask and Scan.
            return (
              <React.Fragment key={id}>
                <QuickActions onAsk={onAsk} onMap={() => setIsMapOpen(true)} onScan={() => setIsScannerOpen(true)} />
                {tabButton}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* Event first, person on top: tapping someone under "Going" stacks
          their profile over the event, and closing it returns to the event. */}
      <EventSheet
        event={selectedEvent}
        onClose={onCloseEvent}
        isSaved={isSaved}
        toggleSaved={toggleSaved}
        people={realPeople}
        onOpenPerson={onSelectPerson}
      />
      <PersonSheet
        person={selectedPerson}
        isCurrentUser={isSelectedPersonMe}
        events={events}
        onClose={onClosePerson}
        onOpenEvent={(id) => {
          // Going from a person to an event replaces the stack instead of nesting deeper.
          onClosePerson();
          onOpenEvent(id);
        }}
        onEditProfile={onEditProfile}
        onShowPass={showPass}
      />

      <PassSheet person={myProfile} isOpen={isPassOpen} onClose={() => setIsPassOpen(false)} onSaveCard={() => setIsSaveCardOpen(true)} />
      <SaveCardSheet person={myProfile} isOpen={isSaveCardOpen} onClose={() => setIsSaveCardOpen(false)} />
      <AppearanceScreen open={isAppearanceOpen} onClose={() => setIsAppearanceOpen(false)} myProfile={myProfile} />
      <FindProfileSheet isOpen={isFindOpen} onClose={() => setIsFindOpen(false)} onSignIn={onSignIn} />
      <AboutScreen open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      {isMapOpen && (
        <Suspense fallback={<div className="app fixed inset-0 z-[60] bg-[var(--app-bg)]" aria-busy="true" />}>
          <MapScreen
            open={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            events={events}
            onOpenVenues={() => {
              setIsMapOpen(false);
              goTo('map');
            }}
            onRequireProfile={() => {
              // Sign in and make a profile first; the map closes so the steps show.
              setIsMapOpen(false);
              onEditProfile();
            }}
          />
        </Suspense>
      )}
      <ScannerSheet
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        people={realPeople}
        getConnectionStatus={getConnectionStatus}
        onAdd={(id) => setConnectionStatus(id, 'CONNECTED')}
        onOpenPerson={(id) => {
          setIsScannerOpen(false);
          onSelectPerson(id);
        }}
      />
    </>
  );
};
