import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronDown, MapPin, MessagesSquare, Navigation, QrCode, ScanLine, CalendarPlus, ImageDown, UserPlus } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { CoverHero, EventRow, GroupedList, LiveDot, SaveButton, SectionHeader } from './ui';
import { BlankBadge, LanyardBadge, Mandala } from './Badge';
import { useStoryReplies } from '../lib/useStoryReplies';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { BellButton, NotificationsSheet, useReminders } from './NotificationsSheet';
import { StoriesRow } from './Stories';
import { eventCover } from './covers';
import {
  dayLabel,
  directionsUrl,
  endsAt,
  greeting,
  hasEnded,
  isLive,
  istDateKey,
  sortByStart,
  startsIn,
  WEEK_DAYS,
  type AppTab,
} from './time';


// "Your 3 events today", "… tomorrow", "… on Tue 3 Nov".
const dayWord = (label: string) => (label === 'Today' || label === 'Tomorrow' ? label.toLowerCase() : `on ${label}`);

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
  onFindProfile: () => void;
  onSaveCard: () => void;
  /** "Part of a community?" or "You joined …", under the quick actions. */
  communityCard?: React.ReactNode;
}

/**
 * Today is two pages: the badge on its own, then the feed starting at
 * Stories. A short scroll between them glides the rest of the way, down to
 * Stories or back up to the badge; below Stories it scrolls freely.
 * Returns a function that jumps to the feed.
 */
