import { useEffect } from 'react';
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
import { AskMumbaiAssistant } from './components/AskMumbaiAssistant';
import { AlertCircle, Camera, ArrowRight } from 'lucide-react';

export function App() {
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
  } = usePeopleStore();

  const {
    activeSnapForViewer,
    isAddSnapModalOpen,
    preselectedEventIdForSnap,
    recentSnaps,
    setActiveSnapForViewer,
    setIsAddSnapModalOpen,
  } = useSnapStore();

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

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#050505] tech-grid">
      
      {/* Desktop Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Top Event Telemetry Stream */}
      <MarqueeTicker />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-20 md:pb-12">
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
      </main>

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
        isCurrentUser={Boolean(selectedPerson && (selectedPerson.isCurrentUser || (myProfile && myProfile.id === selectedPerson.id)))}
        events={events}
        onClose={() => setSelectedPersonId(null)}
        onCycleConnection={cycleConnection}
        onEditProfile={() => setIsEditModalOpen(true)}
        onSelectEvent={(id) => setSelectedEventId(id)}
      />

      {/* Global Edit / Create Profile Modal with Skills, Building, Privacy */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        currentProfile={myProfile}
        events={events}
        onClose={() => setIsEditModalOpen(false)}
        onSave={saveMyProfile}
      />

      {/* Lightbox Snap Viewer */}
      <SnapViewerModal
        snap={activeSnapForViewer}
        onClose={() => setActiveSnapForViewer(null)}
        onOpenProfile={(personId) => setSelectedPersonId(personId)}
      />

      {/* Add Snap Modal */}
      <AddSnapModal
        isOpen={isAddSnapModalOpen}
        events={events}
        preselectedEventId={preselectedEventIdForSnap}
        onClose={() => setIsAddSnapModalOpen(false)}
      />

      {/* Non-intrusive Live Match Toast */}
      <LiveMatchToast
        onOpenProfile={(personId) => setSelectedPersonId(personId)}
      />

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* MUMBAI ONCHAIN AI ASSISTANT (Floating Chatbot across entire website) */}
      <AskMumbaiAssistant
        events={events}
        people={people}
        myProfile={myProfile}
        connections={connections}
        notes={notes}
        onSelectEvent={(id) => setSelectedEventId(id)}
        onSelectPerson={(id) => setSelectedPersonId(id)}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default App;
