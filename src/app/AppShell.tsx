import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CalendarDays, Home, Loader2, User, Users } from 'lucide-react';
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
import { useSavedSync } from '../lib/useSavedSync';
import { isRealPerson } from '../lib/samples';
import { TodayScreen } from './TodayScreen';
import { Scene } from './Scene';
import { QuickActions } from './QuickActions';

// The map library is large, so the Map screen loads only when it's opened.
// If its file can't be fetched (an older version of the app after a deploy),
// reload once to pick up the new version instead of sitting on a black screen.
const MAP_RELOAD_KEY = 'mo_map_reload';
const MapScreen = lazy(() =>
  import('./MapScreen')
    .then((mod) => {
      try {
        sessionStorage.removeItem(MAP_RELOAD_KEY);
      } catch {
        // fine without it
      }
      return mod;
    })
    .catch(() => {
      let reloaded = true;
      try {
        reloaded = sessionStorage.getItem(MAP_RELOAD_KEY) === '1';
        sessionStorage.setItem(MAP_RELOAD_KEY, '1');
      } catch {
        // can't remember a reload, so don't risk a loop
      }
      if (!reloaded) {
        window.location.reload();
        return new Promise<never>(() => undefined);
      }
      return { default: MapUnavailable };
    })
);

function MapUnavailable({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Map" className="app fixed inset-0 z-[60] bg-[var(--app-bg)] flex flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="app-title text-[22px]">Couldn’t open the map</p>
      <p className="text-[15px] text-[var(--app-muted)]">It needs internet the first time. Check your connection and try again.</p>
      <button type="button" onClick={onClose} className="app-press mt-2 h-11 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-bold">
        Back
      </button>
    </div>
  );
}
import { ScheduleScreen } from './ScheduleScreen';
import { MeScreen } from './MeScreen';
import { AppearanceScreen } from './AppearanceScreen';
import { AboutScreen } from './AboutScreen';
import { FindProfileSheet } from './FindProfileSheet';
import { CommunitySheet, JoinCommunitySheet } from './CommunitySheet';
import { CommunityMode } from './CommunityMode';
import type { ModeTarget } from './ModeMenu';

const COMMUNITY_MODE_KEY = 'mo_community_mode';
import { communityAsked, markCommunityAsked, useCommunities, useJoinFromRef } from '../lib/useCommunities';
import { eventDays, istDateKey, WEEK_DAYS, WEEK_START, type AppTab } from './time';
import { useAdminMode, useAdminRole } from '../lib/useAdmin';
import { AdminSwitch } from './admin/AdminSwitch';
import AdminMode, { ADMIN_TABS, type AdminTab } from './admin/AdminMode';

const ROLE_KEY = 'mo_app_role';

type StoreTab = 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'communitypartner';

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
  communitypartner: 'today',
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

