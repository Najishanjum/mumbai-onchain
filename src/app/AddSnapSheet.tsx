import React, { useMemo, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Loader2, X } from 'lucide-react';
import type { EventItem } from '../types/event';
import { NO_EVENT_ID } from '../types/snap';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSavedEvents } from '../lib/useSavedEvents';
import { isRealPerson } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { Sheet } from './ui';
import { dayLabel, hasEnded, isLive, sortByStart, VENUE_TBA } from './time';

interface AddSnapSheetProps {
  isOpen: boolean;
  events: EventItem[];
  preselectedEventId?: string;
  onClose: () => void;
  onCreateProfile: () => void;
}

const MAX_CAPTION = 140;

function SnapForm({ events, preselectedEventId, onClose, onCreateProfile }: Omit<AddSnapSheetProps, 'isOpen'>) {
  const { addSnap } = useSnapStore();
  const { people, myProfile } = usePeopleStore();
  const { savedIds } = useSavedEvents();
  const fileRef = useRef<HTMLInputElement>(null);

  // Best guess at where the photo was taken: the event they came from, then
  // something on right now, then their next saved event.
  const choices = useMemo(() => {
    const sorted = [...events].sort(sortByStart);
    const live = sorted.filter((e) => isLive(e));
    const saved = sorted.filter((e) => savedIds.includes(e.id) && !hasEnded(e));
    const featured = sorted.filter((e) => e.priority !== 'NORMAL');
    const pre = sorted.filter((e) => e.id === preselectedEventId);
    const seen = new Set<string>();
    return [...pre, ...live, ...saved, ...featured].filter((e) => !seen.has(e.id) && seen.add(e.id)).slice(0, 8);
  }, [events, savedIds, preselectedEventId]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [eventId, setEventId] = useState(choices[0]?.id ?? NO_EVENT_ID);
  const [caption, setCaption] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taggable = people.filter((p) => isRealPerson(p) && p.id !== myProfile?.id).slice(0, 30);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('That file isn’t a photo.');
    if (f.size > 15 * 1024 * 1024) return setError('That photo is over 15 MB. Pick a smaller one.');
    setError(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function post() {
    if (!file) return setError('Add a photo first.');
    const ev = events.find((e) => e.id === eventId);
    const general = eventId === NO_EVENT_ID;
    setBusy(true);
    setError(null);
    try {
      await addSnap({
        file,
        eventId: general ? NO_EVENT_ID : (ev?.id ?? ''),
        eventName: general ? 'Mumbai Onchain' : (ev?.title ?? 'Mumbai Onchain Week'),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }),
        caption: caption.trim(),
        location: ev && ev.location !== VENUE_TBA ? ev.location : 'Mumbai',
        taggedPersonIds: tagged,
      });
      if (preview) URL.revokeObjectURL(preview);
      onClose();
    } catch (err) {
      setError((err as Error)?.message || 'Couldn’t post that snap. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  // Every snap carries an author; without a pass it would post as an anonymous "You".
  if (!myProfile) {
    return (
      <Sheet open onClose={onClose} label="Add a snap">
        <div className="px-6 pt-10 pb-4 text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-[var(--app-primary-soft)] flex items-center justify-center">
            <Camera className="w-7 h-7 text-[var(--app-primary)]" aria-hidden="true" />
          </span>
          <h2 className="app-title mt-4 text-[22px] font-bold">Create your pass first</h2>
          <p className="mt-1 text-[15px] text-[var(--app-muted)] max-w-[30ch] mx-auto">
            Snaps show who took them, so people can find you from your photos.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateProfile();
            }}
            className="app-press mt-5 h-12 px-6 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold"
          >
            Create my pass
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} label="Add a snap" hideClose dismissible={!file && !busy}>
      <div className="sticky top-0 z-30 -mt-[22px] pt-3 pb-3 px-4 bg-[var(--app-bg)]/95 backdrop-blur-md flex items-center gap-2 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} disabled={busy} className="h-10 px-2 text-[16px] text-[var(--app-primary)] disabled:opacity-40">
          Cancel
        </button>
        <h2 className="flex-1 text-center text-[17px] font-semibold">New snap</h2>
        <button
          type="button"
          onClick={post}
          disabled={!file || busy}
          className="app-press h-9 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold disabled:opacity-35 inline-flex items-center gap-1.5"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Posting' : 'Post'}
        </button>
      </div>

      <div className="px-5 pt-5">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <img src={preview} alt="Your snap" className="w-full max-h-[52vh] object-contain" />
            {!busy && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="app-press absolute bottom-3 right-3 h-9 px-3.5 rounded-full bg-black/60 backdrop-blur text-white text-[14px] font-semibold"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="app-press w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[var(--app-line)] bg-[var(--app-surface)] flex flex-col items-center justify-center gap-2"
          >
            <ImagePlus className="w-9 h-9 text-[var(--app-muted)]" aria-hidden="true" />
            <span className="text-[16px] font-semibold">Take or choose a photo</span>
            <span className="text-[14px] text-[var(--app-muted)]">It’s public for everyone at the week</span>
          </button>
        )}

        {error && <p className="mt-3 text-[14px] text-[var(--app-live)]">{error}</p>}

        <label htmlFor="snap-caption" className="mt-6 block app-label mb-1.5">
          Caption
        </label>
        <textarea
          id="snap-caption"
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
          placeholder="What’s happening?"
          className="w-full px-4 py-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-ink)] resize-none"
        />
        <div className="text-right text-[12px] text-[var(--app-faint)]">
          {caption.length}/{MAX_CAPTION}
        </div>

        <div className="mt-4 app-label mb-2">Where</div>
        <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
          {/* Not from an event: still in everyone's stories, just without an event label */}
          <button
            type="button"
            onClick={() => setEventId(NO_EVENT_ID)}
            aria-pressed={eventId === NO_EVENT_ID}
            className="app-press w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[var(--app-pressed)]"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold truncate">No event</span>
              <span className="block text-[13px] text-[var(--app-muted)]">For everyone on Mumbai Onchain</span>
            </span>
            {eventId === NO_EVENT_ID && <Check className="w-5 h-5 text-[var(--app-primary)]" aria-hidden="true" />}
          </button>
          {choices.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEventId(e.id)}
              aria-pressed={eventId === e.id}
              className="app-press w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[var(--app-pressed)]"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold truncate">{e.title}</span>
                <span className="block text-[13px] text-[var(--app-muted)]">
                  {isLive(e) ? 'Happening now' : dayLabel(e.startDate)}
                </span>
              </span>
              {eventId === e.id && <Check className="w-5 h-5 text-[var(--app-primary)]" aria-hidden="true" />}
            </button>
          ))}
        </div>

        {taggable.length > 0 && (
          <>
            <div className="mt-6 app-label mb-2">
              Who’s in it{tagged.length ? ` · ${tagged.length}` : ''}
            </div>
            <div className="app-scroll-x flex gap-3 overflow-x-auto pb-1">
              {taggable.map((p) => {
                const on = tagged.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTagged((t) => (on ? t.filter((x) => x !== p.id) : [...t, p.id]))}
                    aria-pressed={on}
                    aria-label={`${on ? 'Untag' : 'Tag'} ${p.name}`}
                    className="app-press shrink-0 w-16 flex flex-col items-center gap-1"
                  >
                    <span className={`relative rounded-full p-0.5 ${on ? 'ring-2 ring-[var(--app-primary)]' : ''}`}>
                      <PersonAvatar name={p.name} avatarUrl={p.avatar} size="md" className="rounded-full! border-0! w-12! h-12!" />
                      {on && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center">
                          <Check className="w-3 h-3" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="text-[12px] w-full truncate text-center">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {file && !busy && (
          <button
            type="button"
            onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              setFile(null);
              setPreview('');
            }}
            className="mt-6 w-full h-11 text-[15px] font-medium text-[var(--app-live)] inline-flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" aria-hidden="true" /> Remove photo
          </button>
        )}
      </div>
    </Sheet>
  );
}

export const AddSnapSheet: React.FC<AddSnapSheetProps> = ({ isOpen, ...rest }) => (isOpen ? <SnapForm {...rest} /> : null);