function useHeroSnap(feedRef: React.RefObject<HTMLElement | null>, paused: React.RefObject<boolean>) {
  const feedTop = () => {
    const el = feedRef.current;
    if (!el) return 0;
    const main = el.closest('main');
    const pad = main ? parseFloat(getComputedStyle(main).paddingTop) || 0 : 0;
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY - pad);
  };
  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') as ScrollBehavior;

  useEffect(() => {
    let timer = 0;
    let touching = false;
    let gliding = false;
    let lastY = window.scrollY;
    let direction = 0;

    const settle = () => {
      const el = feedRef.current;
      // Only on Today: other tabs keep this screen mounted but hidden.
      // Paused while the badge shows its QR, so they can scroll freely to Save card.
      if (!el || el.offsetParent === null || touching || gliding || paused.current) return;
      const y = window.scrollY;
      const top = feedTop();
      if (y <= 2 || y >= top - 2) return;
      const target = direction > 0 ? (y > 24 ? top : 0) : y < top - 24 ? 0 : top;
      gliding = true;
      window.scrollTo({ top: target, behavior: smooth() });
      window.setTimeout(() => (gliding = false), 600);
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 140);
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) direction = y > lastY ? 1 : -1;
      lastY = y;
      schedule();
    };
    const onTouchStart = () => {
      touching = true;
      window.clearTimeout(timer);
    };
    const onTouchEnd = () => {
      touching = false;
      schedule();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // feedTop reads the ref at call time; the listeners never need replacing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return () => window.scrollTo({ top: feedTop(), behavior: smooth() });
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
  goTo,
  myProfile,
  people,
  onShowPass,
  onScan,
  onAddSnap,
  onAsk,
  onCreateProfile,
  onSelectPerson,
  onFindProfile,
  onSaveCard,
  communityCard,
}) => {
  const now = useNow();
  const today = istDateKey(now);
  const firstName = myProfile?.name?.split(' ')[0];

  const sorted = useMemo(() => [...events].sort(sortByStart), [events]);
  const liveNow = sorted.filter((e) => isLive(e, now) && e.startDate === e.endDate);
  const liveMultiDay = sorted.filter((e) => isLive(e, now) && e.startDate !== e.endDate);
  const upcoming = sorted.filter((e) => !hasEnded(e, now) && !isLive(e, now));
  const mine = upcoming.filter((e) => isSaved(e.id));
  // Lead with the user's own events that day, to swipe through; fall back to
  // what's next in the city.
  const nextIsMine = Boolean(mine[0]);
  const nextUp = nextIsMine ? mine.filter((e) => e.startDate === mine[0].startDate) : upcoming.slice(0, 1);
  const [slide, setSlide] = useState(0);

  const weekIndex = WEEK_DAYS.indexOf(today);

  const others = people.filter((p) => p.id !== myProfile?.id);
  const feedRef = useRef<HTMLElement>(null);
  // Flipped to the QR: free scrolling instead of the jump between badge and feed.
  const [badgeFlipped, setBadgeFlipped] = useState(false);
  const snapPaused = useRef(false);
  useEffect(() => {
    snapPaused.current = badgeFlipped;
  }, [badgeFlipped]);
  const scrollToFeed = useHeroSnap(feedRef, snapPaused);
  const [notesOpen, setNotesOpen] = useState(false);
  // People who added you, by name, for the bell.
  const { addedMe } = usePeopleStore();
  const addedBy = useMemo(
    () =>
      addedMe.flatMap((a) => {
        const p = people.find((x) => x.id === a.profileId);
        return p ? [{ personId: p.id, name: p.name, avatar: p.avatar, role: p.category, at: a.createdAt }] : [];
      }),
    [addedMe, people]
  );
  // Replies to your stories, for the bell.
  const { replies } = useStoryReplies();
  const { recentSnaps } = useSnapStore();
  const repliedBy = useMemo(
    () =>
      replies.map((r) => {
        const p = people.find((x) => x.id === r.fromProfileId);
        const snap = recentSnaps.find((s) => s.id === r.snapId);
        return {
          id: r.id,
          personId: r.fromProfileId,
          name: p?.name ?? 'Someone',
          avatar: p?.avatar,
          role: p?.category,
          at: r.createdAt,
          body: r.body,
          thumb: snap ? snap.thumbnailUrl || snap.imageUrl : undefined,
        };
      }),
    [replies, people, recentSnaps]
  );
  const { reminders, older: olderNotes, unread, markSeen } = useReminders(events, isSaved, Boolean(myProfile), now, addedBy, repliedBy);
  // What was unread when the bell was tapped: the New section.
  const [freshNotes, setFreshNotes] = useState<Set<string>>(() => new Set());

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="px-5 pt-3 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="app-label">
            {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
            {weekIndex >= 0 ? ` · Day ${weekIndex + 1} of ${WEEK_DAYS.length}` : ''}
          </p>
          <h1 className="app-title text-[30px] leading-tight mt-0.5">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <BellButton
          unread={unread}
          onClick={() => {
            setFreshNotes(markSeen());
            setNotesOpen(true);
          }}
        />
      </header>

      {/* Badge on its lanyard: tap to spin it round to the QR */}
      {/* Fills the first screen on its own; the rest of Today is a scroll away. */}
      <section
        aria-label="Your badge"
        className="relative overflow-x-clip mb-6 flex flex-col items-center justify-center min-h-[calc(100dvh-env(safe-area-inset-top)-var(--app-tabbar-pad)-var(--app-tabbar-h)-112px)]"
      >
        <Mandala className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] z-[-1] pointer-events-none" />
        {myProfile ? (
          <>
            <LanyardBadge person={myProfile} size="lg" flipped={badgeFlipped} onFlip={setBadgeFlipped} />
            {/* Same height either way, so flipping never shifts the page: the
                hint on the front, Save card once they're looking at their QR. */}
            <div className="mt-3 h-10 flex items-center justify-center">
              {badgeFlipped ? (
                <button
                  type="button"
                  onClick={onSaveCard}
                  className="app-press h-10 px-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[14px] font-semibold inline-flex items-center gap-2"
                >
                  <ImageDown className="w-4 h-4 text-[var(--app-primary)]" aria-hidden="true" />
                  Save card
                </button>
              ) : (
                <p className="text-center text-[13px] text-[var(--app-muted)]">Tap your badge to show your QR</p>
              )}
            </div>
          </>
        ) : (
          <>
            <BlankBadge onCreate={onCreateProfile} />
            <button
              type="button"
              onClick={onFindProfile}
              className="mt-3 h-10 px-3 text-[14px] font-semibold text-[var(--app-primary)]"
            >
              Made a profile on the website before?
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => scrollToFeed()}
          className="app-press mt-2 h-10 px-4 rounded-full inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--app-muted)]"
        >
          Stories and your plan <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </section>

      {/* Stories from snaps, first thing below the badge */}
      <section ref={feedRef} aria-label="Stories" className="mb-6 pt-2">
        <SectionHeader title="Stories" />
        <StoriesRow onAddSnap={onAddSnap} onOpenPerson={onSelectPerson} />
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="mb-7 px-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Share pass', icon: QrCode, onClick: myProfile ? onShowPass : onCreateProfile },
          { label: 'Scan', icon: ScanLine, onClick: onScan },
          { label: 'Add snap', icon: Camera, onClick: onAddSnap },
          { label: 'Ask', icon: MessagesSquare, onClick: onAsk },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="app-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)]"
          >
            <Icon className="w-[22px] h-[22px] text-[var(--app-primary)]" strokeWidth={1.9} aria-hidden="true" />
            <span className="text-[13px] font-semibold">{label}</span>
          </button>
        ))}
      </section>

      {communityCard}

      <NotificationsSheet
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        reminders={reminders}
        older={olderNotes}
        fresh={freshNotes}
        onOpenEvent={onOpenEvent}
        onCreateProfile={onCreateProfile}
        onOpenPerson={onSelectPerson}
      />

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
      {nextUp.length > 0 && (
        <section className="mb-7" aria-roledescription={nextUp.length > 1 ? 'carousel' : undefined}>
          <SectionHeader title={!nextIsMine ? 'Next in Mumbai' : nextUp.length > 1 ? `Your ${nextUp.length} events ${dayWord(dayLabel(nextUp[0].startDate, today))}` : 'Your next event'} />
          <div
            className="app-scroll-x flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scroll-px-4"
            onScroll={(e) => {
              const el = e.currentTarget;
              const card = el.firstElementChild as HTMLElement | null;
              if (card) setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
            }}
          >
            {nextUp.map((next) => (
              <div
                key={next.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenEvent(next.id)}
                onKeyDown={(e) => e.key === 'Enter' && onOpenEvent(next.id)}
                className={`app-press snap-start shrink-0 ${nextUp.length > 1 ? 'w-[88%]' : 'w-full'} rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] overflow-hidden cursor-pointer`}
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
            ))}
          </div>
          {nextUp.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
              {nextUp.map((e, i) => (
                <span key={e.id} className={`h-1.5 rounded-full transition-all ${i === Math.min(slide, nextUp.length - 1) ? 'w-4 bg-[var(--app-ink)]' : 'w-1.5 bg-[var(--app-faint)]'}`} />
              ))}
            </div>
          )}
        </section>
      )}

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
            <CalendarPlus className="w-7 h-7 mx-auto text-[var(--app-primary)]" aria-hidden="true" />
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
            className="app-press mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-2xl bg-[var(--app-primary-soft)] text-left"
          >
            <UserPlus className="w-6 h-6 text-[var(--app-primary)] shrink-0" aria-hidden="true" />
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
