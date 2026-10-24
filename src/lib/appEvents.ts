import type { EventCategory, EventItem } from '../types/event';
import { supabase } from './supabase';

// Events admins add in the app (app_events), on top of the ones built into
// it. A row with a built-in event's id replaces that event; hidden removes it.

export const EVENT_CATEGORIES: EventCategory[] = ['Devcon', 'Ecosystem', 'Ethereum', 'Solana', 'Privacy', 'Security', 'DeFi', 'Networking', 'Hackathon', 'AI', 'Governance'];

export interface AppEventRow {
  id: string;
  title: string;
  description: string;
  organizer: string;
  category: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  official_url: string;
  image_url: string;
  source_url: string | null;
  priority: 'PRIMARY' | 'HIGH' | 'NORMAL';
  hidden: boolean;
  updated_at?: string;
}

export const APP_EVENT_COLUMNS =
  'id, title, description, organizer, category, start_date, start_time, end_date, end_time, location, address, latitude, longitude, official_url, image_url, source_url, priority, hidden, updated_at';

/** Admin → Events saved something: the schedule reloads. */
export const EVENTS_CHANGED = 'mo:events-changed';

const CACHE_KEY = 'mo_app_events_v1';

export function rowToEvent(r: AppEventRow, base?: EventItem): EventItem {
  return {
    ...base,
    id: r.id,
    slug: base?.slug ?? r.id,
    title: r.title,
    description: r.description || undefined,
    organizer: r.organizer,
    category: (EVENT_CATEGORIES.includes(r.category as EventCategory) ? r.category : 'Ecosystem') as EventCategory,
    startDate: r.start_date,
    startTime: r.start_time,
    endDate: r.end_date,
    endTime: r.end_time,
    timezone: 'Asia/Kolkata',
    location: r.location,
    address: r.address || undefined,
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
    officialUrl: r.official_url,
    imageUrl: r.image_url || base?.imageUrl,
    status: base?.status ?? 'INTERESTED',
    priority: r.priority,
  };
}

export function eventToRow(e: EventItem): Omit<AppEventRow, 'source_url' | 'hidden'> {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    organizer: e.organizer,
    category: e.category,
    start_date: e.startDate,
    start_time: e.startTime,
    end_date: e.endDate,
    end_time: e.endTime,
    location: e.location,
    address: e.address ?? '',
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
    official_url: e.officialUrl,
    image_url: e.imageUrl ?? '',
    priority: e.priority,
  };
}

/** Built-in events with the admins' changes on top. */
export function mergeEvents(builtIn: EventItem[], rows: AppEventRow[]): EventItem[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const merged = builtIn.filter((e) => !byId.get(e.id)?.hidden).map((e) => (byId.has(e.id) ? rowToEvent(byId.get(e.id)!, e) : e));
  const known = new Set(builtIn.map((e) => e.id));
  for (const r of rows) if (!known.has(r.id) && !r.hidden) merged.push(rowToEvent(r));
  return merged;
}

export function readCachedRows(): AppEventRow[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AppEventRow[]) : [];
  } catch {
    return [];
  }
}

/** The admins' rows from the database, cached so the next launch shows them at once. */
export async function fetchAppEventRows(): Promise<AppEventRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('app_events').select(APP_EVENT_COLUMNS);
  if (error) return null;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data ?? []));
  } catch {
    // shown this session anyway
  }
  return (data ?? []) as AppEventRow[];
}

/** A readable id for a new event: "afterhours-mixer-mumbai-x7k2". */
export function newEventId(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
