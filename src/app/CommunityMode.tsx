import { useEffect, useRef, useState } from 'react';
import { Home, Megaphone, UserPlus, Users } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import type { AdminRole } from '../lib/useAdmin';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useCommunities, type Community } from '../lib/useCommunities';
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

function HomeTab({ c, data, goTo, isLead }: { c: Community; data: ReturnType<typeof useCommunityRows>; goTo: (t: Tab) => void; isLead: boolean }) {
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
      <div className="mx-4 space-y-3">
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
    <div className="app fixed inset-0 z-[58] flex flex-col bg-[var(--app-bg)] [background-image:var(--app-glow)] bg-no-repeat">
      {/* Like admin mode: no back button top left; the LEAD badge switches. */}
      <header className="relative z-10 shrink-0 pt-[calc(env(safe-area-inset-top)+6px)] px-4 pb-2 h-[calc(env(safe-area-inset-top)+58px)] flex items-center gap-2.5 border-b border-[var(--app-line)]">
        {c ? <CommunityLogo c={c} size={32} /> : <span className="w-8 h-8" />}
        <span className="flex-1 text-[16px] font-bold truncate">{c?.community_name ?? 'Community'}</span>
        <ModeMenu current={{ kind: 'community', id: communityId }} adminRole={adminRole} led={led} onPick={onSwitch} />
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain pt-3 pb-8">
        {!c ? (
          <p className="pt-16 px-6 text-center text-[15px] text-[var(--app-muted)]">This community isn’t listed right now.</p>
        ) : (
          <>
            {tab === 'home' && <HomeTab c={c} data={data} goTo={setTab} isLead={led.length > 0} />}
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
  );
}
