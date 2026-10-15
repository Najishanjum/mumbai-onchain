import React, { useMemo, useState } from 'react';
import { Camera, Check, ChevronRight, ImageOff, QrCode, ScanLine, Search, UserPlus, Users, X } from 'lucide-react';
import type { PersonCategory, PersonProfile } from '../types/person';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { isRealPerson, isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { GroupedList } from './ui';
import { StoriesRow } from './Stories';
import { roleColor } from './Badge';

interface PeopleScreenProps {
  onShowPass: () => void;
  onScan: () => void;
  onCreateProfile: () => void;
  onSelectPerson: (id: string) => void;
  onAddSnap: () => void;
}

type View = 'people' | 'snaps';
type Filter = 'all' | 'mine' | PersonCategory;

const ROLE_FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'mine', label: 'My people' },
  { id: 'Builder', label: 'Builders' },
  { id: 'Founder', label: 'Founders' },
  { id: 'Volunteer', label: 'Volunteers' },
  { id: 'Student', label: 'Students' },
];

function subtitle(p: PersonProfile): string {
  return [p.headline || p.category, p.city].filter(Boolean).join(' · ');
}

/**
 * "Add" keeps someone in your own list. It is not a request: the other person
 * isn't notified until accounts exist (phase 3), so the UI doesn't pretend.
 */
