import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Trash2, X } from 'lucide-react';
import type { SnapReactionType } from '../types/snap';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';

interface SnapViewerProps {
  onOpenPerson: (id: string) => void;
}

const REACTIONS: { type: SnapReactionType; emoji: string; label: string }[] = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'eyes', emoji: '👀', label: 'Eyes' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
];

export const SnapViewer: React.FC<SnapViewerProps> = ({ onOpenPerson }) => {
  const { activeSnapForViewer, recentSnaps, userReactions, toggleReaction, setActiveSnapForViewer, deleteSnap, isOwnerOfSnap } =
    useSnapStore();
  const { people } = usePeopleStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const touchX = useRef<number | null>(null);

  const list = recentSnaps.filter(isRealSnap);
  // The active snap object is a snapshot; read the live one so reaction counts update.
  const snap = activeSnapForViewer ? list.find((s) => s.id === activeSnapForViewer.id) ?? activeSnapForViewer : null;
  const index = snap ? list.findIndex((s) => s.id === snap.id) : -1;
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  const close = () => {
    setConfirmDelete(false);
    setActiveSnapForViewer(null);
  };
  const go = (s: typeof prev) => {
    if (!s) return;
    setConfirmDelete(false);
    setActiveSnapForViewer(s);
  };

  useEffect(() => {
    if (!snap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(prev);
      if (e.key === 'ArrowRight') go(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!snap) return null;

  const author = people.find((p) => p.id === snap.authorId);
  const tagged = (snap.taggedPersonIds ?? []).map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const mine = userReactions[snap.id] ?? [];
  const owner = isOwnerOfSnap(snap);

  async function remove() {
    setDeleting(true);
    const ok = await deleteSnap(snap!.id);
    setDeleting(false);
    if (ok) close();
  }

  return (
    <div className="app fixed inset-0 z-[75] bg-black text-white flex flex-col" role="dialog" aria-modal="true" aria-label={`Snap by ${snap.authorName}`}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
        <button type="button" onClick={close} aria-label="Close" className="app-press w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <X className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!author) return;
            close();
            onOpenPerson(author.id);
          }}
          className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
        >
          <PersonAvatar name={snap.authorName} avatarUrl={author?.avatar || snap.authorAvatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold truncate">{author?.name || snap.authorName}</span>
            <span className="block text-[13px] text-white/60 truncate">{snap.eventName || snap.date}</span>
          </span>
        </button>
        {owner && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete snap"
            className="app-press w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* Photo, swipe left/right */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 50) go(prev);
          if (dx < -50) go(next);
          touchX.current = null;
        }}
      >
        <img src={snap.imageUrl} alt={snap.caption || `Snap by ${snap.authorName}`} className="max-w-full max-h-full object-contain" />
        {prev && (
          <button type="button" onClick={() => go(prev)} aria-label="Previous snap" className="hidden sm:flex absolute left-3 w-10 h-10 rounded-full bg-white/15 items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {next && (
          <button type="button" onClick={() => go(next)} aria-label="Next snap" className="hidden sm:flex absolute right-3 w-10 h-10 rounded-full bg-white/15 items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        {list.length > 1 && index >= 0 && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[12px] font-medium px-2 py-0.5 rounded-full bg-black/50">
            {index + 1} / {list.length}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        {confirmDelete ? (
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-[16px] font-semibold">Delete this snap?</p>
            <p className="text-[14px] text-white/70">It’s removed for everyone. This can’t be undone.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="app-press h-11 rounded-full bg-white/15 text-[15px] font-semibold">
                Keep
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="app-press h-11 rounded-full bg-[#E5484D] text-[15px] font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            {snap.caption && <p className="text-[16px] leading-snug">{snap.caption}</p>}
            <p className="mt-1 flex items-center gap-1 text-[13px] text-white/60">
              {snap.location && (
                <>
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="truncate">{snap.location}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{snap.date}</span>
            </p>
            {tagged.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagged.map((p) => (
                  <button
                    key={p!.id}
                    type="button"
                    onClick={() => {
                      close();
                      onOpenPerson(p!.id);
                    }}
                    className="h-7 px-2.5 rounded-full bg-white/15 text-[13px] font-medium"
                  >
                    {p!.name}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {REACTIONS.map((r) => {
                const on = mine.includes(r.type);
                return (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => toggleReaction(snap.id, r.type)}
                    aria-pressed={on}
                    aria-label={`${r.label}, ${snap.reactions?.[r.type] ?? 0}`}
                    className={`app-press h-11 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 ${
                      on ? 'bg-white text-black' : 'bg-white/12'
                    }`}
                  >
                    <span aria-hidden="true">{r.emoji}</span>
                    {snap.reactions?.[r.type] ?? 0}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
