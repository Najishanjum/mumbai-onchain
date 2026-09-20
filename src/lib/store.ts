import { useState, useEffect } from 'react';
import type { EventItem, UserEventNote, EventStatus, FilterState } from '../types/event';
import { INITIAL_EVENTS } from '../data/events';
import { supabase, isSupabaseConfigured } from './supabase';

const EVENTS_STORAGE_KEY = 'mumbai_onchain_week_events_v1';
const NOTES_STORAGE_KEY = 'mumbai_onchain_week_notes_v1';

export function useAppStore() {
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EVENTS;
  });

  const [notes, setNotes] = useState<Record<string, UserEventNote>>(() => {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('ALL');

  const [activeTab, setActiveTabState] = useState<'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('people') || hash.includes('people')) return 'people';
      if (path.includes('timeline') || hash.includes('timeline')) return 'timeline';
      if (path.includes('events') || hash.includes('events')) return 'events';
      if (path.includes('map') || hash.includes('map')) return 'map';
      if (path.includes('mymumbai') || path.includes('/me') || hash.includes('mymumbai') || hash.includes('me')) return 'mymumbai';
    }
    return 'home';
  });

  const setActiveTab = (tab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai') => {
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
      if (path.includes('people') || hash.includes('people')) setActiveTabState('people');
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

  // Load from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    async function loadFromSupabase() {
      if (!client) return;
      try {
        const { data: remoteEvents, error } = await client.from('events').select('*');
        if (!error && remoteEvents && remoteEvents.length > 0) {
          // Map DB fields to EventItem
          const mappedEvents: EventItem[] = remoteEvents.map(e => ({
            id: e.id,
            title: e.title,
            slug: e.slug,
            description: e.description,
            organizer: e.organizer,
            category: e.category,
            startDate: e.start_date,
            startTime: e.start_time,
            endDate: e.end_date,
            endTime: e.end_time,
            timezone: e.timezone || 'Asia/Kolkata',
            location: e.location,
            address: e.address,
            latitude: e.latitude,
            longitude: e.longitude,
            officialUrl: e.official_url,
            mapUrl: e.map_url,
            status: e.status,
            priority: e.priority || 'NORMAL',
            isPrimary: e.is_primary || false,
            devconTracks: e.devcon_tracks,
          }));
          setEvents(mappedEvents);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to cached state:', err);
      }
    }

    loadFromSupabase();
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
