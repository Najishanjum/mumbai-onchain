import { ChevronRight, Handshake, MapPin } from 'lucide-react';
import { AdminHeading, ErrorLine, type Overview } from './shared';

const TILES: { key: keyof Overview; label: string }[] = [
  { key: 'people', label: 'People with a pass' },
  { key: 'accounts', label: 'Signed-in accounts' },
  { key: 'stories_24h', label: 'Stories, last 24h' },
  { key: 'replies_24h', label: 'Story replies, 24h' },
  { key: 'places_live', label: 'Places on the map' },
  { key: 'partners_approved', label: 'Community partners' },
  { key: 'push_people', label: 'People with alerts on' },
  { key: 'push_devices', label: 'Phones with alerts on' },
];

function ReviewCard({ icon: Icon, title, detail, onClick }: { icon: typeof MapPin; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="app-press mx-4 mb-2 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-3xl bg-[var(--app-primary-soft)] text-left">
      <span className="w-11 h-11 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-extrabold">{title}</span>
        <span className="block text-[14px] text-[var(--app-muted)]">{detail}</span>
      </span>
      <ChevronRight className="w-5 h-5 text-[var(--app-muted)]" aria-hidden="true" />
    </button>
  );
}

export function AdminOverview({
  data,
  error,
  onReviewPlaces,
  onReviewPartners,
}: {
  data: Overview | null;
  error: string;
  onReviewPlaces: () => void;
  onReviewPartners: () => void;
}) {
  const places = data?.places_pending ?? 0;
  const partners = data?.partners_pending ?? 0;
  return (
    <div>
      <AdminHeading title="Overview" detail="How Mumbai Onchain is doing right now." />
      <ErrorLine text={error} />

      <ReviewCard
        icon={MapPin}
        title={data ? (places ? `${places} ${places === 1 ? 'place' : 'places'} waiting` : 'No places waiting') : 'Places to review'}
        detail={places ? 'Approve them so they show on the map' : 'You’re all caught up'}
        onClick={onReviewPlaces}
      />
      <ReviewCard
        icon={Handshake}
        title={data ? (partners ? `${partners} partner ${partners === 1 ? 'application' : 'applications'}` : 'No partner applications') : 'Partners to review'}
        detail={partners ? 'Approved partners show on the website' : 'You’re all caught up'}
        onClick={onReviewPartners}
      />

      <div className="mx-4 mt-2 grid grid-cols-2 gap-2">
        {TILES.map((t) => (
          <div key={t.key} className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] px-4 py-3.5">
            <div className="app-title text-[28px] font-bold leading-none">{data ? (data[t.key] ?? 0).toLocaleString() : '–'}</div>
            <div className="mt-1.5 text-[13px] text-[var(--app-muted)]">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
