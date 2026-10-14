import React, { useEffect, useState } from 'react';
import { CalendarDays, Home, Map as MapIcon, User, Users } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { ConnectionStatus, PersonProfile } from '../types/person';
import { PeopleScreen } from './PeopleScreen';
import { VenuesScreen } from './VenuesScreen';
import { EventSheet } from './EventSheet';
import { PersonSheet } from './PersonSheet';
import { PassSheet } from './PassSheet';
import { ScannerSheet } from './ScannerSheet';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSavedEvents } from '../lib/useSavedEvents';
import { isRealPerson } from '../lib/samples';
import { TodayScreen } from './TodayScreen';
import { ScheduleScreen } from './ScheduleScreen';
import { MeScreen } from './MeScreen';
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
  { id: 'people', label: 'People', icon: Users },
  { id: 'map', label: 'Venues', icon: MapIcon },
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
  const tab = toApp[activeTab] ?? 'today';
  const realPeople = people.filter(isRealPerson);
  const { savedIds, isSaved, toggleSaved } = useSavedEvents();
  const [scheduleDay, setScheduleDay] = useState(defaultDay);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
      <div className={`app-statusbar${scrolled ? ' is-scrolled' : ''}`} aria-hidden="true" />
      <main className="app-main min-h-dvh pt-[env(safe-area-inset-top)] pb-[calc(var(--app-tabbar-h)+env(safe-area-inset-bottom)+16px)]">
        {tab === 'today' && (
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
            onSelectPerson={onSelectPerson}
          />
        )}

        {tab === 'schedule' && (
          <ScheduleScreen
            events={events}
            isSaved={isSaved}
            toggleSaved={toggleSaved}
            onOpenEvent={onOpenEvent}
            day={scheduleDay}
            onDayChange={setScheduleDay}
          />
        )}

        {tab === 'people' && (
          <PeopleScreen
            onShowPass={showPass}
            onScan={() => setIsScannerOpen(true)}
            onCreateProfile={onEditProfile}
            onSelectPerson={onSelectPerson}
            onAddSnap={onAddSnap}
          />
        )}

        {tab === 'map' && (
          <VenuesScreen
            events={events}
            isSaved={isSaved}
            toggleSaved={toggleSaved}
            onOpenEvent={onOpenEvent}
            goTo={goTo}
          />
        )}

        {tab === 'me' && (
          <MeScreen
            myProfile={myProfile}
            savedCount={savedIds.length}
            onEditProfile={onEditProfile}
            onShowPass={showPass}
            onScan={() => setIsScannerOpen(true)}
            onAddSnap={onAddSnap}
            onOpenPlan={() => goTo('schedule')}
            accountEmail={accountEmail}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        )}
      </main>

      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-50 bg-[var(--app-surface)]/92 backdrop-blur-xl border-t border-[var(--app-line)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      >
        <div className="grid grid-cols-5 h-[var(--app-tabbar-h)] max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
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

      <PassSheet person={myProfile} isOpen={isPassOpen} onClose={() => setIsPassOpen(false)} />
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
