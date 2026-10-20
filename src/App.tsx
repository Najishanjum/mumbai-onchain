import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from './lib/store';
import { usePeopleStore } from './lib/usePeopleStore';
import { useSnapStore } from './lib/useSnapStore';
import { Navbar } from './components/Navbar';
import { MarqueeTicker } from './components/MarqueeTicker';
import { PeopleMarquee } from './components/PeopleMarquee';
import { MobileNav } from './components/MobileNav';
import { Hero } from './components/Hero';
import { PrimaryEvent } from './components/PrimaryEvent';
import { OnchainIntroVideo } from './components/OnchainIntroVideo';
import { NextEvent } from './components/NextEvent';
import { TodayMode } from './components/TodayMode';
import { Timeline } from './components/Timeline';
import { EventFilters } from './components/EventFilters';
import { EventCard } from './components/EventCard';
import { EventDrawer } from './components/EventDrawer';
import { ProfileDrawer } from './components/ProfileDrawer';
import { EditProfileModal } from './components/EditProfileModal';
import { MapView } from './components/MapView';
import { MyMumbai } from './components/MyMumbai';
import { SideEvents } from './components/SideEvents';
import { PeopleDirectory } from './components/PeopleDirectory';
import { SnapViewerModal } from './components/SnapViewerModal';
import { AddSnapModal } from './components/AddSnapModal';
import { LiveMatchToast } from './components/LiveMatchToast';
import { Footer } from './components/Footer';
import { CommunityPartnerSection } from './components/CommunityPartnerSection';
import { CommunityPartnerPage } from './components/CommunityPartnerPage';
import { CommunityPartnerModal } from './components/CommunityPartnerModal';
import { AskMumbaiAssistant } from './components/AskMumbaiAssistant';
import { AskScreen } from './app/AskScreen';
import { NotifyPrompt, shouldAskForNotifications } from './app/NotifyPrompt';
import { usePushSync } from './lib/push';
import { InstallBanner } from './components/InstallBanner';
import { InstallSheet } from './components/InstallSheet';
import { KeepProfileBanner } from './components/KeepProfileBanner';
import { PwaStatus } from './components/PwaStatus';
import { AppShell } from './app/AppShell';
import { Intro } from './app/Intro';
import { ProfileEditorSheet } from './app/ProfileEditorSheet';
import { SnapViewer } from './app/SnapViewer';
import { AddSnapSheet } from './app/AddSnapSheet';
import { SignInSheet } from './app/SignInSheet';
import { isSupabaseConfigured } from './lib/supabase';
import { isAppMode } from './lib/pwa';
import { useAppTheme } from './lib/useAppTheme';
import { NEED_APP_COPY, NEED_APP_EVENT, type AppOnlyAction } from './lib/appGate';
import { AlertCircle, Camera, ArrowRight } from 'lucide-react';

