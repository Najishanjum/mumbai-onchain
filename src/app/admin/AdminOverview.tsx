import { ChevronRight, MapPin } from 'lucide-react';
import { AdminHeading, ErrorLine, type Overview } from './shared';

const TILES: { key: keyof Overview; label: string }[] = [
  { key: 'people', label: 'People with a pass' },
  { key: 'accounts', label: 'Signed-in accounts' },
  { key: 'stories_24h', label: 'Stories, last 24h' },
  { key: 'replies_24h', label: 'Story replies, 24h' },
  { key: 'places_live', label: 'Places on the map' },
  { key: 'push_people', label: 'People with alerts on' },
];

export function AdminOverview({ data, error, onReviewPlaces }: { data: Overview | null; error: string; onReviewPlaces: () => void }) {
  const waiting = data?.places_pending ?? 0;
  return (
    <div>
      <AdminHeading title="Overview" detail="How Mumbai Onchain is doing right now." />
      <ErrorLine text={error} />

      <button
        type="button"
        onClick={onReviewPlaces}
        className="app-press mx-4 mb-4 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-3xl bg-[var(--app-primary-soft)] text-left"
      >
        <span className="w-11 h-11 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-extrabold">
            {data ? (waiting ? `${waiting} ${waiting === 1 ? 'place' : 'places'} waiting` : 'No places waiting') : 'Places to review'}
          </span>
          <span className="block text-[14px] text-[var(--app-muted)]">{waiting ? 'Approve them so they show on the map' : 'You’re all caught up'}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[var(--app-muted)]" aria-hidden="true" />
      </button>

      <div className="mx-4 grid grid-cols-2 gap-2">
        {TILES.map((t) => (
          <div key={t.key} className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] px-4 py-3.5">
            <div className="app-title text-[28px] font-bold leading-none">{data ? data[t.key].toLocaleString() : '–'}</div>
            <div className="mt-1.5 text-[13px] text-[var(--app-muted)]">{t.label}</div>
          </div>
        ))}
      </div>
      {data && (
        <p className="mx-5 mt-3 text-[13px] text-[var(--app-muted)]">
          {data.push_devices} {data.push_devices === 1 ? 'phone gets' : 'phones get'} notifications.
        </p>
      )}
    </div>
  );
}
