import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, MapPin, Plus, UserPlus, X } from 'lucide-react';
import type { Snap } from '../types/snap';
import type { PersonProfile } from '../types/person';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { roleColor } from './Badge';

const SEEN_KEY = 'mo_seen_snaps';
const STORY_MS = 5000;

interface Story {
  authorId: string;
  name: string;
  avatar?: string;
  role?: string;
  person?: PersonProfile;
  snaps: Snap[];
}

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

/** Snaps grouped by person, oldest first inside each story, unseen stories first. */
function useStories(seen: Set<string>) {
  const { recentSnaps } = useSnapStore();
  const { people, myProfile } = usePeopleStore();
  return useMemo(() => {
    const byAuthor = new Map<string, Story>();
    for (const s of recentSnaps.filter(isRealSnap)) {
      const person = people.find((p) => p.id === s.authorId) ?? (myProfile?.id === s.authorId ? myProfile : undefined);
      const story = byAuthor.get(s.authorId) ?? {
        authorId: s.authorId,
        name: person?.name ?? s.authorName,
        avatar: person?.avatar ?? s.authorAvatar,
        role: person?.category ?? s.authorRole,
        person,
        snaps: [],
      };
      story.snaps.push(s);
      byAuthor.set(s.authorId, story);
    }
    const stories = [...byAuthor.values()].map((st) => ({
      ...st,
      snaps: [...st.snaps].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
    const mine = stories.find((st) => st.authorId === myProfile?.id) ?? null;
    const others = stories
      .filter((st) => st.authorId !== myProfile?.id)
      .sort((a, b) => {
        const au = a.snaps.some((s) => !seen.has(s.id)) ? 0 : 1;
        const bu = b.snaps.some((s) => !seen.has(s.id)) ? 0 : 1;
        if (au !== bu) return au - bu;
        return b.snaps[b.snaps.length - 1].createdAt.localeCompare(a.snaps[a.snaps.length - 1].createdAt);
      });
    return { mine, others, myProfile };
  }, [recentSnaps, people, myProfile, seen]);
}

function Ring({ color, seen, children }: { color: string; seen: boolean; children: ReactNode }) {
  return (
    <span
      className="block rounded-full p-[3px]"
      style={{ background: seen ? 'var(--app-line)' : `conic-gradient(from 210deg, ${color}, color-mix(in srgb, ${color} 45%, #FFFFFF), ${color})` }}
    >
      <span className="block rounded-full p-[2px] bg-[var(--app-bg)]">{children}</span>
    </span>
  );
}

/**
 * Instagram-style stories from snaps: a row of rings (your own first, with a
 * + to add one), and a full-screen viewer that plays each person's snaps.
 */
export function StoriesRow({
  onAddSnap,
  onOpenPerson,
  className = '',
}: {
  onAddSnap: () => void;
  onOpenPerson: (id: string) => void;
  className?: string;
}) {
  const [seen, setSeen] = useState<Set<string>>(readSeen);
  const { mine, others, myProfile } = useStories(seen);
  const queue = useMemo(() => (mine ? [mine, ...others] : others), [mine, others]);
  // The queue is frozen while watching, so marking snaps seen does not reorder it.
  const [viewing, setViewing] = useState<{ queue: Story[]; start: number } | null>(null);
  const open = (story: Story) => setViewing({ queue, start: queue.indexOf(story) });

  const markSeen = (id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      } catch {
        // fine: rings just stay bright
      }
      return next;
    });
  };

  const bubble = 'app-press shrink-0 w-[72px] flex flex-col items-center gap-1.5';
  const allSeen = (st: Story) => st.snaps.every((s) => seen.has(s.id));

  return (
    <>
      <div className={`app-scroll-x flex gap-3 overflow-x-auto px-4 pb-1 ${className}`}>
        {/* Your story: add one, or watch your own */}
        <button
          type="button"
          onClick={() => (mine ? open(mine) : onAddSnap())}
          aria-label={mine ? 'Your story' : 'Add a snap to your story'}
          className={bubble}
        >
          <span className="relative">
            <Ring color="var(--app-primary)" seen={!mine || allSeen(mine)}>
              {myProfile ? (
                <PersonAvatar name={myProfile.name} avatarUrl={myProfile.avatar} size="lg" className="rounded-full! border-0! w-[58px]! h-[58px]!" />
              ) : (
                <span className="w-[58px] h-[58px] rounded-full bg-[var(--app-surface)] flex items-center justify-center" />
              )}
            </Ring>
            <span
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                onAddSnap();
              }}
              className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] border-2 border-[var(--app-bg)] flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
            </span>
          </span>
          <span className="text-[12px] font-semibold w-full truncate text-center">Your story</span>
        </button>

        {others.map((st) => (
          <button
            key={st.authorId}
            type="button"
            onClick={() => open(st)}
            aria-label={`${st.name}'s story, ${st.snaps.length} snap${st.snaps.length === 1 ? '' : 's'}`}
            className={bubble}
          >
            <Ring color={roleColor(st.role)} seen={allSeen(st)}>
              <PersonAvatar name={st.name} avatarUrl={st.avatar} size="lg" className="rounded-full! border-0! w-[58px]! h-[58px]!" />
            </Ring>
            <span className={`text-[12px] w-full truncate text-center ${allSeen(st) ? 'text-[var(--app-muted)]' : 'font-semibold'}`}>
              {st.name.split(' ')[0]}
            </span>
          </button>
        ))}

        {others.length === 0 && (
          <p className="self-center pl-1 pr-4 text-[14px] text-[var(--app-muted)] min-w-[200px]">
            Snaps people share show up here as stories.
          </p>
        )}
      </div>

      {viewing && viewing.queue[viewing.start] && (
        <StoryViewer
          queue={viewing.queue}
          start={viewing.start}
          isMine={(st) => st.authorId === myProfile?.id}
          onSeen={markSeen}
          onClose={() => setViewing(null)}
          onOpenPerson={(id) => {
            setViewing(null);
            onOpenPerson(id);
          }}
        />
      )}
    </>
  );
}

