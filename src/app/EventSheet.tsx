import React, { useState } from 'react';
import { Bookmark, CalendarPlus, Camera, Check, Clock, ExternalLink, ListChecks, MapPin, Navigation, TramFront, Users } from 'lucide-react';
import { DEVCON_EVENT_ID } from '../lib/devconSessions';
import { formatDistance, nearestStations } from '../lib/nearestStation';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { canCheckIn, canVerify, isNearVenue, useCheckIns } from '../lib/useCheckIns';
import { downloadICSFile, getGoogleCalendarUrl } from '../lib/calendar';
import { detectPlatform } from '../lib/pwa';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { Chip, CoverHero, LiveDot, Sheet } from './ui';
import { eventCover } from './covers';
import { dayLabel, directionsUrl, hasEnded, isLive, startsIn, VENUE_TBA } from './time';

interface EventSheetProps {
  event: EventItem | null;
  onClose: () => void;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  people: PersonProfile[];
  onOpenPerson: (id: string) => void;
  /** Devcon 8's own event page opens its programme. */
  onOpenProgramme: () => void;
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

export const EventSheet: React.FC<EventSheetProps> = ({ event, onClose, isSaved, toggleSaved, people, onOpenPerson, onOpenProgramme }) => {
  const { getSnapsByEvent, setActiveSnapForViewer, setIsAddSnapModalOpen } = useSnapStore();
  const { myProfile, authUser, connections } = usePeopleStore();
  const { mine, hereAt, checkIn, leave } = useCheckIns(authUser?.id ?? null);
  const [hereBusy, setHereBusy] = useState<false | 'locating' | 'saving'>(false);
  const [hereError, setHereError] = useState('');
  if (!event) return null;

  const saved = isSaved(event.id);
  const live = isLive(event);
  const ended = !live && hasEnded(event);
  const going = people.filter((p) => p.attendingEvents?.includes(event.id));
  const imHere = mine?.eventId === event.id;
  const canHere = canCheckIn(event);
  // People you follow first, then newest check-ins.
  const checkIns = hereAt(event.id);
  const here = checkIns
    .map((c) => people.find((p) => p.id === c.profileId))
    .filter((p): p is PersonProfile => Boolean(p))
    .sort((a, b) => Number(connections[b.id] === 'CONNECTED') - Number(connections[a.id] === 'CONNECTED'));
  const verifiable = canVerify(event);

  async function toggleHere() {
    if (!event || !myProfile) return;
    setHereError('');
    if (imHere) {
      setHereBusy('saving');
      await leave();
    } else {
      // Events with a pin need you at the venue; one location reading, not saved.
      // Venue TBA has nothing to check against, so it takes your word.
      if (verifiable) {
        setHereBusy('locating');
        const where = await isNearVenue(event);
        if (where !== 'near') {
          setHereError(where === 'far' ? 'You’re not at the venue yet. Check in when you get there.' : 'Allow location to check in.');
          setHereBusy(false);
          return;
        }
      }
      setHereBusy('saving');
      setHereError((await checkIn(event, myProfile.id, verifiable)) ?? '');
    }
    setHereBusy(false);
  }
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
              {/* Getting there without traffic: the closest metro and local train. */}
              {venueKnown && event.latitude != null && event.longitude != null && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[14px] text-[var(--app-muted)]">
                  {nearestStations(event.latitude, event.longitude).map(({ station, metres }) => (
                    <span key={station.kind} className="inline-flex items-center gap-1">
                      <TramFront className="w-3.5 h-3.5" aria-hidden="true" />
                      {station.name} {station.kind === 'metro' ? 'metro' : 'station'} · {formatDistance(metres)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {/* Ended and not saved: nothing to plan for. Saved ones stay in the plan. */}
          {ended && !saved ? (
            <span className="h-12 rounded-full bg-[var(--app-segment)] text-[15px] font-semibold text-[var(--app-muted)] inline-flex items-center justify-center">
              Ended
            </span>
          ) : (
            <button
              type="button"
              onClick={() => toggleSaved(event.id)}
              aria-pressed={saved}
              className={`app-press h-12 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
                saved ? 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
              }`}
            >
              <Bookmark className="w-[18px] h-[18px]" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
              {saved ? (ended ? 'Saved · Ended' : 'In your plan') : 'Save'}
            </button>
          )}
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
        {event.id === DEVCON_EVENT_ID && (
          <button
            type="button"
            onClick={onOpenProgramme}
            className="app-press mt-2 w-full h-12 rounded-full bg-[var(--app-primary-soft)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <ListChecks className="w-[18px] h-[18px]" aria-hidden="true" /> Programme · talks and workshops
          </button>
        )}

        {(canHere || here.length > 0) && (
          <section className="mt-7">
            <h3 className="app-label">Here now{here.length ? ` · ${here.length}` : ''}</h3>
            {canHere &&
              (myProfile && authUser ? (
                <>
                  <button
                    type="button"
                    onClick={toggleHere}
                    disabled={hereBusy !== false}
                    aria-pressed={imHere}
                    className={`app-press mt-2 w-full h-12 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
                      imHere ? 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
                    }`}
                  >
                    {imHere ? <Check className="w-[18px] h-[18px]" aria-hidden="true" /> : <MapPin className="w-[18px] h-[18px]" aria-hidden="true" />}
                    {hereBusy === 'locating'
                      ? 'Checking you’re there…'
                      : imHere
                        ? 'You’re here · tap to leave'
                        : 'I’m here'}
                  </button>
                  {hereError && <p className="mt-1.5 text-[14px] text-[var(--app-live)]">{hereError}</p>}
                </>
              ) : (
                <p className="mt-2 text-[15px] text-[var(--app-muted)]">Make your pass to check in and see who’s in the room.</p>
              ))}
            {here.length > 0 ? (
              <div className="mt-2 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
                {here.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPerson(p.id)}
                    className="app-press w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--app-pressed)]"
                  >
                    <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-semibold truncate">
                        {p.name}
                        {p.id === myProfile?.id && <span className="font-normal text-[var(--app-muted)]"> (you)</span>}
                      </span>
                      <span className="block text-[13px] text-[var(--app-muted)] truncate">
                        {connections[p.id] === 'CONNECTED' ? 'You follow them' : p.headline || p.category}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[15px] text-[var(--app-muted)]">Nobody has checked in yet.</p>
            )}
          </section>
        )}

        {event.description && (
          <section className="mt-7">
            <h3 className="app-label">About</h3>
            <p className="mt-2 text-[16px] leading-relaxed">{event.description}</p>
          </section>
        )}

        {event.devconTracks && event.devconTracks.length > 0 && (
          <section className="mt-7">
            <h3 className="app-label">Tracks</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {event.devconTracks.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h3 className="app-label">
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
            <h3 className="app-label">Snaps</h3>
            <button
              type="button"
              onClick={() => setIsAddSnapModalOpen(true, event.id)}
              className="text-[15px] font-medium text-[var(--app-primary)] inline-flex items-center gap-1"
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
