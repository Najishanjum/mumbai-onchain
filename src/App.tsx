import { useAppStore } from './lib/store';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Hero } from './components/Hero';
import { PrimaryEvent } from './components/PrimaryEvent';
import { NextEvent } from './components/NextEvent';
import { TodayMode } from './components/TodayMode';
import { Timeline } from './components/Timeline';
import { EventFilters } from './components/EventFilters';
import { EventCard } from './components/EventCard';
import { EventDrawer } from './components/EventDrawer';
import { MapView } from './components/MapView';
import { MyMumbai } from './components/MyMumbai';
import { SideEvents } from './components/SideEvents';
import { Footer } from './components/Footer';
import { detectScheduleConflicts } from './lib/conflicts';
import { Calendar, AlertCircle } from 'lucide-react';

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

  const conflicts = detectScheduleConflicts(events);

  // Set of conflict IDs
  const conflictIds = new Set<string>();
  conflicts.forEach(c => {
    conflictIds.add(c.event1.id);
    conflictIds.add(c.event2.id);
  });

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
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F5F5F5]">
      
      {/* Desktop Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflictCount={conflicts.length}
      />

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
            <div className="bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 tech-grid">
              <div className="flex items-center gap-2 font-mono text-xs text-[#627EEA] uppercase tracking-widest mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>ALL MUMBAI EVENTS</span>
              </div>
              <h2 className="font-heading font-extrabold text-3xl text-white">ALL MUMBAI EVENTS</h2>
              <p className="font-mono text-xs text-zinc-400 mt-1">Filter side events, hackathons, and conferences</p>
            </div>

            <EventFilters
              filters={filters}
              onFilterChange={setFilters}
              totalResults={filteredEvents.length}
            />

            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#222] rounded-3xl bg-[#080808]">
                <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <h4 className="font-mono text-sm font-bold text-zinc-300">NO MATCHING EVENTS FOUND</h4>
                <p className="font-mono text-xs text-zinc-500 mt-1">Try relaxing your search or filter parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map(evt => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    hasConflict={conflictIds.has(evt.id)}
                    onSelectEvent={(id) => setSelectedEventId(id)}
                  />
                ))}
              </div>
            )}
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

      {/* Event Details Right Drawer & Mobile Bottom Sheet */}
      <EventDrawer
        event={selectedEvent}
        note={selectedEventId ? notes[selectedEventId] : undefined}
        onClose={() => setSelectedEventId(null)}
        onUpdateStatus={updateEventStatus}
        onSaveNote={saveEventNote}
      />

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflictCount={conflicts.length}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}
export default App;
