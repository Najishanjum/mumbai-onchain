import React from 'react';
import { Bookmark, CalendarPlus, Camera, Clock, ExternalLink, MapPin, Navigation, Users } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import { useSnapStore } from '../lib/useSnapStore';
import { downloadICSFile, getGoogleCalendarUrl } from '../lib/calendar';
import { detectPlatform } from '../lib/pwa';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { Chip, CoverHero, LiveDot, Sheet } from './ui';
import { eventCover } from './covers';
import { dayLabel, directionsUrl, isLive, startsIn, VENUE_TBA } from './time';

interface EventSheetProps {
  event: EventItem | null;
  onClose: () => void;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  people: PersonProfile[];
  onOpenPerson: (id: string) => void;
}


function whenLine(e: EventItem): string {
  const start = dayLabel(e.startDate);
  if (e.startDate !== e.endDate) return `${start} – ${dayLabel(e.endDate)}`;
  return start;
}

function timeLine(e: EventItem): string {
  if (e.startTime === 'TBA') return 'Time to be announced';
  const end = e.endTime && e.endTime !== 'TBA' ? `–${e.endTime}` : '';
  return `${e.startTime}${end} IST`;
}

function addToCalendar(e: EventItem) {
  // iOS hands .ics files straight to Calendar; elsewhere Google Calendar is the safer default.
  if (detectPlatform() === 'ios') downloadICSFile(e);
  else window.open(getGoogleCalendarUrl(e), '_blank', 'noopener,noreferrer');
}

export const EventSheet: React.FC<EventSheetProps> = ({ event, onClose, isSaved, toggleSaved, people, onOpenPerson }) => {
  const { getSnapsByEvent, setActiveSnapForViewer, setIsAddSnapModalOpen } = useSnapStore();
  if (!event) return null;

  const saved = isSaved(event.id);
  const live = isLive(event);
  const going = people.filter((p) => p.attendingEvents?.includes(event.id));
  const snaps = getSnapsByEvent(event.id).filter(isRealSnap);
  const venueKnown = event.location !== VENUE_TBA;

  return (
    <Sheet open onClose={onClose} label={event.title}>
      <div className="mx-4 mt-8 rounded-[22px] overflow-hidden border border-[var(--app-line)]">
        <CoverHero src={eventCover(event)} title={event.title} height={300} />
      </div>

      <div className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{event.category}</Chip>
          {live && (
            <Chip tone="live">
              <span className="mr-1.5 inline-flex">
                <LiveDot />
              </span>
              Happening now
            </Chip>
          )}
          {!live && startsIn(event) && <Chip tone="live">Starts {startsIn(event)}</Chip>}
        </div>

        <h2 className="app-title mt-3 text-[26px] font-bold leading-tight">{event.title}</h2>
        <p className="mt-1 text-[15px] text-[var(--app-muted)]">by {event.organizer}</p>

        <div className="mt-5 space-y-3">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 mt-0.5 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
            <div>
              <div className="text-[16px] font-semibold">{whenLine(event)}</div>
              <div className="text-[15px] text-[var(--app-muted)]">{timeLine(event)}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[16px] font-semibold">{venueKnown ? event.location : 'Venue to be announced'}</div>
              {venueKnown && event.address && event.address !== event.location && (
                <div className="text-[15px] text-[var(--app-muted)]">{event.address}</div>
              )}
              {!venueKnown && (
                <div className="text-[15px] text-[var(--app-muted)]">Check the event page for the latest details.</div>
              )}
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => toggleSaved(event.id)}
            aria-pressed={saved}
            className={`app-press h-12 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
              saved ? 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
            }`}
          >
            <Bookmark className="w-[18px] h-[18px]" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
            {saved ? 'In your plan' : 'Save'}
          </button>
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="app-press h-12 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-[18px] h-[18px]" aria-hidden="true" /> Register
          </a>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {venueKnown ? (
            <a
              href={directionsUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="app-press h-11 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-medium inline-flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" /> Directions
            </a>
          ) : (
            <span className="h-11 rounded-full border border-dashed border-[var(--app-line)] text-[15px] text-[var(--app-faint)] inline-flex items-center justify-center gap-2">
              <Navigation className="w-4 h-4" aria-hidden="true" /> No venue yet
            </span>
          )}
          <button
            type="button"
            onClick={() => addToCalendar(event)}
            className="app-press h-11 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-medium inline-flex items-center justify-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden="true" /> Calendar
          </button>
        </div>

        {event.description && (
          <section className="mt-7">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">About</h3>
            <p className="mt-2 text-[16px] leading-relaxed">{event.description}</p>
          </section>
        )}

        {event.devconTracks && event.devconTracks.length > 0 && (
          <section className="mt-7">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Tracks</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {event.devconTracks.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
            Going{going.length ? ` · ${going.length}` : ''}
          </h3>
          {going.length > 0 ? (
            <div className="mt-2 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
              {going.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPerson(p.id)}
                  className="app-press w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--app-pressed)]"
                >
                  <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold truncate">{p.name}</span>
                    <span className="block text-[13px] text-[var(--app-muted)] truncate">{p.headline || p.category}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-[15px] text-[var(--app-muted)]">
              <Users className="w-4 h-4" aria-hidden="true" /> Nobody has listed this on their pass yet.
            </p>
          )}
        </section>

        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Snaps</h3>
            <button
              type="button"
              onClick={() => setIsAddSnapModalOpen(true, event.id)}
              className="text-[15px] font-medium text-[var(--app-saved)] inline-flex items-center gap-1"
            >
              <Camera className="w-4 h-4" aria-hidden="true" /> Add
            </button>
          </div>
          {snaps.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {snaps.slice(0, 9).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSnapForViewer(s)}
                  aria-label={`Snap by ${s.authorName}`}
                  className="app-press aspect-square overflow-hidden rounded-lg bg-[var(--app-line)]"
                >
                  <img src={s.thumbnailUrl || s.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[15px] text-[var(--app-muted)]">No photos from this one yet.</p>
          )}
        </section>
      </div>
    </Sheet>
  );
};
