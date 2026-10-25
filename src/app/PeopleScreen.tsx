import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Plus, QrCode, ScanLine, Search, UserPlus, Users, X } from 'lucide-react';
import type { PersonCategory, PersonProfile } from '../types/person';
import { usePeopleStore } from '../lib/usePeopleStore';
import { MAX_COMMUNITIES, useCommunities, type Community } from '../lib/useCommunities';
import { CommunityLogo } from './CommunitySheet';
import { calculateMatchScore } from '../lib/matchingEngine';
import { isRealPerson } from '../lib/samples';
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
  onOpenCommunity: (id: string) => void;
  onJoinCommunity: () => void;
}

type Filter = 'all' | 'mine' | PersonCategory;

const ROLE_FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'mine', label: 'Following' },
  { id: 'Builder', label: 'Builders' },
  { id: 'Founder', label: 'Founders' },
  { id: 'Volunteer', label: 'Volunteers' },
  { id: 'Student', label: 'Students' },
];

function subtitle(p: PersonProfile): string {
  return [p.headline || p.category, p.city].filter(Boolean).join(' · ');
}

/** Follow, Following, or Follow back when they already follow you. */
function AddButton({ added, onToggle, name, followsMe = false }: { added: boolean; onToggle: () => void; name: string; followsMe?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={added}
      aria-label={added ? `Unfollow ${name}` : `Follow ${name}`}
      className={`app-press shrink-0 h-8 px-3.5 rounded-full text-[14px] font-semibold inline-flex items-center gap-1 ${
        added ? 'bg-[var(--app-bg)] text-[var(--app-muted)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
      }`}
    >
      {added ? <Check className="w-4 h-4" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
      {added ? 'Following' : followsMe ? 'Follow back' : 'Follow'}
    </button>
  );
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  onShowPass,
  onScan,
  onCreateProfile,
  onSelectPerson,
  onAddSnap,
  onOpenCommunity,
  onJoinCommunity,
}) => {
  const { people, myProfile, connections, setConnectionStatus, addedMe, authUser } = usePeopleStore();
  const { mine: myCommunities, communities } = useCommunities(authUser?.id ?? null, myProfile?.id ?? null);
  const yourCommunities = (myCommunities ?? [])
    .map((m) => ({ m, c: communities.find((x) => x.id === m.communityId) }))
    .filter((r): r is { m: (typeof r)['m']; c: Community } => Boolean(r.c));
  const followers = useMemo(() => new Set(addedMe.map((a) => a.profileId)), [addedMe]);
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

  const addedCount = others.filter((p) => isAdded(p.id)).length;

  return (
    <div className="pb-6">
      <header className="px-5 pt-3 pb-3 flex items-center gap-3">
        <h1 className="app-title flex-1 text-[30px] font-bold">People</h1>
        {/* Show mine, scan theirs: side by side, as a pair. */}
        {myProfile && (
          <button
            type="button"
            onClick={onShowPass}
            aria-label="Show my pass"
            className="app-press w-10 h-10 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
          >
            <QrCode className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onScan}
          aria-label="Scan someone's pass"
          className="app-press w-10 h-10 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
        >
          <ScanLine className="w-5 h-5" />
        </button>
      </header>

      {/* Your communities: their pages, one tap away. */}
      {myProfile && (
        <div role="list" aria-label="Your communities" className="app-scroll-x mb-4 px-4 flex gap-2 overflow-x-auto">
          {yourCommunities.map(({ m, c }) => (
            <button
              key={c.id}
              type="button"
              role="listitem"
              onClick={() => onOpenCommunity(c.id)}
              className="app-press shrink-0 h-11 pl-1.5 pr-3.5 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] inline-flex items-center gap-2"
            >
              <CommunityLogo c={c} size={32} />
              <span className="text-[14px] font-semibold max-w-[16ch] truncate">{c.community_name}</span>
              {m.role === 'lead' && <span className="text-[11px] font-bold text-[var(--app-primary)]">LEAD</span>}
            </button>
          ))}
          {(myCommunities ?? []).length < MAX_COMMUNITIES && (
            <button
              type="button"
              role="listitem"
              onClick={onJoinCommunity}
              className="app-press shrink-0 h-11 px-3.5 rounded-full border border-dashed border-[var(--app-line)] text-[14px] font-semibold text-[var(--app-muted)] inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {yourCommunities.length ? 'Join another' : 'Join your community'}
            </button>
          )}
        </div>
      )}

      <StoriesRow onAddSnap={onAddSnap} onOpenPerson={onSelectPerson} onOpenCommunity={onOpenCommunity} className="mb-4" />

        <>
          {/* No pass yet: the full card, since it's how people get started.
              With a pass, the QR button in the header shows it. */}
          {!myProfile && (
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
                      <AddButton added={isAdded(person.id)} onToggle={() => toggleAdded(person.id)} name={person.name} followsMe={followers.has(person.id)} />
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
                  <AddButton added={isAdded(p.id)} onToggle={() => toggleAdded(p.id)} name={p.name} followsMe={followers.has(p.id)} />
                </div>
              ))}
            </GroupedList>
          ) : (
            <div className="mx-4 py-10 text-center">
              <Users className="w-8 h-8 mx-auto text-[var(--app-faint)]" aria-hidden="true" />
              <p className="mt-3 text-[16px] font-semibold">
                {q ? 'Nobody matches that' : filter === 'mine' ? 'You’re not following anyone yet' : 'No one here yet'}
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
    </div>
  );
};
