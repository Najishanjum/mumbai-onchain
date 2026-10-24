import { useState, useEffect } from 'react';
import type { EventItem, UserEventNote, EventStatus, FilterState } from '../types/event';
import { INITIAL_EVENTS } from '../data/events';
import { supabase, isSupabaseConfigured } from './supabase';
import { EVENTS_CHANGED, fetchAppEventRows, mergeEvents, readCachedRows } from './appEvents';

const EVENTS_STORAGE_KEY = 'mumbai_onchain_week_events_v3';
const NOTES_STORAGE_KEY = 'mumbai_onchain_week_notes_v1';

/** The built-in events, with any status this phone set on them. */
function builtInEvents(): EventItem[] {
  const saved = localStorage.getItem(EVENTS_STORAGE_KEY) || localStorage.getItem('mumbai_onchain_week_events_v2');
  if (saved) {
    try {
      const parsed: EventItem[] = JSON.parse(saved);
      const savedMap = new Map(parsed.map((e) => [e.id, e]));
      return INITIAL_EVENTS.map((initEvt) => {
        const existing = savedMap.get(initEvt.id);
        return existing ? { ...initEvt, status: existing.status } : initEvt;
      });
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_EVENTS;
}

export function useAppStore() {
  // Built-in events plus what admins added or changed (app_events), from the
  // last launch's copy until the fresh one arrives.
  const [events, setEvents] = useState<EventItem[]>(() => mergeEvents(builtInEvents(), readCachedRows()));

  const [notes, setNotes] = useState<Record<string, UserEventNote>>(() => {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('ALL');

  const [activeTab, setActiveTabState] = useState<'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'communitypartner'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('id-generator') || hash.includes('id-generator') || path.includes('/id') || hash.includes('#id')) {
        window.open('https://devcon8-id.vercel.app/', '_blank', 'noopener,noreferrer');
        return 'home';
      }
      if (path.includes('communitypartner') || path.includes('community-partner') || hash.includes('communitypartner') || hash.includes('community-partner')) {
        return 'communitypartner';
      }
      if (path.includes('people') || hash.includes('people')) return 'people';
      if (path.includes('timeline') || hash.includes('timeline')) return 'timeline';
      if (path.includes('events') || hash.includes('events')) return 'events';
      if (path.includes('map') || hash.includes('map')) return 'map';
      if (path.includes('mymumbai') || path.includes('/me') || hash.includes('mymumbai') || hash.includes('me')) return 'mymumbai';
    }
    return 'home';
  });

  const setActiveTab = (tab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'communitypartner') => {
    if (tab === 'id-generator') {
      window.open('https://devcon8-id.vercel.app/', '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const newPath = tab === 'home' ? '/' : `/${tab}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ tab }, '', newPath);
      }
    }
  };

  // Listen to popstate (back/forward browser navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('id-generator') || hash.includes('id-generator') || path.includes('/id') || hash.includes('#id')) setActiveTabState('id-generator');
      else if (path.includes('people') || hash.includes('people')) setActiveTabState('people');
      else if (path.includes('timeline') || hash.includes('timeline')) setActiveTabState('timeline');
      else if (path.includes('events') || hash.includes('events')) setActiveTabState('events');
      else if (path.includes('map') || hash.includes('map')) setActiveTabState('map');
      else if (path.includes('mymumbai') || path.includes('/me') || hash.includes('mymumbai') || hash.includes('me')) setActiveTabState('mymumbai');
      else setActiveTabState('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    category: 'ALL',
    date: 'ALL',
    status: 'ALL',
    searchQuery: '',
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // Events admins added or changed, now and whenever Admin → Events saves.
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    let live = true;
    const load = () =>
      fetchAppEventRows().then((rows) => {
        // Offline or not migrated yet: keep what's showing.
        if (live && rows) setEvents((prev) => mergeEvents(builtInEvents().map((e) => ({ ...e, status: prev.find((p) => p.id === e.id)?.status ?? e.status })), rows));
      });
    void load();
    window.addEventListener(EVENTS_CHANGED, load);
    return () => {
      live = false;
      window.removeEventListener(EVENTS_CHANGED, load);
    };
  }, []);

  // Update status of an event
  const updateEventStatus = async (eventId: string, newStatus: EventStatus) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('events').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', eventId);
      } catch (e) {
        console.error('Failed to sync status to Supabase:', e);
      }
    }
  };

  // Save/update event notes
  const saveEventNote = async (eventId: string, noteData: Partial<UserEventNote>) => {
    const existing = notes[eventId] || { id: eventId, eventId, updatedAt: new Date().toISOString() };
    const updated: UserEventNote = {
      ...existing,
      ...noteData,
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => ({ ...prev, [eventId]: updated }));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('event_notes').upsert({
          event_id: eventId,
          people_met: updated.peopleMet,
          projects: updated.projects,
          ideas: updated.ideas,
          followups: updated.followups,
          takeaways: updated.takeaways,
          content_idea: updated.contentIdea,
          photos: updated.photos,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error('Failed to sync note to Supabase:', e);
      }
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  return {
    events,
    notes,
    selectedEventId,
    selectedEvent,
    activeTab,
    filters,
    activeDateFilter,
    setSelectedEventId,
    setActiveTab,
    setFilters,
    setActiveDateFilter,
    updateEventStatus,
    saveEventNote,
  };
}