function AddButton({ added, onToggle, name }: { added: boolean; onToggle: () => void; name: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={added}
      aria-label={added ? `Remove ${name} from my people` : `Add ${name} to my people`}
      className={`app-press shrink-0 h-8 px-3.5 rounded-full text-[14px] font-semibold inline-flex items-center gap-1 ${
        added ? 'bg-[var(--app-bg)] text-[var(--app-muted)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
      }`}
    >
      {added ? <Check className="w-4 h-4" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
      {added ? 'Added' : 'Add'}
    </button>
  );
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  onShowPass,
  onScan,
  onCreateProfile,
  onSelectPerson,
  onAddSnap,
}) => {
  const { people, myProfile, connections, setConnectionStatus } = usePeopleStore();
  const { recentSnaps, setActiveSnapForViewer } = useSnapStore();
  const [view, setView] = useState<View>('people');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const isAdded = (id: string) => connections[id] === 'CONNECTED';
  const toggleAdded = (id: string) => setConnectionStatus(id, isAdded(id) ? 'NOT_CONNECTED' : 'CONNECTED');

  const others = useMemo(
    () => people.filter((p) => isRealPerson(p) && p.id !== myProfile?.id && !p.isCurrentUser),
    [people, myProfile?.id]
  );

  // Only suggest once the user has a real profile; otherwise the engine scores
  // against a built-in demo profile and every reason is made up.
  const suggestions = useMemo(() => {
    if (!myProfile) return [];
    return others
      .filter((p) => connections[p.id] !== 'CONNECTED')
      .map((p) => ({ person: p, match: calculateMatchScore(myProfile, p, connections) }))
      .filter(({ match }) => match.overall >= 60 && match.reasons.length > 0)
      .sort((a, b) => b.match.overall - a.match.overall)
      .slice(0, 6);
  }, [others, myProfile, connections]);

  const q = query.trim().toLowerCase();
  const list = others
    .filter((p) => (filter === 'all' ? true : filter === 'mine' ? isAdded(p.id) : p.category === filter))
    .filter(
      (p) =>
        !q ||
        [p.name, p.headline, p.city, p.category, p.xHandle, ...(p.skills ?? [])].some((f) => f?.toLowerCase().includes(q))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const snaps = recentSnaps.filter(isRealSnap);
  const addedCount = others.filter((p) => isAdded(p.id)).length;

  return (
    <div className="pb-6">
      <header className="px-5 pt-3 pb-3 flex items-center gap-3">
        <h1 className="app-title flex-1 text-[30px] font-bold">People</h1>
        <button
          type="button"
          onClick={onScan}
          aria-label="Scan someone's pass"
          className="app-press w-10 h-10 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
        >
          <ScanLine className="w-5 h-5" />
        </button>
      </header>

      <StoriesRow onAddSnap={onAddSnap} onOpenPerson={onSelectPerson} className="mb-4" />

      <div className="px-5 pb-4">
        <div role="tablist" aria-label="People or snaps" className="grid grid-cols-2 p-1 rounded-xl bg-[var(--app-segment)]">
          {(['people', 'snaps'] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`h-8 rounded-lg text-[14px] font-semibold transition-colors ${
                view === v ? 'bg-[var(--app-surface)] shadow-sm' : 'text-[var(--app-muted)]'
              }`}
            >
              {v === 'people' ? `People${others.length ? ` (${others.length})` : ''}` : `Snaps${snaps.length ? ` (${snaps.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {view === 'people' ? (
        <>
          {/* Your pass */}
          {myProfile ? (
            <button
              type="button"
              onClick={onShowPass}
              className="app-press mx-4 mb-5 w-[calc(100%-2rem)] flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] text-left"
            >
              <PersonAvatar name={myProfile.name} avatarUrl={myProfile.avatar} size="md" className="rounded-full! border-0! w-11! h-11!" />
              <span className="flex-1 min-w-0">
                <span className="block text-[16px] font-semibold truncate">Show my pass</span>
                <span className="block text-[14px] text-[var(--app-on-primary)]/65">They scan it and add you instantly</span>
              </span>
              <QrCode className="w-7 h-7 shrink-0" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateProfile}
              className="app-press mx-4 mb-5 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-2xl bg-[var(--app-primary-soft)] text-left"
            >
              <UserPlus className="w-6 h-6 text-[var(--app-primary)] shrink-0" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">Create your pass</span>
                <span className="block text-[14px] text-[var(--app-muted)]">
                  Get a QR code people can scan, and see who you should meet.
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--app-faint)]" aria-hidden="true" />
            </button>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !q && filter === 'all' && (
            <section className="mb-6">
              <h2 className="app-title px-5 mb-2.5 text-[20px] font-bold">Suggested for you</h2>
              <div className="app-scroll-x flex gap-3 overflow-x-auto px-4 pb-1">
                {suggestions.map(({ person, match }) => (
                  <div
                    key={person.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectPerson(person.id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectPerson(person.id)}
                    className="app-press shrink-0 w-[168px] p-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] flex flex-col items-center text-center cursor-pointer"
                  >
                    <PersonAvatar name={person.name} avatarUrl={person.avatar} size="lg" className="rounded-full! border-0!" />
                    <span className="mt-2 text-[15px] font-semibold w-full truncate">{person.name}</span>
                    <span className="mt-1 h-5 px-2 rounded text-[11px] font-extrabold tracking-[0.08em] text-[#0D1316] inline-flex items-center" style={{ background: roleColor(person.category) }}>{person.category.toUpperCase()}</span>
                    <span className="mt-2 text-[13px] leading-snug text-[var(--app-ink)] line-clamp-2 min-h-[2.5em]">
                      {match.reasons[0]}
                    </span>
                    <div className="mt-3">
                      <AddButton added={isAdded(person.id)} onToggle={() => toggleAdded(person.id)} name={person.name} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search + filters */}
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)]">
              <Search className="w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
              <input
                id="people-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, skill, city"
                aria-label="Search people"
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px]"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="p-1">
                  <X className="w-4 h-4 text-[var(--app-muted)]" />
                </button>
              )}
            </div>
          </div>
          <div className="app-scroll-x flex gap-2 overflow-x-auto px-4 pb-4">
            {ROLE_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`app-press shrink-0 h-8 px-3.5 rounded-full text-[14px] font-medium border ${
                  filter === id
                    ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]'
                    : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                }`}
              >
                {label}
                {id === 'mine' && addedCount > 0 ? ` (${addedCount})` : ''}
              </button>
            ))}
          </div>

          {/* List */}
          {list.length > 0 ? (
            <GroupedList>
              {list.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectPerson(p.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectPerson(p.id)}
                  className="app-press flex items-center gap-3 px-4 py-3 bg-[var(--app-surface)] active:bg-[var(--app-pressed)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--app-primary)]"
                >
                  <span className="shrink-0 rounded-full p-[3px]" style={{ boxShadow: `inset 0 0 0 2px ${roleColor(p.category)}` }}>
                    <PersonAvatar name={p.name} avatarUrl={p.avatar} size="md" className="rounded-full! border-0! w-10! h-10!" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-semibold truncate">{p.name}</div>
                    <div className="text-[14px] text-[var(--app-muted)] truncate">{subtitle(p)}</div>
                  </div>
                  <AddButton added={isAdded(p.id)} onToggle={() => toggleAdded(p.id)} name={p.name} />
                </div>
              ))}
            </GroupedList>
          ) : (
            <div className="mx-4 py-10 text-center">
              <Users className="w-8 h-8 mx-auto text-[var(--app-faint)]" aria-hidden="true" />
              <p className="mt-3 text-[16px] font-semibold">
                {q ? 'Nobody matches that' : filter === 'mine' ? 'No one added yet' : 'No one here yet'}
              </p>
              <p className="mt-1 text-[15px] text-[var(--app-muted)] max-w-[32ch] mx-auto">
                {q
                  ? 'Try a first name, a skill like Solidity, or a city.'
                  : filter === 'mine'
                    ? 'Scan someone’s pass or tap Add on their profile to keep them here.'
                    : 'People appear here as they create their pass.'}
              </p>
            </div>
          )}
        </>
      ) : (
        <section>
          <div className="px-4 mb-4">
            <button
              type="button"
              onClick={onAddSnap}
              className="app-press w-full h-11 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" aria-hidden="true" /> Add a snap
            </button>
          </div>
          {snaps.length > 0 ? (
            <div className="px-4 grid grid-cols-3 gap-1.5">
              {snaps.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSnapForViewer(s)}
                  aria-label={`Snap by ${s.authorName}${s.caption ? `: ${s.caption}` : ''}`}
                  className="app-press relative aspect-square overflow-hidden rounded-lg bg-[var(--app-line)]"
                >
                  <img src={s.thumbnailUrl || s.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-4 py-10 text-center">
              <ImageOff className="w-8 h-8 mx-auto text-[var(--app-faint)]" aria-hidden="true" />
              <p className="mt-3 text-[16px] font-semibold">No snaps yet</p>
              <p className="mt-1 text-[15px] text-[var(--app-muted)] max-w-[30ch] mx-auto">
                Photos people share from the venues show up here. Be the first.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
