import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Snap } from '../types/snap';
import { useSnapStore } from '../lib/useSnapStore';
import { StoriesRow } from './Stories';
import { useAppTheme } from '../lib/useAppTheme';
import { communityVars } from '../lib/communityAccent';
import { useWaitingEdits } from '../lib/contentEdits';
import { PartnerEditForm } from './PartnerEdit';
import { Clock, Home, Lock, Megaphone, Plus, UserPlus, Users, X } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import type { AdminRole } from '../lib/useAdmin';
import { usePeopleStore } from '../lib/usePeopleStore';
import { LEVELS, storyRules, useCommunities, useCommunityLevels, type Community } from '../lib/useCommunities';
import { shortAgo, useBroadcasts, useLeadAnnouncements } from '../lib/useBroadcasts';
import { CoLeadCard, CommunityLogo, CommunityNumbers, InviteCard, MemberList, useCommunityRows } from './CommunitySheet';
import { CommunityMessages } from './CommunityMessages';
import { ModeMenu, type ModeTarget } from './ModeMenu';

type Tab = 'home' | 'messages' | 'members' | 'invite';
const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'messages', label: 'Messages', icon: Megaphone },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'invite', label: 'Invite', icon: UserPlus },
];

function Heading({ title, detail }: { title: string; detail?: string }) {
  return (
    <header className="px-5 pt-2 pb-4">
      <h2 className="app-title text-[28px] font-bold">{title}</h2>
      {detail && <p className="mt-1 text-[15px] text-[var(--app-muted)]">{detail}</p>}
    </header>
  );
}

