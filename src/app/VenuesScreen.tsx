import React, { useMemo, useState } from 'react';
import { ChevronRight, HelpCircle, MapPin, Navigation } from 'lucide-react';
import type { EventItem } from '../types/event';
import { EventRow, GroupedList } from './ui';
import { dayLabel, directionsUrl, hasEnded, sortByStart, VENUE_TBA, type AppTab } from './time';

interface VenuesScreenProps {
  events: EventItem[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  onOpenEvent: (id: string) => void;
  goTo: (tab: AppTab) => void;
}

interface Venue {
  key: string;
  name: string;
  address?: string;
  events: EventItem[];
  sample: EventItem; // used for the map query and directions
}

// The convention centre sits inside the Jio World Centre complex.
const ALIASES: Record<string, string> = { 'Jio World Convention Centre': 'Jio World Centre' };

function venueName(location: string): string {
  const first = location.split(',')[0].trim();
  return ALIASES[first] ?? first;
}

export const VenuesScreen: React.FC<VenuesScreenProps> = ({ events, isSaved, toggleSaved, onOpenEvent, goTo }) => {
  const { venues, tbaCount } = useMemo(() => {
    const map = new Map<string, Venue>();
    let tba = 0;
    for (const e of events) {
      if (e.location === VENUE_TBA) {
        tba += 1;
        continue;
      }
      const name = venueName(e.location);
      const v = map.get(name) ?? { key: name, name, address: e.address, events: [], sample: e };
      v.events.push(e);
      // Prefer an event that carries real coordinates or a map link for directions.
      if (!v.sample.mapUrl && e.mapUrl) v.sample = e;
      map.set(name, v);
    }
    const list = [...map.values()].map((v) => ({ ...v, events: v.events.sort(sortByStart) }));
    // Biggest venues first; ties broken by whichever hosts something sooner.
    list.sort((a, b) => b.events.length - a.events.length || sortByStart(a.events[0], b.events[0]));
    return { venues: list, tbaCount: tba };
  }, [events]);

  const [selectedKey, setSelectedKey] = useState<string | null>(() => venues[0]?.key ?? null);
  const selected = venues.find((v) => v.key === selectedKey) ?? venues[0];
  const mapQuery = selected ? `${selected.name}, ${selected.address ?? 'Mumbai'}` : 'Mumbai';

  return (
    <div className="pb-6">
      <header className="px-5 pt-3 pb-4">
        <h1 className="app-title text-[30px] font-bold">Venues</h1>
        <p className="text-[15px] text-[var(--app-muted)]">
          {venues.length} confirmed venues across Mumbai
        </p>
      </header>

      {selected && (
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden border border-[var(--app-line)] bg-[var(--app-surface)]">
          <iframe
            key={selected.key}
            title={`Map of ${selected.name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
            className="w-full h-52 border-0 block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold truncate">{selected.name}</div>
              {selected.address && <div className="text-[14px] text-[var(--app-muted)] truncate">{selected.address}</div>}
            </div>
            <a
              href={directionsUrl(selected.sample)}
              target="_blank"
              rel="noopener noreferrer"
              className="app-press shrink-0 h-10 px-4 rounded-full bg-[var(--app-ink)] text-white text-[15px] font-semibold inline-flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" /> Go
            </a>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {venues.map((v) => {
          const isOpen = v.key === selected?.key;
          const upcoming = v.events.filter((e) => !hasEnded(e));
          const next = upcoming[0];
          return (
            <div key={v.key} className="mx-4 rounded-2xl overflow-hidden border border-[var(--app-line)] bg-[var(--app-surface)]">
              <button
                type="button"
                onClick={() => {
                  setSelectedKey(v.key);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-expanded={isOpen}
                className="app-press w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F7F6F2]"
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isOpen ? 'bg-[var(--app-ink)] text-white' : 'bg-[var(--app-bg)]'
                  }`}
                >
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold truncate">{v.name}</span>
                  <span className="block text-[14px] text-[var(--app-muted)] truncate">
                    {v.events.length} event{v.events.length === 1 ? '' : 's'}
                    {next ? ` · next ${dayLabel(next.startDate)}` : ' · all done'}
                  </span>
                </span>
                {!isOpen && <ChevronRight className="w-4 h-4 text-[var(--app-faint)]" aria-hidden="true" />}
              </button>
              {isOpen && (
                <div className="border-t border-[var(--app-line)] divide-y divide-[var(--app-line)]">
                  {v.events.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      saved={isSaved(e.id)}
                      onToggleSave={() => toggleSaved(e.id)}
                      onOpen={() => onOpenEvent(e.id)}
                      showDate={dayLabel(e.startDate)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tbaCount > 0 && (
        <div className="mt-6">
          <GroupedList>
            <button
              type="button"
              onClick={() => goTo('schedule')}
              className="app-press w-full flex items-center gap-3 px-4 py-3.5 text-left bg-[var(--app-surface)] active:bg-[#F7F6F2]"
            >
              <span className="w-10 h-10 rounded-xl bg-[var(--app-bg)] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-[var(--app-muted)]" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[16px] font-semibold">Venue to be announced</span>
                <span className="block text-[14px] text-[var(--app-muted)]">
                  {tbaCount} events · see them in Schedule
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[var(--app-faint)]" aria-hidden="true" />
            </button>
          </GroupedList>
        </div>
      )}
    </div>
  );
};
