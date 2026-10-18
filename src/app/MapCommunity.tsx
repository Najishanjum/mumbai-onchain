import { useState } from 'react';
import { ExternalLink, Loader2, Star } from 'lucide-react';
import { PLACE_CATEGORIES, type PlaceCategory } from '../data/places';
import { usePlaceReviews, type NewPlace, type RatingSummary } from '../lib/useCommunityPlaces';
import { Sheet } from './ui';

// The community side of the map: Mumbai Onchain ratings and reviews (ours,
// kept apart from Google's), the link out to Google reviews, and the form for
// adding a place.

/** Google's own reviews, opened in Google Maps (their terms don't allow showing them on our map). */
export function googleReviewsUrl(name: string, area: string | undefined): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, area, 'Mumbai'].filter(Boolean).join(', '))}`;
}

export function GoogleReviewsLink({ name, area }: { name: string; area?: string }) {
  return (
    <a
      href={googleReviewsUrl(name, area)}
      target="_blank"
      rel="noopener noreferrer"
      className="app-press h-11 px-4 rounded-full inline-flex items-center gap-1.5 text-[14px] font-bold bg-[var(--app-pressed)]"
    >
      Google reviews
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </a>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? 'text-[#FFC93A]' : 'text-[var(--app-faint)]'}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** "★ 4.6 · 12" for list rows. */
export function RatingBadge({ summary }: { summary?: RatingSummary }) {
  if (!summary) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--app-ink)]">
      <Star className="w-3.5 h-3.5 text-[#FFC93A]" fill="currentColor" aria-hidden="true" />
      {summary.average.toFixed(1)}
      <span className="text-[var(--app-muted)] font-medium">({summary.total})</span>
    </span>
  );
}

/** Mumbai Onchain ratings on a place card: the average, your rating and recent reviews. */
export function PlaceReviews({
  placeId,
  summary,
  onRated,
  onRequireProfile,
}: {
  placeId: string;
  summary?: RatingSummary;
  onRated: () => void;
  onRequireProfile: () => void;
}) {
  const { reviews, mine, canRate, rate } = usePlaceReviews(placeId);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const others = reviews.filter((r) => r !== mine);

  const startRating = (n: number) => {
    if (!canRate) return onRequireProfile();
    setStars(n);
    if (!editing) {
      setComment(mine?.comment ?? '');
      setEditing(true);
    }
  };

  async function save() {
    setBusy(true);
    setError('');
    const err = await rate(stars, comment);
    setBusy(false);
    if (err) return setError(err);
    setEditing(false);
    onRated();
  }

  return (
    <section className="mt-1 pt-3 border-t border-[var(--app-line)] flex flex-col gap-2.5" aria-label="Mumbai Onchain ratings">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold">Mumbai Onchain ratings</h3>
        {summary ? (
          <span className="inline-flex items-center gap-1.5 text-[13px]">
            <Stars value={summary.average} />
            <b>{summary.average.toFixed(1)}</b>
            <span className="text-[var(--app-muted)]">({summary.total})</span>
          </span>
        ) : (
          <span className="text-[13px] text-[var(--app-muted)]">No ratings yet</span>
        )}
      </div>

      {/* Your rating: tap a star to start. */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[var(--app-muted)] shrink-0">{mine && !editing ? 'You rated' : 'Your rating'}</span>
        <span className="inline-flex" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n <= (editing ? stars : mine?.stars ?? 0);
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={(editing ? stars : mine?.stars) === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => startRating(n)}
                className="app-press w-9 h-9 flex items-center justify-center"
              >
                <Star className={`w-6 h-6 ${on ? 'text-[#FFC93A]' : 'text-[var(--app-faint)]'}`} fill={on ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            );
          })}
        </span>
      </div>

      {editing && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`review-${placeId}`} className="sr-only">
            Review (optional)
          </label>
          <textarea
            id={`review-${placeId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 280))}
            placeholder="One line for others (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-2xl bg-[var(--app-bg)] border border-[var(--app-line)] text-[15px] outline-none focus:border-[var(--app-primary)] resize-none"
          />
          {error && <p className="text-[13px] text-[var(--app-live)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || stars === 0}
              className="app-press h-10 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {mine ? 'Update rating' : 'Post rating'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="app-press h-10 px-4 rounded-full bg-[var(--app-pressed)] text-[14px] font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(mine && !editing ? [mine, ...others] : others).slice(0, 5).map((r) => (
        <div key={r.ownerId} className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-2 text-[13px]">
            <b>{r === mine ? 'You' : r.name}</b>
            <Stars value={r.stars} size={12} />
          </span>
          {r.comment && <p className="text-[14px] text-[var(--app-muted)]">{r.comment}</p>}
        </div>
      ))}
    </section>
  );
}

