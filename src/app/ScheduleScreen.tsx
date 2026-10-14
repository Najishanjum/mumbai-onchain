import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, CalendarX } from 'lucide-react';
import type { EventItem } from '../types/event';
import { EventRow, GroupedList } from './ui';
import { dayLabel, dayNumber, eventDays, istDateKey, sortByStart, weekdayShort, WEEK_DAYS } from './time';

interface ScheduleScreenProps {
  events: EventItem[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  onOpenEvent: (id: string) => void;
  day: string;
  onDayChange: (day: string) => void;
}

type View = 'all' | 'mine';

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  events,
  isSaved,
  toggleSaved,
  onOpenEvent,
  day,
  onDayChange,
}) => {
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const today = istDateKey();
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Every day that has at least one event, plus the core week.
  const days = useMemo(() => {
    const s = new Set<string>(WEEK_DAYS);
    events.forEach((e) => eventDays(e).forEach((d) => s.add(d)));
    return [...s].sort();
  }, [events]);

  useEffect(() => {
    dayRefs.current[day]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [day]);

  const q = query.trim().toLowerCase();
  const matches = (e: EventItem) =>
    !q || [e.title, e.organizer, e.location, e.category].some((f) => f?.toLowerCase().includes(q));

  const pool = events.filter((e) => (view === 'mine' ? isSaved(e.id) : true)).filter(matches);
  // While searching, show matches across all days.
  const list = (q ? pool : pool.filter((e) => eventDays(e).includes(day))).sort(sortByStart);

  const savedCount = events.filter((e) => isSaved(e.id)).length;

  return (
    <div className="pb-6">
      {/* Sticky header: title, view toggle, day picker */}
      <div className="sticky top-[env(safe-area-inset-top)] z-20 bg-[var(--app-bg)]/95 backdrop-blur-md">
        <div className="px-5 pt-3 pb-3 flex items-center gap-3">
          {searching ? (
            <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)]">
              <Search className="w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
              <input
                id="schedule-search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Events, hosts, venues"
                aria-label="Search events"
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px]"
              />
            </div>
          ) : (
            <h1 className="app-title flex-1 text-[30px] font-bold">Schedule</h1>
          )}
          <button
            type="button"
            onClick={() => {
              setSearching((s) => !s);
              setQuery('');
            }}
            aria-label={searching ? 'Close search' : 'Search events'}
            className="app-press w-10 h-10 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
          >
            {searching ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        <div className="px-5 pb-3">
          <div role="tablist" aria-label="Which events" className="grid grid-cols-2 p-1 rounded-xl bg-[#E8E6E0]">
            {(['all', 'mine'] as View[]).map((v) => (
              <button
                key={v}
                role="tab"
                type="button"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`h-8 rounded-lg text-[14px] font-semibold transition-colors ${
                  view === v ? 'bg-[var(--app-surface)] shadow-sm' : 'text-[var(--app-muted)]'
                }`}
              >
                {v === 'all' ? 'All events' : `My plan${savedCount ? ` (${savedCount})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {!q && (
          <div className="app-scroll-x flex gap-1.5 overflow-x-auto px-5 pb-3 border-b border-[var(--app-line)]">
            {days.map((d) => {
              const active = d === day;
              return (
                <button
                  key={d}
                  ref={(el) => {
                    dayRefs.current[d] = el;
                  }}
                  type="button"
                  onClick={() => onDayChange(d)}
                  aria-pressed={active}
                  aria-label={dayLabel(d, today)}
                  className={`app-press shrink-0 w-12 py-1.5 rounded-xl flex flex-col items-center ${
                    active ? 'bg-[var(--app-ink)] text-white' : d === today ? 'text-[var(--app-live)]' : ''
                  }`}
                >
                  <span className={`text-[11px] font-semibold uppercase ${active ? 'text-white/70' : 'text-[var(--app-muted)]'}`}>
                    {weekdayShort(d)}
                  </span>
                  <span className="text-[18px] font-bold leading-tight">{dayNumber(d)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4">
        {!q && (
          <p className="px-5 mb-2.5 text-[15px] font-semibold text-[var(--app-muted)]">
            {dayLabel(day, today)} · {list.length} event{list.length === 1 ? '' : 's'}
          </p>
        )}
        {list.length > 0 ? (
          <GroupedList>
            {list.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                saved={isSaved(e.id)}
                onToggleSave={() => toggleSaved(e.id)}
                onOpen={() => onOpenEvent(e.id)}
                showDate={q ? dayLabel(e.startDate, today) : undefined}
              />
            ))}
          </GroupedList>
        ) : (
          <div className="mx-4 mt-2 py-10 text-center">
            <CalendarX className="w-8 h-8 mx-auto text-[var(--app-faint)]" aria-hidden="true" />
            <p className="mt-3 text-[16px] font-semibold">
              {q ? 'No matching events' : view === 'mine' ? 'Nothing saved for this day' : 'No events this day'}
            </p>
            <p className="mt-1 text-[15px] text-[var(--app-muted)]">
              {q
                ? 'Try a venue, host or a shorter word.'
                : view === 'mine'
                  ? 'Tap the bookmark on any event to add it to your plan.'
                  : 'Pick another day above.'}
            </p>
            {view === 'mine' && !q && (
              <button
                type="button"
                onClick={() => setView('all')}
                className="app-press mt-4 h-10 px-5 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold"
              >
                See all events
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