/** Today, or the next day that has events (events start before the week too). */
function defaultDay(events: EventItem[]): string {
  const today = istDateKey();
  const days = new Set(events.flatMap(eventDays));
  if (days.has(today)) return today;
  const next = [...days].filter((d) => d > today).sort()[0];
  return next ?? (today < WEEK_START ? WEEK_DAYS[0] : today);
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
  const { setConnectionStatus, authUser } = usePeopleStore();
  useApplyAppPrefs();
  const tab = toApp[activeTab] ?? 'today';
  // Tabs stay mounted once opened and are only hidden when you leave, so
  // coming back is instant: no re-decoding photos or rebuilding the badge.
  const [visited, setVisited] = useState<Set<AppTab>>(() => new Set([tab]));
  if (!visited.has(tab)) setVisited(new Set(visited).add(tab));
  const realPeople = people.filter(isRealPerson);
  const { savedIds, isSaved, toggleSaved } = useSavedEvents();
  // Saved events in the account, for "starts in 15 min" pushes.
  useSavedSync(authUser?.id ?? null, events);
  const [scheduleDay, setScheduleDay] = useState(() => defaultDay(events));
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isSaveCardOpen, setIsSaveCardOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // ?open=map (notifications, the home-screen shortcut) opens the map itself;
  // ?tab=map is the Venues tab, kept for older links.
  const [isMapOpen, setIsMapOpen] = useState(() => new URLSearchParams(window.location.search).get('open') === 'map');
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Communities: ?community=<id> opens a space, ?claim=<code> the leader code.
  const [openCommunityId, setOpenCommunityId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('community'));
  const [joinSheet, setJoinSheet] = useState<{ claim: boolean; code: string | null } | null>(() => {
    const code = new URLSearchParams(window.location.search).get('claim');
    return code ? { claim: true, code } : null;
  });
  const { mine: myCommunities, communities: allCommunities } = useCommunities(authUser?.id ?? null, myProfile?.id ?? null);
  const joinedFromRef = useJoinFromRef(authUser?.id ?? null, myProfile?.id ?? null);
  const [askDismissed, setAskDismissed] = useState(communityAsked);
  const showCommunityAsk = Boolean(myProfile && myCommunities && myCommunities.length === 0 && !askDismissed && !joinedFromRef);
  const communityCard = joinedFromRef ? (
    <p role="status" className="mx-4 mb-7 rounded-2xl bg-[var(--app-primary-soft)] px-4 py-3 text-[15px] font-semibold">
      You joined {joinedFromRef} 🎉 Find it in Me → Communities.
    </p>
  ) : showCommunityAsk ? (
    <section aria-label="Your community" className="mx-4 mb-7 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <p className="text-[17px] font-bold">Part of a community?</p>
      <p className="mt-1 text-[15px] text-[var(--app-muted)]">Join it here to hear from them during the week and meet its members.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setJoinSheet({ claim: false, code: null })}
          className="app-press h-10 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold"
        >
          Pick my community
        </button>
        <button
          type="button"
          onClick={() => {
            markCommunityAsked();
            setAskDismissed(true);
          }}
          className="app-press h-10 px-4 rounded-full text-[15px] font-semibold text-[var(--app-muted)]"
        >
          Not now
        </button>
      </div>
    </section>
  ) : null;

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

  // Admin mode (Me → Switch to admin): only for accounts in app_admins.
  const adminRole = useAdminRole();
  const [adminOn, setAdminOn] = useAdminMode();
  const [adminSwitch, setAdminSwitch] = useState<'in' | 'out' | null>(null);
  // ?admin=places (the "New place to review" notification) opens it there.
  const [adminLink] = useState(() => {
    const t = new URLSearchParams(window.location.search).get('admin');
    return ADMIN_TABS.includes(t as AdminTab) ? (t as AdminTab) : null;
  });
  const [adminTab, setAdminTab] = useState<AdminTab>(adminLink ?? 'overview');
  const showAdmin = adminOn && adminRole !== null;
  // Once the role is known: the link switches you in (only the first time).
  const adminLinkUsed = React.useRef(false);
  useEffect(() => {
    if (!adminLink || !adminRole || adminLinkUsed.current) return;
    adminLinkUsed.current = true;
    if (!adminOn) setAdminSwitch('in');
  }, [adminLink, adminRole, adminOn]);
  useEffect(() => {
    if (showAdmin) document.documentElement.setAttribute('data-app-admin', '');
    else document.documentElement.removeAttribute('data-app-admin');
  }, [showAdmin]);
  const finishAdminSwitch = useCallback(() => {
    setAdminOn(adminSwitch === 'in');
    setAdminSwitch(null);
  }, [adminSwitch, setAdminOn]);
  const enterAdmin = () => {
    setAdminTab('overview');
    setAdminSwitch('in');
  };

  // Community mode (lead mode): a community's leads run it from here, like
  // admin mode. Remembered across launches, like admin mode.
  const [communityMode, setCommunityModeState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(COMMUNITY_MODE_KEY);
    } catch {
      return null;
    }
  });
  const setCommunityMode = useCallback((id: string | null) => {
    setCommunityModeState(id);
    try {
      if (id) localStorage.setItem(COMMUNITY_MODE_KEY, id);
      else localStorage.removeItem(COMMUNITY_MODE_KEY);
    } catch {
      // fine for this session
    }
  }, []);
  const ledCommunities = (myCommunities ?? [])
    .filter((m) => m.role === 'lead')
    .map((m) => allCommunities.find((c) => c.id === m.communityId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  // Leads, and admins helping a community out.
  const showCommunity = Boolean(communityMode && !showAdmin && !adminSwitch && (adminRole || ledCommunities.some((c) => c.id === communityMode)));
  /** The switcher (badge menu in admin and community mode, and the Me rows). */
  const switchMode = (t: ModeTarget) => {
    if (t.kind === 'app') {
      setCommunityMode(null);
      if (showAdmin) setAdminSwitch('out');
    } else if (t.kind === 'admin') {
      setCommunityMode(null);
      if (!adminOn) enterAdmin();
    } else {
      setOpenCommunityId(null);
      setCommunityMode(t.id);
      if (adminOn) setAdminOn(false);
    }
  };

  // Drop one-time links (?open=map, ?admin=, ?claim=, ?community=, ?c=) once
  // used, so a reload doesn't open them again.
  useEffect(() => {
    const url = new URL(window.location.href);
    const once = ['open', 'admin', 'claim', 'community', 'c'];
    if (!once.some((k) => url.searchParams.has(k))) return;
    once.forEach((k) => url.searchParams.delete(k));
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, []);

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
            communityCard={communityCard}
            onOpenCommunity={setOpenCommunityId}
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
            onOpenCommunity={setOpenCommunityId}
            onJoinCommunity={() => setJoinSheet({ claim: false, code: null })}
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
            onSwitchToAdmin={adminRole ? enterAdmin : undefined}
            onOpenCommunity={setOpenCommunityId}
            onJoinCommunity={(claim) => setJoinSheet({ claim, code: null })}
            ledCommunities={ledCommunities}
            onSwitchToCommunity={(id) => switchMode({ kind: 'community', id })}
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

      <JoinCommunitySheet
        open={joinSheet !== null}
        startWithClaim={joinSheet?.claim}
        initialCode={joinSheet?.code}
        onClose={() => setJoinSheet(null)}
        onOpenCommunity={(id) => {
          setJoinSheet(null);
          setOpenCommunityId(id);
        }}
        onCreateProfile={onEditProfile}
      />
      <CommunitySheet
        communityId={openCommunityId}
        onClose={() => setOpenCommunityId(null)}
        people={realPeople}
        onOpenPerson={onSelectPerson}
        onManage={(id) => switchMode({ kind: 'community', id })}
      />

      <PassSheet person={myProfile} isOpen={isPassOpen} onClose={() => setIsPassOpen(false)} onSaveCard={() => setIsSaveCardOpen(true)} />
      <SaveCardSheet person={myProfile} isOpen={isSaveCardOpen} onClose={() => setIsSaveCardOpen(false)} />
      <AppearanceScreen open={isAppearanceOpen} onClose={() => setIsAppearanceOpen(false)} myProfile={myProfile} />
      <FindProfileSheet isOpen={isFindOpen} onClose={() => setIsFindOpen(false)} onSignIn={onSignIn} />
      <AboutScreen open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      {showAdmin && adminRole && <AdminMode key={adminTab} role={adminRole} initialTab={adminTab} led={ledCommunities} onSwitch={switchMode} />}
      {showCommunity && communityMode && (
        <CommunityMode key={communityMode} communityId={communityMode} people={realPeople} adminRole={adminRole} onOpenPerson={onSelectPerson} onSwitch={switchMode} />
      )}
      {adminSwitch && (
        <AdminSwitch
          direction={adminSwitch}
          name={myProfile?.name ?? 'You'}
          category={myProfile?.category ?? 'Attendee'}
          onDone={finishAdminSwitch}
        />
      )}
      {isMapOpen && (
        <Suspense
          fallback={
            <div className="app fixed inset-0 z-[60] bg-[var(--app-bg)] flex items-center justify-center" aria-busy="true">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--app-muted)]" aria-label="Loading map" />
            </div>
          }
        >
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
