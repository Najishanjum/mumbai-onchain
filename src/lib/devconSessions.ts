import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import type { EventItem } from '../types/event';

// Devcon 8's programme (devcon_sessions, kept current by the devcon-sync
// function). The list is cached on the phone so the programme opens at once
// and works with a bad signal; summaries load when a session is opened.
// A saved session is an event id 'dc-<code>', so My plan and the 15-minute
// reminder treat it like any other event.

export const DEVCON_EVENT_ID = 'devcon-8-india';
export const SESSION_PREFIX = 'dc-';
export const DEVCON_DAYS = ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];

export interface Speaker {
  name: string;
  avatar?: string;
  x?: string;
}

export interface DevconSession {
  code: string;
  day: string;
  starts_at: string;
  ends_at: string;
  room: string;
  format: string;
  track: string;
  level: string;
  title: string;
  speakers: Speaker[];
  tags: string[];
  url: string;
}

export interface SessionDetails {
  summary: string;
  description: string;
  slides: string;
}

const COLUMNS = 'code, day, starts_at, ends_at, room, format, track, level, title, speakers, tags, url';
const KEY = 'mo_devcon_sessions_v1';
// The function syncs every 30 minutes; checking more often wouldn't find more.
const FRESH_MS = 15 * 60 * 1000;

const cached = read();
let sessions: DevconSession[] = cached.rows;
let fetchedAt = cached.at;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function read(): { rows: DevconSession[]; at: number } {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.rows) ? parsed : { rows: [], at: 0 };
  } catch {
    return { rows: [], at: 0 };
  }
}

function load(force = false) {
  const client = supabase;
  if (!client || loading || (!force && Date.now() - fetchedAt < FRESH_MS)) return;
  loading = (async () => {
    const { data, error } = await client.from('devcon_sessions').select(COLUMNS).order('starts_at').order('room').limit(2000);
    if (!error && data) {
      sessions = data as DevconSession[];
      fetchedAt = Date.now();
      try {
        localStorage.setItem(KEY, JSON.stringify({ rows: sessions, at: fetchedAt }));
      } catch {
        // shown this session anyway
      }
      listeners.forEach((l) => l());
    }
  })().finally(() => {
    loading = null;
  });
}

/** The whole programme, from the phone's copy first, refreshed when it's old. */
export function useDevconSessions(): DevconSession[] {
  useEffect(() => load(), []);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sessions
  );
}

export async function fetchSessionDetails(code: string): Promise<SessionDetails | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('devcon_sessions').select('summary, description, slides').eq('code', code).maybeSingle();
  return (data as SessionDetails | null) ?? null;
}

/** HH:mm at the venue. */
export function istTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kolkata' });
}

export const sessionEventId = (code: string) => SESSION_PREFIX + code;
export const isSessionId = (id: string) => id.startsWith(SESSION_PREFIX);

/** A session as an event, for My plan, saving and reminders. */
export function sessionToEvent(s: DevconSession, devcon?: EventItem): EventItem {
  return {
    id: sessionEventId(s.code),
    title: s.title,
    slug: sessionEventId(s.code),
    organizer: `Devcon 8 · ${s.room}`,
    category: 'Devcon',
    startDate: s.day,
    startTime: istTime(s.starts_at),
    endDate: s.day,
    endTime: istTime(s.ends_at),
    timezone: 'Asia/Kolkata',
    location: devcon?.location ?? 'Jio World Centre',
    address: devcon?.address,
    latitude: devcon?.latitude,
    longitude: devcon?.longitude,
    officialUrl: s.url || 'https://app.devcon.org/schedule',
    status: 'INTERESTED',
    priority: 'NORMAL',
    imageUrl: devcon?.imageUrl ?? '/images/devcon8-keyvisual.png',
    tags: s.tags,
  };
}