function StoryViewer({
  queue,
  start,
  isMine,
  onSeen,
  onClose,
  onOpenPerson,
}: {
  queue: Story[];
  start: number;
  isMine: (st: Story) => boolean;
  onSeen: (snapId: string) => void;
  onClose: () => void;
  onOpenPerson: (id: string) => void;
}) {
  const { getConnectionStatus, setConnectionStatus } = usePeopleStore();
  const [storyAt, setStoryAt] = useState(start);
  // Open each story at its first unseen snap, like Instagram.
  const [snapAt, setSnapAt] = useState(() => {
    const seen = readSeen();
    const i = queue[start].snaps.findIndex((s) => !seen.has(s.id));
    return i < 0 ? 0 : i;
  });
  const [paused, setPaused] = useState(false);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  const story = queue[storyAt];
  const snap = story?.snaps[snapAt];

  useEffect(() => {
    if (snap) onSeen(snap.id);
  }, [snap, onSeen]);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  });

  if (!story || !snap) return null;

  function next() {
    if (snapAt < story.snaps.length - 1) setSnapAt(snapAt + 1);
    else if (storyAt < queue.length - 1) {
      setStoryAt(storyAt + 1);
      setSnapAt(0);
    } else onClose();
  }
  function back() {
    if (snapAt > 0) setSnapAt(snapAt - 1);
    else if (storyAt > 0) {
      setStoryAt(storyAt - 1);
      setSnapAt(queue[storyAt - 1].snaps.length - 1);
    }
  }

  const mine = isMine(story);
  const connected = getConnectionStatus(story.authorId) === 'CONNECTED';
  const color = roleColor(story.role);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s story`}
      className="app fixed inset-0 z-[75] bg-black text-white flex flex-col select-none"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        setPaused(false);
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        const dy = e.changedTouches[0].clientY - t.y;
        if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return onClose();
        if (Math.abs(dx) > 60) return dx < 0 ? next() : back();
      }}
    >
      {/* Progress, one bar per snap */}
      <div className="absolute z-10 top-[calc(env(safe-area-inset-top)+8px)] inset-x-3 flex gap-1">
        {story.snaps.map((s, i) => (
          <span key={s.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
            {i < snapAt && <span className="block h-full w-full bg-white" />}
            {i === snapAt && (
              <span
                key={`${storyAt}-${snapAt}`}
                className="story-progress block h-full bg-white"
                style={{ animationDuration: `${STORY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                onAnimationEnd={next}
              />
            )}
          </span>
        ))}
      </div>

      {/* Who it is, and Connect */}
      <div className="absolute z-10 top-[calc(env(safe-area-inset-top)+20px)] inset-x-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onOpenPerson(story.authorId)}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          <span className="rounded-full p-[2px]" style={{ background: color }}>
            <PersonAvatar name={story.name} avatarUrl={story.avatar} size="md" className="rounded-full! border-0! w-9! h-9!" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold truncate">{mine ? 'Your story' : story.name}</span>
            <span className="block text-[12px] text-white/75 truncate">{snap.date}</span>
          </span>
        </button>
        {!mine && (
          <button
            type="button"
            onClick={() => setConnectionStatus(story.authorId, connected ? 'NOT_CONNECTED' : 'CONNECTED')}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            aria-pressed={connected}
            className={`app-press h-9 px-3.5 rounded-full text-[14px] font-bold inline-flex items-center gap-1.5 ${
              connected ? 'bg-white/20 text-white' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
            }`}
          >
            {connected ? <Check className="w-4 h-4" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
            {connected ? 'Connected' : 'Connect'}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* The snap */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <img src={snap.imageUrl} alt={snap.caption || `Snap by ${story.name}`} className="max-w-full max-h-full object-contain" draggable={false} />
        {/* Tap the left third to go back, anywhere else to go on */}
        <button type="button" aria-label="Previous" onClick={back} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 w-2/3" />
      </div>

      {(snap.caption || snap.eventName || snap.location) && (
        <div className="absolute inset-x-0 bottom-0 px-5 pt-16 pb-[calc(env(safe-area-inset-bottom)+20px)] bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
          {snap.caption && <p className="text-[16px] leading-snug">{snap.caption}</p>}
          {(snap.eventName || snap.location) && (
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-white/80">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{snap.eventName || snap.location}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
