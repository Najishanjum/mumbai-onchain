import React, { useEffect, useMemo, useState } from 'react';
import { Camera, MapPin, Navigation, QrCode, ScanLine, Sparkles, CalendarPlus, UserPlus } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { CoverHero, EventRow, GroupedList, LiveDot, SaveButton, SectionHeader } from './ui';
import { eventCover } from './covers';
import {
  dayLabel,
  dayNumber,
  directionsUrl,
  endsAt,
  eventDays,
  greeting,
  hasEnded,
  isLive,
  istDateKey,
  sortByStart,
  startsIn,
  weekdayShort,
  WEEK_DAYS,
  WEEK_START,
  type AppTab,
} from './time';


interface TodayScreenProps {
  events: EventItem[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  onOpenEvent: (id: string) => void;
  onOpenDay: (dateKey: string) => void;
  goTo: (tab: AppTab) => void;
  myProfile: PersonProfile | null;
  people: PersonProfile[];
  onShowPass: () => void;
  onScan: () => void;
  onAddSnap: () => void;
  onAsk: () => void;
  onCreateProfile: () => void;
  onSelectPerson: (id: string) => void;
}

/** Re-renders every minute so "in 25 min" and live badges stay true. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  events,
  isSaved,
  toggleSaved,
  onOpenEvent,
  onOpenDay,
  goTo,
  myProfile,
  people,
  onShowPass,
  onScan,
  onAddSnap,
  onAsk,
  onCreateProfile,
  onSelectPerson,
}) => {
  const now = useNow();
  const today = istDateKey(now);
  const firstName = myProfile?.name?.split(' ')[0];

  const sorted = useMemo(() => [...events].sort(sortByStart), [events]);
  const liveNow = sorted.filter((e) => isLive(e, now) && e.startDate === e.endDate);
  const liveMultiDay = sorted.filter((e) => isLive(e, now) && e.startDate !== e.endDate);
  const upcoming = sorted.filter((e) => !hasEnded(e, now) && !isLive(e, now));
  const mine = upcoming.filter((e) => isSaved(e.id));
  // Lead with the user's own next event; fall back to what's next in the city.
  const next = mine[0] ?? upcoming[0];
  const nextIsMine = Boolean(mine[0]);

  const countByDay = useMemo(() => {
    const m = new Map<string, { all: number; saved: number }>();
    for (const e of events) {
      for (const d of eventDays(e)) {
        const c = m.get(d) ?? { all: 0, saved: 0 };
        c.all += 1;
        if (isSaved(e.id)) c.saved += 1;
        m.set(d, c);
      }
    }
    return m;
  }, [events, isSaved]);

  const daysToWeek = Math.ceil(
    (new Date(`${WEEK_START}T00:00:00+05:30`).getTime() - now.getTime()) / 86_400_000
  );
  const weekIndex = WEEK_DAYS.indexOf(today);
  const weekStatus =
    weekIndex >= 0
      ? `Day ${weekIndex + 1} of ${WEEK_DAYS.length}`
      : daysToWeek > 0
        ? `Starts in ${daysToWeek} day${daysToWeek === 1 ? '' : 's'}`
        : 'That’s a wrap. See you next year';

  const others = people.filter((p) => p.id !== myProfile?.id);

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="px-5 pt-3 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[var(--app-muted)]">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
          </p>
          <h1 className="app-title text-[30px] font-bold leading-tight mt-0.5">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => goTo('me')}
          aria-label="Your profile"
          className="app-press mt-1 shrink-0 rounded-full overflow-hidden"
        >
          {myProfile ? (
            <PersonAvatar name={myProfile.name} avatarUrl={myProfile.avatar} size="md" className="rounded-full! border-0! w-10! h-10!" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[var(--app-muted)]" />
            </span>
          )}
        </button>
      </header>

      {/* Week strip */}
      <section aria-label="Mumbai Onchain Week" className="mb-7">
        <div className="px-5 mb-2.5 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">Mumbai Onchain Week</span>
          <span className="text-[14px] text-[var(--app-muted)]">{weekStatus}</span>
        </div>
        <div className="app-scroll-x flex gap-2 overflow-x-auto px-5 pb-1">
          {WEEK_DAYS.map((d) => {
            const c = countByDay.get(d);
            const isToday = d === today;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onOpenDay(d)}
                aria-label={`${dayLabel(d, today)}: ${c?.all ?? 0} events${c?.saved ? `, ${c.saved} saved` : ''}`}
                className={`app-press shrink-0 w-[54px] rounded-2xl py-2.5 flex flex-col items-center gap-1 border ${
                  isToday
                    ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]'
                    : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                }`}
              >
                <span className={`text-[12px] font-medium ${isToday ? 'text-[var(--app-on-primary)]/70' : 'text-[var(--app-muted)]'}`}>
                  {weekdayShort(d)}
                </span>
                <span className="text-[19px] font-bold leading-none">{dayNumber(d)}</span>
                <span className="flex gap-0.5 h-1.5 items-center" aria-hidden="true">
                  {c?.saved ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-saved)]" />
                  ) : c?.all ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-[var(--app-on-primary)]/50' : 'bg-[var(--app-faint)]'}`} />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Happening now */}
      {liveNow.length > 0 && (
        <section className="mb-7">
          <div className="px-5 mb-2.5 flex items-center gap-2">
            <LiveDot />
            <h2 className="app-title text-[20px] font-bold">Happening now</h2>
          </div>
          <GroupedList>
            {liveNow.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                saved={isSaved(e.id)}
                onToggleSave={() => toggleSaved(e.id)}
                onOpen={() => onOpenEvent(e.id)}
              />
            ))}
          </GroupedList>
        </section>
      )}

      {/* Up next */}
      {next && (
        <section className="mb-7">
          <SectionHeader title={nextIsMine ? 'Your next event' : 'Next in Mumbai'} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenEvent(next.id)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenEvent(next.id)}
            className="app-press mx-4 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] overflow-hidden cursor-pointer"
          >
            <CoverHero src={eventCover(next)} title={next.title} height={190} />
            <div className="p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--app-live)]">
                <span>{dayLabel(next.startDate, today)}</span>
                <span aria-hidden="true">·</span>
                <span>{next.startTime === 'TBA' ? 'Time TBA' : next.startTime}</span>
                {startsIn(next, now) && (
                  <span className="ml-auto text-[13px] font-semibold px-2 py-0.5 rounded-full bg-[var(--app-live-soft)]">
                    {startsIn(next, now)}
                  </span>
                )}
              </div>
              <h3 className="app-title mt-1.5 text-[22px] font-bold leading-tight">{next.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-[15px] text-[var(--app-muted)]">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{next.location}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <a
                  href={directionsUrl(next)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="app-press flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" />
                  Directions
                </a>
                <SaveButton saved={isSaved(next.id)} onToggle={() => toggleSaved(next.id)} title={next.title} size="lg" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section aria-label="Quick actions" className="mb-7 px-4 grid grid-cols-4 gap-2">
        {[
          { label: 'My pass', icon: QrCode, onClick: myProfile ? onShowPass : onCreateProfile },
          { label: 'Scan', icon: ScanLine, onClick: onScan },
          { label: 'Add snap', icon: Camera, onClick: onAddSnap },
          { label: 'Ask', icon: Sparkles, onClick: onAsk },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="app-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)]"
          >
            <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} aria-hidden="true" />
            <span className="text-[13px] font-medium">{label}</span>
          </button>
        ))}
      </section>

      {/* Your plan */}
      <section className="mb-7">
        <SectionHeader
          title="Your plan"
          action={mine.length > 0 ? 'Schedule' : undefined}
          onAction={() => goTo('schedule')}
        />
        {mine.length > 0 ? (
          <GroupedList>
            {mine.slice(0, 4).map((e) => (
              <EventRow
                key={e.id}
                event={e}
                saved
                onToggleSave={() => toggleSaved(e.id)}
                onOpen={() => onOpenEvent(e.id)}
                showDate={dayLabel(e.startDate, today)}
              />
            ))}
          </GroupedList>
        ) : (
          <div className="mx-4 rounded-2xl border border-dashed border-[var(--app-line)] bg-[var(--app-surface)] p-5 text-center">
            <CalendarPlus className="w-7 h-7 mx-auto text-[var(--app-saved)]" aria-hidden="true" />
            <p className="mt-2 text-[16px] font-semibold">Build your week</p>
            <p className="mt-1 text-[15px] text-[var(--app-muted)]">
              Save events and they show up here, with what's next first.
            </p>
            <button
              type="button"
              onClick={() => goTo('schedule')}
              className="app-press mt-4 h-11 px-6 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold"
            >
              Browse {events.length} events
            </button>
          </div>
        )}
        {liveMultiDay.length > 0 && (
          <p className="px-5 mt-3 text-[14px] text-[var(--app-muted)]">
            Also on: {liveMultiDay.map((e) => `${e.title} (${endsAt(e) ?? 'all day'})`).join(', ')}
          </p>
        )}
      </section>

      {/* People */}
      <section>
        <SectionHeader title="People" action={others.length > 0 ? 'See all' : undefined} onAction={() => goTo('people')} />
        {!myProfile && (
          <button
            type="button"
            onClick={onCreateProfile}
            className="app-press mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-2xl bg-[var(--app-saved-soft)] text-left"
          >
            <UserPlus className="w-6 h-6 text-[var(--app-saved)] shrink-0" aria-hidden="true" />
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Create your profile</span>
              <span className="block text-[14px] text-[var(--app-muted)]">So people you meet can find and add you.</span>
            </span>
          </button>
        )}
        {others.length > 0 && (
          <div className="app-scroll-x flex gap-3 overflow-x-auto px-5 pb-1">
            {others.slice(0, 12).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPerson(p.id)}
                className="app-press shrink-0 w-[68px] flex flex-col items-center gap-1.5"
              >
                <PersonAvatar name={p.name} avatarUrl={p.avatar} size="lg" className="rounded-full! border-0!" />
                <span className="text-[13px] font-medium w-full truncate text-center">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