/** Reads "19.06, 72.86" or a full Google Maps link (…@19.06,72.86… or ?q=19.06,72.86). */
export function parseLocation(text: string): { lat: number; lng: number } | null {
  const t = text.trim();
  const m =
    t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ??
    t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ??
    t.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ??
    t.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  // Mumbai and around only, matching the database check.
  return lat >= 18.8 && lat <= 19.4 && lng >= 72.7 && lng <= 73.2 ? { lat, lng } : null;
}

/** The form after placing the pin: what it is, a name, and a line for others. */
export function AddPlaceSheet({
  open,
  at,
  onClose,
  onAdd,
}: {
  open: boolean;
  at: { lat: number; lng: number } | null;
  onClose: () => void;
  onAdd: (p: NewPlace) => Promise<string | null>;
}) {
  const [category, setCategory] = useState<PlaceCategory>('food');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [tip, setTip] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!open || !at) return null;

  const fromLink = link.trim() ? parseLocation(link) : null;
  const spot = fromLink ?? at;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Give the place a name.');
    if (link.trim() && !fromLink) return setError('That link has no location in it. Paste a full Google Maps link or "lat, long", or leave it empty to use the pin.');
    setBusy(true);
    setError('');
    const err = await onAdd({ name, category, lat: spot.lat, lng: spot.lng, area, tip, price });
    setBusy(false);
    if (err) return setError(err);
    setName('');
    setArea('');
    setTip('');
    setPrice('');
    setLink('');
    onClose();
  }

  const field = 'w-full h-12 px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)]';

  return (
    <Sheet open onClose={onClose} label="Add a place" dismissible={!busy}>
      <form onSubmit={submit} className="px-5 pt-2">
        <h2 className="app-title text-[24px]">Add a place</h2>
        <p className="clear-both mt-1 text-[14px] text-[var(--app-muted)]">
          It shows on the map for everyone, with your name. Pin at {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="What is it">
          {PLACE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`app-press h-9 px-3.5 rounded-full border text-[14px] font-semibold ${
                category === c.id ? 'bg-[var(--app-ink)] text-[var(--app-bg)] border-[var(--app-ink)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <input id="place-name" aria-label="Name" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} placeholder="Name, e.g. Bombay Coffee House" className={field} />
          <input id="place-area" aria-label="Area" value={area} onChange={(e) => setArea(e.target.value.slice(0, 60))} placeholder="Area, e.g. Bandra West" className={field} />
          <input id="place-tip" aria-label="Tip" value={tip} onChange={(e) => setTip(e.target.value.slice(0, 200))} placeholder="One line for others (optional)" className={field} />
          <input id="place-price" aria-label="Price" value={price} onChange={(e) => setPrice(e.target.value.slice(0, 40))} placeholder="Price, e.g. ₹400 for two (optional)" className={field} />
          <input
            id="place-link"
            aria-label="Google Maps link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Google Maps link or lat, long (optional)"
            inputMode="url"
            className={field}
          />
        </div>

        {error && <p className="mt-3 text-[14px] text-[var(--app-live)]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="app-press mt-4 w-full h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[16px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Add to map
        </button>
      </form>
    </Sheet>
  );
}
