import { useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Check, Eye, Loader2, MapPin, MessageCircle, MoreHorizontal, Plus, Send, Trash2, UserPlus, X } from 'lucide-react';
import { NO_EVENT_ID, type Snap } from '../types/snap';
import type { PersonProfile } from '../types/person';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { roleColor } from './Badge';
import { useBackToClose } from '../lib/useBackToClose';
import { useStoryReplies } from '../lib/useStoryReplies';
import { recordSnapView, useSnapViewers } from '../lib/useSnapViews';
import { coverAround, keyboardFit, useKeyboardViewport } from '../lib/useKeyboardViewport';
import { requireApp } from '../lib/appGate';

const SEEN_KEY = 'mo_seen_snaps';

/** "now", "5m", "2h", "1d". */
function seenAgo(iso: string): string {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / (60 * 24))}d`;
}
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

// Stories last this long; after that a snap lives on in Highlights on the profile.
const STORY_LIFE_MS = 48 * 60 * 60 * 1000;

/** The last 48 hours of snaps, grouped by person, oldest first inside each story, unseen stories first. */
function useStories(seen: Set<string>) {
  const { recentSnaps } = useSnapStore();
  const { people, myProfile } = usePeopleStore();
  return useMemo(() => {
    const byAuthor = new Map<string, Story>();
    const since = Date.now() - STORY_LIFE_MS;
    for (const s of recentSnaps.filter((s) => isRealSnap(s) && new Date(s.createdAt).getTime() >= since)) {
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
  const inputRef = useRef<HTMLInputElement>(null);
  // Stays true a moment after the keyboard goes, so the tap that put it away
  // doesn't also skip to the next snap.
  const typingRef = useRef(false);

  // A copy, so a deleted snap disappears from the story straight away.
  const [stories, setStories] = useState(queue);
  const [menu, setMenu] = useState<null | 'menu' | 'confirm'>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const { deleteSnap, isOwnerOfSnap } = useSnapStore();
  const { people, myProfile: me } = usePeopleStore();
  const { replies, canReply, send } = useStoryReplies();
  const story = stories[storyAt];
  useBackToClose(true, onClose);
  const snap = story?.snaps[snapAt];
  // On your own story: who saw this snap.
  const viewers = useSnapViewers(snap && story && isMine(story) ? snap.id : null);

  // Replying: the story waits while you type, and the bar rides above the
  // keyboard (iPhone covers the page instead of resizing it).
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const kb = useKeyboardViewport(typing);
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 1800);
    return () => clearTimeout(t);
  }, [sent]);

  useEffect(() => {
    if (snap) onSeen(snap.id);
  }, [snap, onSeen]);

  // Counts towards "Seen by" for the snap's owner (signed-in members only).
  useEffect(() => {
    if (snap && story && me && !isMine(story) && isRealSnap(snap)) recordSnapView(snap.id, me.id);
  }, [snap, story, me, isMine]);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (typing) return;
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
    else if (storyAt < stories.length - 1) {
      setStoryAt(storyAt + 1);
      setSnapAt(0);
    } else onClose();
  }
  function back() {
    if (snapAt > 0) setSnapAt(snapAt - 1);
    else if (storyAt > 0) {
      setStoryAt(storyAt - 1);
      setSnapAt(stories[storyAt - 1].snaps.length - 1);
    }
  }

  async function removeSnap() {
    if (!snap || deleting) return;
    setDeleting(true);
    setDeleteError(false);
    const ok = await deleteSnap(snap.id);
    setDeleting(false);
    if (!ok) {
      setDeleteError(true);
      return;
    }
    setMenu(null);
    const left = story.snaps.filter((s) => s.id !== snap.id);
    if (left.length > 0) {
      setStories(stories.map((st, i) => (i === storyAt ? { ...st, snaps: left } : st)));
      setSnapAt(Math.min(snapAt, left.length - 1));
      return;
    }
    // That was the last snap in this story: drop the story and carry on.
    const rest = stories.filter((_, i) => i !== storyAt);
    if (storyAt >= rest.length) return onClose();
    setStories(rest);
    setSnapAt(0);
  }

  async function sendReply() {
    if (!snap || sending || !draft.trim()) return;
    setSending(true);
    setSendError(false);
    const ok = await send(snap.id, draft);
    setSending(false);
    if (!ok) return setSendError(true);
    setDraft('');
    setSent(true);
    inputRef.current?.blur();
  }

  const mine = isMine(story);
  const canDelete = isOwnerOfSnap(snap);
  const snapReplies = mine ? replies.filter((r) => r.snapId === snap.id) : [];
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? 'Someone';
  const avatarOf = (id: string) => people.find((p) => p.id === id)?.avatar;
  // A snap from no event has no "where" to show.
  const place = snap.eventId === NO_EVENT_ID ? '' : snap.eventName || snap.location;
  const held = paused || Boolean(menu) || typing || repliesOpen;
  const connected = getConnectionStatus(story.authorId) === 'CONNECTED';
  const color = roleColor(story.role);
  const stop = { onTouchStart: (e: TouchEvent) => e.stopPropagation(), onTouchEnd: (e: TouchEvent) => e.stopPropagation() };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s story`}
      className="app fixed inset-0 z-[75] bg-black text-white flex flex-col select-none"
      style={keyboardFit(kb, '#000') ?? (typing ? coverAround('#000') : undefined)}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        setPaused(false);
        if (!t) return;
        // Tapping away while typing just puts the keyboard away.
        if (typing) return inputRef.current?.blur();
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
                style={{ animationDuration: `${STORY_MS}ms`, animationPlayState: held ? 'paused' : 'running' }}
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
        {canDelete && (
          <button
            type="button"
            onClick={() => setMenu('menu')}
            {...stop}
            aria-label="More options"
            aria-haspopup="dialog"
            className="w-10 h-10 rounded-full flex items-center justify-center"
          >
            <MoreHorizontal className="w-6 h-6" aria-hidden="true" />
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
        <button type="button" aria-label="Previous" onClick={() => !typingRef.current && back()} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Next" onClick={() => !typingRef.current && next()} className="absolute inset-y-0 right-0 w-2/3" />
      </div>

      {/* Caption, then a reply bar on someone else's story or the replies to yours */}
      <div
        className="absolute inset-x-0 bottom-0 px-4 pt-16 pb-[calc(env(safe-area-inset-bottom)+14px)] bg-gradient-to-t from-black/85 to-transparent pointer-events-none"
        style={kb ? { paddingBottom: 10 } : undefined}
      >
        {(snap.caption || place) && !typing && (
          <div className="px-1 mb-3">
            {snap.caption && <p className="text-[16px] leading-snug">{snap.caption}</p>}
            {place && (
              <p className="mt-1.5 flex items-center gap-1 text-[13px] text-white/80">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{place}</span>
              </p>
            )}
          </div>
        )}
        {!mine && isRealSnap(snap) && (
          <form
            className="pointer-events-auto flex items-center gap-2"
            {...stop}
            onSubmit={(e) => {
              e.preventDefault();
              sendReply();
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setSendError(false);
              }}
              onFocus={(e) => {
                // On the website, replies are in the app; signed out, there's nobody to send as.
                if (!requireApp('reply') || !canReply) {
                  e.currentTarget.blur();
                  return;
                }
                typingRef.current = true;
                setTyping(true);
              }}
              onBlur={() => {
                setTyping(false);
                setTimeout(() => (typingRef.current = false), 350);
              }}
              maxLength={500}
              enterKeyHint="send"
              placeholder={sent ? 'Reply sent ✓' : canReply ? `Reply to ${story.name.split(' ')[0]}…` : 'Make your badge to reply'}
              aria-label={`Reply to ${story.name}`}
              className="flex-1 min-w-0 h-12 px-4 rounded-full bg-black/30 border border-white/40 text-[16px] text-white placeholder:text-white/75 outline-none focus:border-white backdrop-blur-sm"
            />
            {draft.trim() && (
              <button
                type="submit"
                disabled={sending}
                aria-label="Send reply"
                className="app-press shrink-0 w-12 h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
              </button>
            )}
          </form>
        )}
        {sendError && <p className="mt-2 px-1 text-[13px] text-white">Couldn’t send it. Check your connection and try again.</p>}
        {mine && (
          <button
            type="button"
            onClick={() => setRepliesOpen(true)}
            {...stop}
            className="pointer-events-auto app-press mx-auto h-11 px-4 rounded-full bg-black/30 border border-white/30 backdrop-blur-sm text-[14px] font-semibold flex items-center gap-2"
          >
            <Eye className="w-4.5 h-4.5" aria-hidden="true" />
            {viewers?.length ? `Seen by ${viewers.length}` : 'No views yet'}
            {snapReplies.length > 0 && (
              <>
                <span aria-hidden="true" className="text-white/50">·</span>
                <MessageCircle className="w-4.5 h-4.5" aria-hidden="true" />
                {snapReplies.length}
              </>
            )}
          </button>
        )}
      </div>

      {/* Replies to your snap */}
      {repliesOpen && (
        <div className="absolute inset-0 z-20 flex items-end" {...stop}>
          <button type="button" aria-label="Close replies" onClick={() => setRepliesOpen(false)} className="absolute inset-0 bg-black/50" />
          <div
            role="dialog"
            aria-label="Who saw it and replies"
            className="relative w-full max-h-[70dvh] overflow-y-auto rounded-t-[24px] bg-[var(--app-surface)] text-[var(--app-ink)] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            <p className="px-1 text-[17px] font-extrabold">Replies</p>
            {snapReplies.length === 0 ? (
              <p className="px-1 mt-1 text-[14px] text-[var(--app-muted)]">When people reply to this snap, only you see it here.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {snapReplies.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenPerson(r.fromProfileId)}
                      className="app-press w-full flex items-start gap-3 p-3 rounded-2xl bg-[var(--app-bg)] text-left"
                    >
                      <PersonAvatar name={nameOf(r.fromProfileId)} avatarUrl={avatarOf(r.fromProfileId)} size="sm" className="rounded-full! shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-bold">{nameOf(r.fromProfileId)}</span>
                        <span className="block text-[15px] leading-snug whitespace-pre-wrap break-words">{r.body}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="px-1 mt-5 text-[17px] font-extrabold">
              Seen by{viewers?.length ? ` ${viewers.length}` : ''}
            </p>
            {viewers === null ? (
              <div className="py-4 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--app-muted)]" aria-label="Loading" />
              </div>
            ) : viewers.length === 0 ? (
              <p className="px-1 mt-1 text-[14px] text-[var(--app-muted)]">Nobody yet. People with the app show up here once they watch it; only you see this list.</p>
            ) : (
              <ul className="mt-2">
                {viewers.map((v) => (
                  <li key={v.profileId}>
                    <button
                      type="button"
                      onClick={() => onOpenPerson(v.profileId)}
                      className="app-press w-full flex items-center gap-3 px-1 py-2 text-left"
                    >
                      <PersonAvatar name={nameOf(v.profileId)} avatarUrl={avatarOf(v.profileId)} size="sm" className="rounded-full! shrink-0 w-10! h-10!" />
                      <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">{nameOf(v.profileId)}</span>
                      <span className="text-[13px] text-[var(--app-muted)]">{seenAgo(v.viewedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setRepliesOpen(false)}
              className="app-press mt-2 w-full h-14 rounded-2xl text-[16px] font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Options for your own snap */}
      {menu && (
        <div className="absolute inset-0 z-20 flex items-end" {...stop}>
          <button
            type="button"
            aria-label="Close options"
            onClick={() => !deleting && setMenu(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            role="dialog"
            aria-label="Snap options"
            className="relative w-full rounded-t-[24px] bg-[var(--app-surface)] text-[var(--app-ink)] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            {menu === 'menu' ? (
              <button
                type="button"
                onClick={() => setMenu('confirm')}
                className="app-press w-full h-14 rounded-2xl bg-[var(--app-bg)] text-[var(--app-live)] text-[16px] font-bold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" /> Delete snap
              </button>
            ) : (
              <>
                <p className="px-1 text-[17px] font-extrabold">Delete this snap?</p>
                <p className="px-1 mt-1 text-[14px] text-[var(--app-muted)]">It’s removed from your story and from Snaps for everyone.</p>
                {deleteError && <p className="px-1 mt-2 text-[14px] text-[var(--app-live)]">Couldn’t delete it. Check your connection and try again.</p>}
                <button
                  type="button"
                  onClick={removeSnap}
                  disabled={deleting}
                  className="app-press mt-4 w-full h-14 rounded-2xl bg-[var(--app-live)] text-white text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                  {deleting ? 'Deleting' : 'Delete'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMenu(null)}
              disabled={deleting}
              className="app-press mt-2 w-full h-14 rounded-2xl text-[16px] font-semibold disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