/** The team's announcements to leads, pinned until the lead taps Got it. */
function Announcements({ isLead }: { isLead: boolean }) {
  const { authUser } = usePeopleStore();
  const { unseen, gotIt } = useLeadAnnouncements(authUser?.id ?? null, isLead);
  if (!unseen.length) return null;
  return (
    <div className="mx-4 mb-4 space-y-3">
      {unseen.map((b) => (
        <div key={b.id} className="rounded-3xl bg-[var(--app-primary-soft)] border border-[var(--app-primary)]/40 p-4">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="w-6 h-6 rounded-md" />
            <span className="flex-1 text-[13px] font-bold">From the Mumbai Onchain team</span>
            <span className="text-[13px] text-[var(--app-muted)]">{shortAgo(b.sentAt)}</span>
          </div>
          <p className="mt-2 text-[16px] font-bold leading-snug">{b.title}</p>
          {b.body && <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line">{b.body}</p>}
          <button
            type="button"
            onClick={() => gotIt(b.id)}
            className="app-press mt-3 w-full h-11 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-bold"
          >
            Got it
          </button>
        </div>
      ))}
    </div>
  );
}

/** The community's level, progress to the next one, and what each unlocks. */
function LevelCard({ c }: { c: Community }) {
  const { levelOf, refresh } = useCommunityLevels();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const { level, counted } = levelOf(c.id);
  const next = LEVELS.find((l) => l.level === level + 1);
  return (
    <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="app-label">Level</p>
        <p className="text-[13px] text-[var(--app-muted)]">{counted} counted</p>
      </div>
      <p className="mt-1 text-[22px] font-bold">{LEVELS[level].name}</p>
      {next ? (
        <>
          <div className="mt-3 h-2 rounded-full bg-[var(--app-pressed)] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={next.at} aria-valuenow={Math.min(counted, next.at)} aria-label={`${counted} of ${next.at} to ${next.name}`}>
            <div className="h-full rounded-full bg-[var(--app-primary)]" style={{ width: `${Math.min(100, (counted / next.at) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[15px]">
            <b>{counted} / {next.at}</b> to {next.name}: {next.unlock.charAt(0).toLowerCase() + next.unlock.slice(1)}.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[15px]">The top level. Thank you for bringing {c.community_name} to the week.</p>
      )}
      <ul className="mt-3 pt-3 border-t border-[var(--app-line)] space-y-1.5">
        {LEVELS.map((l) => (
          <li key={l.level} className={`flex gap-2 text-[14px] leading-snug ${l.level <= level ? '' : 'text-[var(--app-muted)]'}`}>
            <span className="shrink-0 w-4 text-center" aria-hidden="true">{l.level <= level ? '✓' : '·'}</span>
            <span>
              <b>{l.name}</b>{l.at ? ` (${l.at})` : ''}: {l.unlock}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-[var(--app-muted)]">Counted: people whose first community is yours, with a photo or a headline on their profile. A level you reach stays.</p>
    </div>
  );
}

/** The community's public details, changed through the admins' review. */
function DetailsCard({ c }: { c: Community }) {
  const [editing, setEditing] = useState(false);
  const { items: waiting, reload } = useWaitingEdits('partner', c.id);
  const links = [c.website_url, c.x_url, c.telegram_url, c.instagram_url, c.linkedin_url, c.discord_url, c.whatsapp_url].filter(Boolean).length;
  return (
    <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <p className="app-label">Details</p>
      {editing ? (
        <div className="mt-3">
          <PartnerEditForm
            partner={{
              id: c.id,
              community_name: c.community_name,
              community_description: c.community_description ?? '',
              website_url: c.website_url ?? '',
              x_url: c.x_url ?? '',
              instagram_url: c.instagram_url ?? '',
              linkedin_url: c.linkedin_url ?? '',
              telegram_url: c.telegram_url ?? '',
              discord_url: c.discord_url ?? '',
              whatsapp_url: c.whatsapp_url ?? '',
            }}
            onCancel={() => setEditing(false)}
            onSent={() => {
              setEditing(false);
              reload();
            }}
          />
        </div>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-snug line-clamp-3">{c.community_description || 'No description yet.'}</p>
          <p className="mt-1 text-[13px] text-[var(--app-muted)]">
            {links} link{links === 1 ? '' : 's'} · shown in the app and on the website
          </p>
          {waiting && waiting.length > 0 && (
            <p className="mt-2 text-[13px] font-bold text-[var(--app-primary)]">Your change is waiting for the admins. The current details stay until they approve it.</p>
          )}
          <button type="button" onClick={() => setEditing(true)} className="app-press mt-3 text-[15px] font-semibold text-[var(--app-primary)]">
            Edit details ›
          </button>
        </>
      )}
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Why Post is locked or used up, and the story ladder (like a Telegram channel's boosts). */
function StoryLevelsPopup({ c, level, counted, reason, onClose }: { c: Community; level: number; counted: number; reason: 'locked' | 'limit'; onClose: () => void }) {
  const rules = storyRules(level);
  const next = LEVELS.find((l) => l.level === level + 1);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-labelledby="story-levels-title">
      <button type="button" aria-label="Close" onClick={onClose} className="app-backdrop absolute inset-0 bg-black/55" />
      <div className="app-pop relative w-full max-w-[340px] rounded-[28px] bg-[var(--app-surface)] border border-[var(--app-line)] p-5 pt-6 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="app-press absolute top-3 right-3 w-9 h-9 rounded-full bg-[var(--app-pressed)] flex items-center justify-center">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        <span className="mx-auto w-14 h-14 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center">
          {reason === 'locked' ? <Lock className="w-6 h-6" aria-hidden="true" /> : <Clock className="w-6 h-6" aria-hidden="true" />}
        </span>
        <h3 id="story-levels-title" className="mt-3 text-center text-[19px] font-extrabold">
          {reason === 'locked' ? 'Stories unlock at Rising' : rules?.perDay === 1 ? 'That’s today’s story' : `That’s today’s ${rules?.perDay} stories`}
        </h3>
        <p className="mt-1.5 text-center text-[15px] leading-snug text-[var(--app-muted)]">
          {reason === 'locked'
            ? `Bring ${c.community_name} to 15 counted members to post stories for them. You have ${counted} of 15.`
            : `Post again in 24 hours.${next ? ` Reach ${next.name} (${next.at} counted) for more.` : ''}`}
        </p>
        <ul className="mt-4 rounded-2xl bg-[var(--app-pressed)] divide-y divide-[var(--app-line)] overflow-hidden">
          {LEVELS.slice(1).map((l) => {
            const r = storyRules(l.level)!;
            const here = l.level === level;
            return (
              <li key={l.level} className={`flex items-center gap-3 px-3.5 py-2.5 ${here ? 'bg-[var(--app-primary-soft)]' : ''}`}>
                <span className={`w-4 text-center text-[14px] ${l.level <= level ? 'text-[var(--app-primary)]' : 'text-[var(--app-faint)]'}`} aria-hidden="true">
                  {l.level <= level ? '✓' : '·'}
                </span>
                <span className="flex-1 min-w-0 text-[14px] leading-snug">
                  <b>{l.name}</b> <span className="text-[var(--app-muted)]">· {l.at} counted</span>
                  <span className="block text-[13px] text-[var(--app-muted)]">
                    {r.perDay} {r.perDay === 1 ? 'story' : 'stories'} a day, {r.audience === 'members' ? 'for your members' : 'for everyone in the app'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={onClose} className="app-press mt-4 w-full h-11 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-bold">
          Got it
        </button>
      </div>
    </div>
  );
}

/**
 * The community's stories: a Post button (as the community, unlocked by level)
 * and the stories of the community and its members.
 */
function CommunityStories({ c, data, onOpenPerson }: { c: Community; data: ReturnType<typeof useCommunityRows>; onOpenPerson: (id: string) => void }) {
  const { levelOf } = useCommunityLevels();
  const { level, counted } = levelOf(c.id);
  const rules = storyRules(level);
  const { recentSnaps, setIsAddSnapModalOpen } = useSnapStore();
  const memberIds = useMemo(() => new Set(data.rows.map((r) => r.p.id)), [data.rows]);
  const filter = useCallback((s: Snap) => s.communityId === c.id || (!s.communityId && memberIds.has(s.authorId)), [c.id, memberIds]);
  const today = recentSnaps.filter((s) => s.communityId === c.id && Date.now() - new Date(s.createdAt).getTime() < DAY_MS).length;
  const left = rules ? Math.max(0, rules.perDay - today) : 0;
  const [popup, setPopup] = useState<null | 'locked' | 'limit'>(null);
  const post = () => {
    if (!rules) return setPopup('locked');
    if (!left) return setPopup('limit');
    setIsAddSnapModalOpen(true, undefined, c.id);
  };
  return (
    <section className="mb-4" aria-labelledby="community-stories">
      <div className="px-5 mb-2 flex items-baseline justify-between gap-3">
        <h3 id="community-stories" className="app-label">
          Stories
        </h3>
        <span className="text-[12px] font-semibold text-[var(--app-muted)]">
          {rules ? `${left} of ${rules.perDay} left today · ${rules.audience === 'members' ? 'members only' : 'everyone'}` : 'Unlocks at Rising'}
        </span>
      </div>
      <StoriesRow
        filter={filter}
        onAddSnap={post}
        onOpenPerson={onOpenPerson}
        emptyText={rules ? 'Your members’ stories show up here too.' : 'Your members’ stories show up here.'}
        leading={
          <button type="button" onClick={post} aria-label={rules ? `Post a story as ${c.community_name}` : 'Community stories, locked'} className="app-press shrink-0 w-[72px] flex flex-col items-center gap-1.5">
            <span className="relative">
              <span className="block rounded-full p-[3px] bg-[var(--app-line)]">
                <span className="block rounded-full p-[2px] bg-[var(--app-bg)]">
                  <span className={`block rounded-full overflow-hidden ${rules ? '' : 'opacity-60'}`}>
                    <CommunityLogo c={c} size={58} />
                  </span>
                </span>
              </span>
              <span className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] border-2 border-[var(--app-bg)] flex items-center justify-center">
                {rules ? <Plus className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" /> : <Lock className="w-3 h-3" strokeWidth={2.6} aria-hidden="true" />}
              </span>
            </span>
            <span className="text-[12px] font-semibold w-full truncate text-center">{rules ? 'Post' : 'Locked'}</span>
          </button>
        }
      />
      {popup && <StoryLevelsPopup c={c} level={level} counted={counted} reason={popup} onClose={() => setPopup(null)} />}
    </section>
  );
}

function HomeTab({
  c,
  data,
  goTo,
  isLead,
  onOpenPerson,
}: {
  c: Community;
  data: ReturnType<typeof useCommunityRows>;
  goTo: (t: Tab) => void;
  isLead: boolean;
  onOpenPerson: (id: string) => void;
}) {
  const { items } = useBroadcasts(c.id, 5);
  const last = items?.find((b) => b.status === 'sent');
  const waiting = items?.filter((b) => b.status === 'pending').length ?? 0;
  return (
    <div>
      <Announcements isLead={isLead} />
      <div className="mx-4 mb-4 flex items-center gap-3.5">
        <CommunityLogo c={c} size={64} />
        <div className="min-w-0">
          <h2 className="app-title text-[24px] font-bold leading-tight">{c.community_name}</h2>
          <p className="mt-1 text-[15px] text-[var(--app-muted)]">
            {data.memberRows.length} member{data.memberRows.length === 1 ? '' : 's'}
            {data.thisWeek > 0 && ` · ${data.thisWeek} new this week`}
          </p>
        </div>
      </div>
      <CommunityStories c={c} data={data} onOpenPerson={onOpenPerson} />
      <div className="mx-4 space-y-3">
        <LevelCard c={c} />
        <CommunityNumbers data={data} />
        <button type="button" onClick={() => goTo('messages')} className="app-press w-full text-left rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
          <p className="app-label">Last message</p>
          {last ? (
            <>
              <p className="mt-2 text-[16px] font-bold leading-snug">{last.title}</p>
              <p className="text-[13px] text-[var(--app-muted)]">
                {shortAgo(last.sentAt) === 'now' ? 'Just now' : `${shortAgo(last.sentAt)} ago`} · reached {last.recipients} {last.recipients === 1 ? 'phone' : 'phones'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[15px] text-[var(--app-muted)]">Nothing sent yet. Tell your members what’s on during the week.</p>
          )}
          {waiting > 0 && <p className="mt-2 text-[13px] font-bold text-[var(--app-primary)]">1 message to everyone waiting for the admins</p>}
          <p className="mt-3 text-[15px] font-semibold text-[var(--app-primary)]">Write a message ›</p>
        </button>
        <button type="button" onClick={() => goTo('invite')} className="app-press w-full text-left rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
          <p className="app-label">Grow it</p>
          <p className="mt-2 text-[15px]">Share your invite link, QR or a card for X and Telegram. Everyone who joins through it counts for {c.community_name}.</p>
          <p className="mt-3 text-[15px] font-semibold text-[var(--app-primary)]">Invite people ›</p>
        </button>
        <DetailsCard c={c} />
      </div>
    </div>
  );
}

/**
 * Community mode, for a community's leads (and admins helping out): like
 * admin mode, its own screens and tab bar over the app, switched from the
 * LEAD badge top right.
 */
export function CommunityMode({
  communityId,
  people,
  adminRole,
  onOpenPerson,
  onSwitch,
}: {
  communityId: string;
  people: PersonProfile[];
  adminRole: AdminRole | null;
  onOpenPerson: (id: string) => void;
  onSwitch: (t: ModeTarget) => void;
}) {
  const { authUser, myProfile } = usePeopleStore();
  const { byId, mine, communities } = useCommunities(authUser?.id ?? null, myProfile?.id ?? null);
  const [tab, setTab] = useState<Tab>('home');
  const data = useCommunityRows(communityId, people);
  const scroller = useRef<HTMLDivElement>(null);
  const c = byId(communityId);
  // Its own look (teal to indigo): community mode feels like a separate app.
  const { resolved } = useAppTheme(false);
  const vars = communityVars(resolved === 'light') as CSSProperties;
  // Opening: the logo on the community's colour, then the app settles in. Leaving: it shrinks back into the badge.
  const [splash, setSplash] = useState(true);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 1150);
    return () => window.clearTimeout(t);
  }, []);
  const switchTo = (t: ModeTarget) => {
    if (t.kind === 'community' && t.id === communityId) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onSwitch(t);
    setLeaving(true);
    window.setTimeout(() => onSwitch(t), 340);
  };
  const led = (mine ?? []).filter((m) => m.role === 'lead').map((m) => communities.find((x) => x.id === m.communityId)).filter((x): x is Community => Boolean(x));

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab]);
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  return (
    <>
    {splash && c && (
      <div className="community-splash" style={vars} aria-hidden="true">
        <div className="community-splash-mark">
          <span className="block rounded-[28px] overflow-hidden shadow-2xl">
            <CommunityLogo c={c} size={104} />
          </span>
          <span className="mt-5 block text-[24px] font-extrabold tracking-tight">{c.community_name}</span>
          <span className="mt-1 block text-[13px] font-bold uppercase tracking-[0.18em] opacity-75">Community</span>
        </div>
      </div>
    )}
    <div
      style={vars}
      className={`community-app${leaving ? ' is-leaving' : ''} app fixed inset-0 z-[58] flex flex-col bg-[var(--app-bg)] [background-image:var(--app-glow)] bg-no-repeat`}
    >
      {/* Like admin mode: no back button top left; the LEAD badge switches. */}
      <header className="relative z-10 shrink-0 pt-[calc(env(safe-area-inset-top)+6px)] px-4 pb-2 h-[calc(env(safe-area-inset-top)+58px)] flex items-center gap-2.5 border-b border-[var(--app-line)]">
        {c ? <CommunityLogo c={c} size={32} /> : <span className="w-8 h-8" />}
        <span className="flex-1 min-w-0 leading-tight">
          <span className="block text-[16px] font-bold truncate">{c?.community_name ?? 'Community'}</span>
          <span className="block text-[12px] font-semibold text-[var(--c-accent)]">Community app</span>
        </span>
        <ModeMenu current={{ kind: 'community', id: communityId }} adminRole={adminRole} led={led} onPick={switchTo} />
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain pt-3 pb-8">
        {!c ? (
          <p className="pt-16 px-6 text-center text-[15px] text-[var(--app-muted)]">This community isn’t listed right now.</p>
        ) : (
          <>
            {tab === 'home' && <HomeTab c={c} data={data} goTo={setTab} isLead={led.length > 0} onOpenPerson={onOpenPerson} />}
            {tab === 'messages' && (
              <div>
                <Heading title="Messages" detail="Pushes to your members' phones, with your community's name on them." />
                <div className="mx-4">
                  <CommunityMessages communityId={c.id} communityName={c.community_name} canManage isMember={false} muted={false} onToggleMute={() => undefined} />
                </div>
              </div>
            )}
            {tab === 'members' && (
              <div>
                <Heading title="Members" detail={`${data.memberRows.length} member${data.memberRows.length === 1 ? '' : 's'}, and how each one joined.`} />
                <div className="mx-4 space-y-4">
                  <MemberList data={data} showVia onOpenPerson={onOpenPerson} />
                  <CoLeadCard c={c} />
                </div>
              </div>
            )}
            {tab === 'invite' && (
              <div>
                <Heading title="Invite" detail="Everyone who joins through your link counts for your community." />
                <div className="mx-4">
                  <InviteCard c={c} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <nav aria-label={c?.community_name ?? 'Community'} className="shrink-0 bg-[var(--app-surface)]/92 backdrop-blur-xl border-t border-[var(--app-line)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-[3px] ${active ? 'text-[var(--app-ink)]' : 'text-[var(--app-muted)]'}`}
              >
                <span className={`w-14 h-8 rounded-full flex items-center justify-center ${active ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : ''}`}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                </span>
                <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
    </>
  );
}
