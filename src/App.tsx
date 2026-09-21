import { useAppStore } from './lib/store';
import { usePeopleStore } from './lib/usePeopleStore';
import { Navbar } from './components/Navbar';
import { MarqueeTicker } from './components/MarqueeTicker';
import { PeopleMarquee } from './components/PeopleMarquee';
import { MobileNav } from './components/MobileNav';
import { Hero } from './components/Hero';
import { PrimaryEvent } from './components/PrimaryEvent';
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
import { Footer } from './components/Footer';
import { AlertCircle } from 'lucide-react';

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

      {/* Dynamic People / Community Ticker (Continuously moving from Left to Right) */}
      <PeopleMarquee onSelectPerson={(id) => setSelectedPersonId(id)} />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeTab === 'home' && (
          <div className="space-y-12">
            <Hero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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

      {/* Event Details Right Drawer */}
      <EventDrawer
        event={selectedEvent}
        note={selectedEventId ? notes[selectedEventId] : undefined}
        onClose={() => setSelectedEventId(null)}
        onUpdateStatus={updateEventStatus}
        onSaveNote={saveEventNote}
      />

      {/* Community Profile Drawer (Opens from People Marquee on any tab) */}
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

      {/* Global Edit / Create Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        currentProfile={myProfile}
        events={events}
        onClose={() => setIsEditModalOpen(false)}
        onSave={saveMyProfile}
      />

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default App;