export function App() {
  const [appMode] = useState(isAppMode);
  useAppTheme(appMode);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [installReason, setInstallReason] = useState<AppOnlyAction | null>(null);
  const openInstall = useCallback(() => {
    setInstallReason(null);
    setIsInstallOpen(true);
  }, []);
  const closeInstall = useCallback(() => setIsInstallOpen(false), []);

  // On the website, app-only actions (connect, snaps, profiles, scanning)
  // land here and open the install sheet with the reason (see lib/appGate).
  useEffect(() => {
    const onNeedApp = (e: Event) => {
      setInstallReason((e as CustomEvent<AppOnlyAction>).detail);
      setIsInstallOpen(true);
    };
    window.addEventListener(NEED_APP_EVENT, onNeedApp);
    return () => window.removeEventListener(NEED_APP_EVENT, onNeedApp);
  }, []);

  const {
    events,
    notes,
    selectedEventId,
    selectedEvent,
    activeTab,
    filters,
    setSelectedEventId,
    setActiveTab,
    setFilters,
    updateEventStatus,
    saveEventNote,
  } = useAppStore();

  const {
    people,
    connections,
    selectedPerson,
    selectedPersonId,
    myProfile,
    isEditModalOpen,
    setSelectedPersonId,
    setIsEditModalOpen,
    saveMyProfile,
    cycleConnection,
    getConnectionStatus,
    authUser,
    accountReady,
    signOut,
  } = usePeopleStore();

  const {
    activeSnapForViewer,
    isAddSnapModalOpen,
    preselectedEventIdForSnap,
    recentSnaps,
    setActiveSnapForViewer,
    setIsAddSnapModalOpen,
  } = useSnapStore();

  // ── Sign-in gate ──────────────────────────────────────────────────────
  // Profiles and snaps can only be saved by a signed-in owner. Every way
  // into "create/edit profile" or "add snap" (website or app) goes through
  // sign-in first, then continues to what the person was doing.
  const [signInFor, setSignInFor] = useState<null | 'profile' | 'snap' | 'account'>(null);
  const cloud = isSupabaseConfigured();

  useEffect(() => {
    if (!cloud || authUser) return;
    if (isEditModalOpen) {
      setIsEditModalOpen(false);
      setSignInFor('profile');
    } else if (isAddSnapModalOpen) {
      setIsAddSnapModalOpen(false);
      setSignInFor('snap');
    }
  }, [cloud, authUser, isEditModalOpen, isAddSnapModalOpen, setIsEditModalOpen, setIsAddSnapModalOpen]);

  // Once signed in and the account's profile is loaded (or attached), carry on.
  useEffect(() => {
    if (!signInFor || !authUser || !accountReady) return;
    // They tapped "create profile", but the account already had one: it's now
    // restored, so there's nothing to fill in.
    if (signInFor === 'profile' && !myProfile) setIsEditModalOpen(true);
    if (signInFor === 'snap') setIsAddSnapModalOpen(true);
    setSignInFor(null);
  }, [signInFor, authUser, accountReady, myProfile, setIsEditModalOpen, setIsAddSnapModalOpen]);

  const signInReason =
    signInFor === 'profile'
      ? 'to save your pass on every device'
      : signInFor === 'snap'
        ? 'to post snaps'
        : undefined;

  // Handle URL deep-linking for scanned QR codes and shared profile links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const personId = params.get('person');
      const tabParam = params.get('tab');

      if (personId) {
        setSelectedPersonId(personId);
        setActiveTab('people');
      } else if (tabParam === 'id-generator') {
        window.open('https://devcon8-id.vercel.app/', '_blank', 'noopener,noreferrer');
        setActiveTab('home');
      } else if (params.get('partner') || params.get('apply') === 'partner') {
        setIsPartnerModalOpen(true);
      } else if (tabParam) {
        if (['home', 'timeline', 'events', 'people', 'map', 'mymumbai'].includes(tabParam)) {
          setActiveTab(tabParam as any);
        }
      }
    } catch (e) {
      console.error('Error parsing URL parameters:', e);
    }
  }, [setSelectedPersonId, setActiveTab]);

  // Devcon 8 Primary Event item
  const primaryDevconEvent = events.find(e => e.isPrimary || e.id === 'devcon-8-india') || events[0];

  // Filter events based on active filters
  const filteredEvents = events.filter(e => {
    if (filters.category !== 'ALL' && e.category !== filters.category) return false;
    if (filters.date !== 'ALL') {
      const matchesDate = e.startDate === filters.date || (e.startDate <= filters.date && e.endDate >= filters.date);
      if (!matchesDate) return false;
    }
    if (filters.status !== 'ALL' && e.status !== filters.status) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchOrganizer = e.organizer.toLowerCase().includes(q);
      const matchLocation = e.location.toLowerCase().includes(q);
      if (!matchTitle && !matchOrganizer && !matchLocation) return false;
    }
    return true;
  });

  // Joining (create profile or sign in) is the moment to ask for
  // notifications in the app: once, before carrying on with what they tapped.
  const [notifyNext, setNotifyNext] = useState<(() => void) | null>(null);
  usePushSync(authUser?.id, appMode);
  const beforeJoining = (next: () => void) => {
    if (appMode && !myProfile && shouldAskForNotifications()) setNotifyNext(() => next);
    else next();
  };

  const isSelectedPersonMe = Boolean(
    selectedPerson && (selectedPerson.isCurrentUser || (myProfile && myProfile.id === selectedPerson.id))
  );

  // Drawers, modals and floating helpers used by both the website and the app.
  const sharedOverlays = (
    <>
      <SignInSheet isOpen={Boolean(signInFor) && !authUser} onClose={() => setSignInFor(null)} reason={signInReason} />

      {/* Website drawers. The app shows its own EventSheet / PersonSheet. */}
      {!appMode && (
        <>
          {/* Event Details Right Drawer with People Match & Snaps */}
          <EventDrawer
            event={selectedEvent}
            note={selectedEventId ? notes[selectedEventId] : undefined}
            onClose={() => setSelectedEventId(null)}
            onUpdateStatus={updateEventStatus}
            onSaveNote={saveEventNote}
            onOpenPersonProfile={(personId) => setSelectedPersonId(personId)}
          />

          {/* Community Profile Drawer (4 Tabs: OVERVIEW, SNAPS, EVENTS, MATCH, NETWORK) */}
          <ProfileDrawer
            person={selectedPerson}
            connectionStatus={selectedPersonId ? getConnectionStatus(selectedPersonId) : 'NOT_CONNECTED'}
            isCurrentUser={isSelectedPersonMe}
            events={events}
            onClose={() => setSelectedPersonId(null)}
            onCycleConnection={cycleConnection}
            onEditProfile={() => setIsEditModalOpen(true)}
            onSelectEvent={(id) => setSelectedEventId(id)}
          />
        </>
      )}

      {/* Create / edit profile: the app's own sheet, or the website modal */}
      {appMode ? (
        <ProfileEditorSheet
          isOpen={isEditModalOpen}
          currentProfile={myProfile}
          events={events}
          onClose={() => setIsEditModalOpen(false)}
          onSave={saveMyProfile}
        />
      ) : (
        <EditProfileModal
          isOpen={isEditModalOpen}
          currentProfile={myProfile}
          events={events}
          onClose={() => setIsEditModalOpen(false)}
          onSave={saveMyProfile}
        />
      )}

      {/* Snap viewer + Add snap: app sheets, or the website modals */}
      {appMode ? (
        <>
          <SnapViewer onOpenPerson={(personId) => setSelectedPersonId(personId)} />
          <AddSnapSheet
            isOpen={isAddSnapModalOpen}
            events={events}
            preselectedEventId={preselectedEventIdForSnap}
            onClose={() => setIsAddSnapModalOpen(false)}
            onCreateProfile={() => beforeJoining(() => setIsEditModalOpen(true))}
          />
        </>
      ) : (
        <>
          <SnapViewerModal
            snap={activeSnapForViewer}
            onClose={() => setActiveSnapForViewer(null)}
            onOpenProfile={(personId) => setSelectedPersonId(personId)}
          />
          <AddSnapModal
            isOpen={isAddSnapModalOpen}
            events={events}
            preselectedEventId={preselectedEventIdForSnap}
            onClose={() => setIsAddSnapModalOpen(false)}
          />
        </>
      )}

      {/* Non-intrusive Live Match Toast. Website only: in the app it covered
          half the screen and matched against seed profiles before the user
          had a profile of their own. */}
      {!appMode && (
        <LiveMatchToast
          onOpenProfile={(personId) => setSelectedPersonId(personId)}
        />
      )}

      {/* MUMBAI ONCHAIN AI ASSISTANT. The app has its own full-screen Ask,
          opened from the logo button in the tab bar; the website keeps its
          floating chat. Both share the same engine and chat history. */}
      {appMode ? (
        <AskScreen
          open={isAskOpen}
          onClose={() => setIsAskOpen(false)}
          events={events}
          people={people}
          myProfile={myProfile}
          connections={connections}
          notes={notes}
          onSelectEvent={(id) => setSelectedEventId(id)}
          onSelectPerson={(id) => setSelectedPersonId(id)}
        />
      ) : (
        <AskMumbaiAssistant
          events={events}
          people={people}
          myProfile={myProfile}
          connections={connections}
          notes={notes}
          onSelectEvent={(id) => setSelectedEventId(id)}
          onSelectPerson={(id) => setSelectedPersonId(id)}
        />
      )}

      {/* Community Partner Application Modal */}
      <CommunityPartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />
    </>
  );

  // Installed app (or ?app=1): a focused app layout instead of the landing page.
  if (appMode) {
    return (
      <div className="app app-root relative isolate min-h-dvh">
        <PwaStatus />
        <Intro />
        <AppShell
          events={events}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenEvent={(id) => setSelectedEventId(id)}
          selectedEvent={selectedEvent}
          onCloseEvent={() => setSelectedEventId(null)}
          selectedPerson={selectedPerson}
          isSelectedPersonMe={isSelectedPersonMe}
          onClosePerson={() => setSelectedPersonId(null)}
          people={people}
          myProfile={myProfile}
          onEditProfile={() => beforeJoining(() => setIsEditModalOpen(true))}
          onSelectPerson={(id) => setSelectedPersonId(id)}
          onAddSnap={() => setIsAddSnapModalOpen(true)}
          onAsk={() => setIsAskOpen(true)}
          accountEmail={authUser?.email ?? null}
          onSignIn={() => beforeJoining(() => setSignInFor('account'))}
          onSignOut={signOut}
          getConnectionStatus={getConnectionStatus}
        />
        {sharedOverlays}
        <NotifyPrompt
          isOpen={Boolean(notifyNext)}
          onDone={() => {
            const next = notifyNext;
            setNotifyNext(null);
            next?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#050505] tech-grid">
      
      {/* Offline strip + "new version ready" toast */}
      <PwaStatus />

      {/* Desktop Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onInstall={openInstall}
      />

      <InstallBanner onOpen={openInstall} />

      {/* Profiles made here before accounts: sign in to keep them for the app. */}
      <KeepProfileBanner onSignIn={() => setSignInFor('account')} onInstall={openInstall} />

      {/* Top Event Telemetry Stream */}
      <MarqueeTicker />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12">
        {activeTab === 'home' && (
          <div className="space-y-12">
            <Hero
              onNavigatePeople={() => setActiveTab('people')}
              onOpenCreateProfile={() => setIsEditModalOpen(true)}
            />

            {/* Dynamic People / Community Ticker */}
            <PeopleMarquee onSelectPerson={(id) => setSelectedPersonId(id)} />

            {/* Home Quick Visual Snaps Banner (Requirement 15) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-[#FFFFFF] border-2 border-[#000000] p-4 sm:p-5 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#F97316]" />
                    <span className="font-heading font-black text-sm uppercase tracking-wide">
                      📸 RECENT COMMUNITY SNAPS
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('people')}
                    className="font-mono text-xs font-bold text-[#000000] hover:text-[#0052FF] flex items-center gap-1"
                  >
                    <span>EXPLORE ALL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentSnaps.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#000000] bg-[#FAFAFA]">
                    <p className="font-heading font-black text-xs uppercase text-[#000000]">
                      📸 No community Snaps yet.
                    </p>
                    <p className="font-mono text-[11px] text-[#666666] mt-0.5">
                      Be the first to capture a moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {recentSnaps.slice(0, 6).map(snap => (
                      <div
                        key={snap.id}
                        onClick={() => setActiveSnapForViewer(snap)}
                        className="group relative aspect-square bg-black border border-[#000000] overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                      >
                        <img
                          src={snap.thumbnailUrl || snap.imageUrl}
                          alt="Snap"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-1.5 opacity-90 group-hover:opacity-100">
                          <div className="text-[9px] font-mono text-[#22C55E] truncate font-bold">
                            {snap.authorName.split(' ')[0]}
                          </div>
                          <div className="text-[8.5px] font-mono text-white/80 truncate">
                            {snap.eventName?.split(' ')[0] || 'Devcon'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              {/* Mumbai Onchain Official Intro Video Player */}
              <OnchainIntroVideo
                videoSrc="/videos/onchain-intro.mp4"
                title="MUMBAI ONCHAIN // OFFICIAL INTRO STREAM"
              />

              {/* Next Event Indicator */}
              <NextEvent
                events={events}
                onSelectEvent={(id) => setSelectedEventId(id)}
              />

              {/* Featured Primary Mission: Devcon 8 */}
              {primaryDevconEvent && (
                <PrimaryEvent
                  event={primaryDevconEvent}
                  onSelectEvent={(id) => setSelectedEventId(id)}
                />
              )}

              {/* Today Mode Dynamic IST Overview */}
              <TodayMode
                events={events}
                onSelectEvent={(id) => setSelectedEventId(id)}
              />

              {/* Side Events Section */}
              <SideEvents />

              {/* Become a Community Partner Section */}
              <CommunityPartnerSection onApply={() => setIsPartnerModalOpen(true)} />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <Timeline
              events={events}
              onSelectEvent={(id) => setSelectedEventId(id)}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-2 select-none">
              <div className="font-mono text-xs text-[#666666] uppercase tracking-widest">
                FULL DIRECTORY // 01—08 NOV 2026
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] uppercase tracking-tight">
                ALL MUMBAI EVENTS
              </h2>
              <p className="font-mono text-xs text-[#555555]">
                Curated catalogue of side events, hackathons, and conferences across Mumbai with interactive status tracking.
              </p>
            </div>

            <EventFilters
              filters={filters}
              onFilterChange={setFilters}
              totalResults={filteredEvents.length}
            />

            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#D8D8D8] bg-[#FAFAFA] select-none">
                <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
                <h4 className="font-mono text-sm font-bold text-[#000000]">NO MATCHING EVENTS FOUND</h4>
                <p className="font-mono text-xs text-[#666666] mt-1">Try relaxing your search query or ecosystem filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((evt, idx) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    index={idx}
                    onSelectEvent={(id) => setSelectedEventId(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'people' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <PeopleDirectory
              events={events}
              onSelectEvent={(id) => setSelectedEventId(id)}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <MapView
              events={events}
              onSelectEvent={(id) => setSelectedEventId(id)}
            />
          </div>
        )}

        {activeTab === 'mymumbai' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <MyMumbai
              events={events}
              notes={notes}
              onSelectEvent={(id) => setSelectedEventId(id)}
              onSaveNote={saveEventNote}
              onUpdateStatus={updateEventStatus}
            />
          </div>
        )}

        {activeTab === 'communitypartner' && (
          <CommunityPartnerPage onApply={() => setIsPartnerModalOpen(true)} />
        )}
      </main>

      {sharedOverlays}

      <InstallSheet isOpen={isInstallOpen} onClose={closeInstall} reason={installReason ? NEED_APP_COPY[installReason] : null} />

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Footer */}
      <Footer onApplyPartner={() => setIsPartnerModalOpen(true)} />

    </div>
  );
}

export default App;
