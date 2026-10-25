import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, ChevronLeft, Copy, Crown, Image as ImageIcon, KeyRound, Loader2, QrCode, Search, Share2, UserPlus, Users } from 'lucide-react';
import { useBackToClose } from '../lib/useBackToClose';
import { CommunityCardSheet } from './CommunityCardSheet';
import { CommunityMessages } from './CommunityMessages';
import { setMuted } from '../lib/useBroadcasts';
import type { PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useAdminRole } from '../lib/useAdmin';
import {
  MAX_COMMUNITIES,
  communityLink,
  createClaimCode,
  useCommunities,
  useCommunityMembers,
  type Community,
  type JoinedVia,
} from '../lib/useCommunities';
import { Sheet } from './ui';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const VIA: Record<JoinedVia, string> = { link: 'joined by link', picked: 'picked it', email: 'lead · application email', claim: 'lead · claim code' };

const primary = 'app-press h-11 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60';
const plain = 'app-press h-11 px-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold inline-flex items-center justify-center gap-2';
const input = 'w-full h-12 px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)]';

export function CommunityLogo({ c, size = 44 }: { c: Pick<Community, 'community_name' | 'community_logo_url'>; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (c.community_logo_url && !broken) {
    // Whole logo, never cropped: wide wordmarks fit inside the white tile.
    return <img src={c.community_logo_url} alt="" style={{ ...style, padding: Math.round(size * 0.08) }} onError={() => setBroken(true)} className="rounded-xl object-contain bg-white shrink-0" />;
  }
  return (
    <span style={style} className="rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] font-extrabold flex items-center justify-center shrink-0" aria-hidden="true">
      {c.community_name.slice(0, 1).toUpperCase()}
    </span>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Link, QR and share for one community. */
export function InviteCard({ c }: { c: Community }) {
  const link = communityLink(c.slug);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  useEffect(() => {
    if (!showQr || qr) return;
    QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: '#0A0A0C', light: '#FFFFFF' } }).then(setQr, () => setShowQr(false));
  }, [showQr, qr, link]);

  async function share() {
    const text = `Join ${c.community_name} on Mumbai Onchain, the app for IBW, Devcon 8 and ETHGlobal Mumbai.`;
    try {
      if (navigator.share) await navigator.share({ title: c.community_name, text, url: link });
      else if (await copyText(`${text} ${link}`)) setCopied(true);
    } catch {
      // closed the share sheet
    }
  }

  return (
    <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <p className="app-label">Invite people</p>
      <p className="mt-1 text-[14px] text-[var(--app-muted)]">Anyone who installs through this link joins {c.community_name}.</p>
      <p className="mt-3 px-3.5 py-2.5 rounded-xl bg-[var(--app-bg)] font-['Red_Hat_Mono'] text-[13px] break-all select-all">{link}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" className={plain} onClick={async () => setCopied(await copyText(link))}>
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className={plain} onClick={share}>
          <Share2 className="w-4 h-4" aria-hidden="true" /> Share
        </button>
        <button type="button" className={plain} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          <QrCode className="w-4 h-4" aria-hidden="true" /> QR
        </button>
      </div>
      {showQr && (
        <div className="mt-3 flex justify-center">
          {qr ? <img src={qr} alt={`QR code for ${c.community_name}'s invite link`} className="w-56 h-56 rounded-2xl" /> : <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Making the QR code" />}
        </div>
      )}
      <button type="button" className={`${primary} mt-2 w-full`} onClick={() => setCardOpen(true)}>
        <ImageIcon className="w-4 h-4" aria-hidden="true" /> Share card for X, Telegram or stories
      </button>
      <CommunityCardSheet community={cardOpen ? c : null} onClose={() => setCardOpen(false)} />
    </div>
  );
}

/** Leaders and admins: a one-use code that makes someone a leader. */
export function CoLeadCard({ c }: { c: Pick<Community, 'id' | 'community_name'> }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const message = code
    ? `You're invited to lead ${c.community_name} on Mumbai Onchain. Open the app → Me → I lead a community, and enter ${code} (works once, for 7 days). Or open ${window.location.origin}/app?claim=${code}`
    : '';
  async function make() {
    setBusy(true);
    setError('');
    const next = await createClaimCode(c.id);
    setBusy(false);
    if (next) setCode(next);
    else setError('Couldn’t make a code. Try again.');
  }
  return (
    <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <p className="app-label">Add a leader</p>
      <p className="mt-1 text-[14px] text-[var(--app-muted)]">Make a one-use code and send it to them privately. Whoever enters it can message members and add leaders.</p>
      {code ? (
        <>
          <p className="mt-3 text-center font-['Red_Hat_Mono'] text-[28px] font-bold tracking-[0.2em] select-all">{code}</p>
          <button type="button" className={`${primary} mt-3 w-full`} onClick={async () => setCopied(await copyText(message))}>
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? 'Message copied' : 'Copy message to send'}
          </button>
        </>
      ) : (
        <button type="button" className={`${plain} mt-3 w-full`} onClick={make} disabled={busy}>
          <KeyRound className="w-4 h-4" aria-hidden="true" /> {busy ? 'Making…' : 'Make a leader code'}
        </button>
      )}
      {error && <p className="mt-2 text-[14px] text-[var(--app-live)]">{error}</p>}
    </div>
  );
}

/** A community's members joined with their profiles, and the numbers from them. */
export function useCommunityRows(communityId: string | null, people: PersonProfile[], refreshKey = 0) {
  const members = useCommunityMembers(communityId, refreshKey);
  const rows = useMemo(
    () =>
      (members ?? [])
        .map((m) => ({ m, p: people.find((p) => p.id === m.profileId) }))
        .filter((r): r is { m: (typeof r)['m']; p: PersonProfile } => Boolean(r.p)),
    [members, people]
  );
  const memberRows = rows.filter((r) => r.m.role === 'member');
  return {
    loading: members === null,
    rows,
    memberRows,
    thisWeek: memberRows.filter((r) => Date.now() - new Date(r.m.joinedAt).getTime() < WEEK_MS).length,
    credited: memberRows.filter((r) => r.m.credited),
  };
}
type Rows = ReturnType<typeof useCommunityRows>;

/** Counted, by link, picked: how a community is growing. */
export function CommunityNumbers({ data }: { data: Rows }) {
  const { credited } = data;
  return (
    <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
      <p className="app-label">Your numbers</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Counted', credited.length],
          ['By link', credited.filter((r) => r.m.joinedVia === 'link').length],
          ['Picked', credited.filter((r) => r.m.joinedVia === 'picked').length],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl bg-[var(--app-bg)] py-3">
            <div className="text-[24px] font-extrabold tabular-nums">{n}</div>
            <div className="text-[12px] text-[var(--app-muted)]">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-[var(--app-muted)]">Counted: people whose first community is this one. Members in several communities count once, for the first.</p>
    </div>
  );
}

/** Everyone in a community, leads first. Leads and admins also see how each joined. */
export function MemberList({ data, showVia, onOpenPerson }: { data: Rows; showVia: boolean; onOpenPerson: (id: string) => void }) {
  if (data.loading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading members" />
      </div>
    );
  }
  if (!data.rows.length) {
    return (
      <p className="px-1 mt-2 flex items-center gap-2 text-[15px] text-[var(--app-muted)]">
        <Users className="w-4 h-4" aria-hidden="true" /> Nobody yet. Share the invite link to bring people in.
      </p>
    );
  }
  return (
    <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
      {data.rows.map(({ m, p }) => (
        <button key={p.id} type="button" onClick={() => onOpenPerson(p.id)} className="app-press w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--app-pressed)]">
          <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold truncate">{p.name}</span>
            <span className="block text-[13px] text-[var(--app-muted)] truncate">{showVia ? VIA[m.joinedVia] : p.headline || p.category}</span>
          </span>
          {m.role === 'lead' && <span className="h-6 px-2.5 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[12px] font-bold inline-flex items-center">Lead</span>}
        </button>
      ))}
    </div>
  );
}

interface CommunitySheetProps {
  communityId: string | null;
  onClose: () => void;
  people: PersonProfile[];
  onOpenPerson: (id: string) => void;
  /** Leads (and admins): open community mode for this community. */
  onManage: (id: string) => void;
}

/**
 * A community's page, full screen like About: what it is, its messages,
 * the invite link and its members. Running it happens in community mode.
 */
export const CommunitySheet: React.FC<CommunitySheetProps> = ({ communityId, onClose, people, onOpenPerson, onManage }) => {
  const { authUser, myProfile } = usePeopleStore();
  const adminRole = useAdminRole();
  const { byId, mine, join, leave, refresh: refreshMine } = useCommunities(authUser?.id ?? null, myProfile?.id ?? null);
  const [refresh, setRefresh] = useState(0);
  const data = useCommunityRows(communityId, people, refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  useBackToClose(communityId !== null, onClose);

  const c = communityId ? byId(communityId) : null;
  const me = mine?.find((m) => m.communityId === communityId) ?? null;
  const isLead = me?.role === 'lead';

  if (!communityId) return null;

  async function onJoin() {
    if (!c) return;
    setBusy(true);
    setError((await join(c.id, 'picked')) ?? '');
    setBusy(false);
    setRefresh((n) => n + 1);
  }
  async function onLeave() {
    if (!c) return;
    setBusy(true);
    await leave(c.id);
    setBusy(false);
    setConfirmLeave(false);
    setRefresh((n) => n + 1);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={c?.community_name ?? 'Community'} className="app app-page-in fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)]">
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 flex items-center gap-1 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} aria-label="Back" className="app-press w-11 h-11 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <h1 className="app-title text-[20px] truncate">{c?.community_name ?? 'Community'}</h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+32px)] space-y-4">
        {!c ? (
          <p className="pt-10 text-center text-[15px] text-[var(--app-muted)]">This community isn’t listed right now.</p>
        ) : (
          <>
            <header className="px-1 flex items-start gap-3.5">
              <CommunityLogo c={c} size={64} />
              <div className="min-w-0 flex-1">
                <h2 className="app-title text-[24px] font-bold leading-tight">{c.community_name}</h2>
                <p className="mt-1 text-[15px] text-[var(--app-muted)]">
                  {data.memberRows.length} member{data.memberRows.length === 1 ? '' : 's'}
                  {data.thisWeek > 0 && ` · ${data.thisWeek} new this week`}
                </p>
                {me && (
                  <span className="mt-2 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[13px] font-semibold">
                    {isLead ? <Crown className="w-3.5 h-3.5" aria-hidden="true" /> : <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    {isLead ? 'You lead this' : 'You’re a member'}
                  </span>
                )}
              </div>
            </header>
            {c.community_description && <p className="px-1 text-[15px] leading-relaxed line-clamp-4">{c.community_description}</p>}

            {(isLead || adminRole) && (
              <button type="button" className={`${primary} w-full`} onClick={() => onManage(c.id)}>
                <Crown className="w-4 h-4" aria-hidden="true" /> {isLead ? 'Open lead mode' : 'Manage as admin'}
              </button>
            )}
            {!me && myProfile && (
              <button type="button" className={`${primary} w-full`} onClick={onJoin} disabled={busy}>
                <UserPlus className="w-4 h-4" aria-hidden="true" /> Join {c.community_name}
              </button>
            )}
            {error && <p className="px-1 text-[14px] text-[var(--app-live)]">{error}</p>}

            <CommunityMessages
              communityId={c.id}
              communityName={c.community_name}
              canManage={false}
              isMember={Boolean(me)}
              muted={Boolean(me?.muted)}
              onToggleMute={async () => {
                if (await setMuted(c.id, !me?.muted)) await refreshMine();
              }}
            />

            <InviteCard c={c} />

            <section>
              <h3 className="px-1 mb-2 app-label">Members</h3>
              <MemberList data={data} showVia={false} onOpenPerson={onOpenPerson} />
            </section>

            {me && me.role === 'member' && (
              <div className="px-1 pb-2">
                {confirmLeave ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[14px] text-[var(--app-muted)]">Leave {c.community_name}? You stop getting its messages.</span>
                    <button type="button" className={plain} onClick={() => setConfirmLeave(false)}>
                      Stay
                    </button>
                    <button type="button" className={`${plain} text-[var(--app-live)]`} onClick={onLeave} disabled={busy}>
                      Leave
                    </button>
                  </div>
                ) : (
                  <button type="button" className="h-10 text-[14px] font-semibold text-[var(--app-muted)]" onClick={() => setConfirmLeave(true)}>
                    Leave this community
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface JoinCommunitySheetProps {
  open: boolean;
  /** Start on the leader code, e.g. from a ?claim= link. */
  initialCode?: string | null;
  startWithClaim?: boolean;
  onClose: () => void;
  onOpenCommunity: (id: string) => void;
  onCreateProfile: () => void;
}

/** Pick communities to join, or enter a leader code. */
export const JoinCommunitySheet: React.FC<JoinCommunitySheetProps> = ({ open, initialCode, startWithClaim, onClose, onOpenCommunity, onCreateProfile }) => {
  const { authUser, myProfile } = usePeopleStore();
  const { communities, loaded, mine, join, claim } = useCommunities(authUser?.id ?? null, myProfile?.id ?? null);
  const [mode, setMode] = useState<'join' | 'claim'>('join');
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(startWithClaim || initialCode ? 'claim' : 'join');
    setCode(initialCode ?? '');
    setError('');
    setQuery('');
  }, [open, initialCode, startWithClaim]);

  const memberOf = new Set((mine ?? []).filter((m) => m.role === 'member').map((m) => m.communityId));
  const leads = new Set((mine ?? []).filter((m) => m.role === 'lead').map((m) => m.communityId));
  // Up to 3 in all, counting the ones you lead.
  const full = (mine ?? []).length >= MAX_COMMUNITIES;
  const q = query.trim().toLowerCase();
  const list = communities.filter((c) => !q || c.community_name.toLowerCase().includes(q));

  async function onJoin(c: Community) {
    setBusyId(c.id);
    setError((await join(c.id, 'picked')) ?? '');
    setBusyId(null);
  }
  async function onClaim(e: React.FormEvent) {
    e.preventDefault();
    setBusyId('claim');
    setError('');
    const res = await claim(code);
    setBusyId(null);
    if ('error' in res) return setError(res.error);
    onClose();
    onOpenCommunity(res.communityId);
  }

  return (
    <Sheet open={open} onClose={onClose} label={mode === 'join' ? 'Join a community' : 'I lead a community'}>
      <div className="px-4 pt-6 space-y-4">
        <header className="px-1">
          <h2 className="app-title text-[24px] font-bold">{mode === 'join' ? 'Your communities' : 'I lead a community'}</h2>
          <p className="mt-1 text-[15px] text-[var(--app-muted)]">
            {mode === 'join'
              ? `Join the communities you’re part of, up to ${MAX_COMMUNITIES}. You’ll hear from them during the week.`
              : 'Enter the 8-character code an admin or another leader sent you.'}
          </p>
        </header>

        {!myProfile ? (
          <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-5 text-center">
            <p className="text-[15px] text-[var(--app-muted)]">Make your pass first. Communities are linked to it.</p>
            <button
              type="button"
              className={`${primary} mt-3`}
              onClick={() => {
                onClose();
                onCreateProfile();
              }}
            >
              Create profile
            </button>
          </div>
        ) : mode === 'claim' ? (
          <form onSubmit={onClaim} className="space-y-3">
            <label htmlFor="claim-code" className="sr-only">
              Leader code
            </label>
            <input
              id="claim-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD2345"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="one-time-code"
              spellCheck={false}
              maxLength={12}
              className={`${input} text-center font-['Red_Hat_Mono'] text-[22px] tracking-[0.2em]`}
            />
            <button type="submit" className={`${primary} w-full`} disabled={busyId === 'claim' || code.replace(/[^A-Za-z0-9]/g, '').length < 8}>
              <KeyRound className="w-4 h-4" aria-hidden="true" /> {busyId === 'claim' ? 'Checking…' : 'Become a leader'}
            </button>
            <p className="text-[13px] text-[var(--app-muted)] text-center">
              Applied as a partner with the email you use here? You’re linked already, no code needed.
            </p>
          </form>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
              <label htmlFor="community-search" className="sr-only">
                Search communities
              </label>
              <input id="community-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search communities" className={`${input} pl-10`} />
            </div>
            {!loaded ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading communities" />
              </div>
            ) : (
              <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
                {list.map((c) => {
                  const joined = memberOf.has(c.id) || leads.has(c.id);
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button type="button" onClick={() => onOpenCommunity(c.id)} className="app-press flex-1 min-w-0 flex items-center gap-3 text-left">
                        <CommunityLogo c={c} size={36} />
                        <span className="text-[15px] font-semibold truncate">{c.community_name}</span>
                      </button>
                      {joined ? (
                        <span className="h-9 px-3 rounded-full text-[14px] font-semibold text-[var(--app-primary)] inline-flex items-center gap-1">
                          <Check className="w-4 h-4" aria-hidden="true" /> {leads.has(c.id) ? 'Lead' : 'Joined'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onJoin(c)}
                          disabled={busyId !== null || full}
                          className="app-press h-9 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-semibold disabled:opacity-40"
                        >
                          {busyId === c.id ? '…' : 'Join'}
                        </button>
                      )}
                    </div>
                  );
                })}
                {list.length === 0 && <p className="px-4 py-4 text-[15px] text-[var(--app-muted)]">No community called “{query}”.</p>}
              </div>
            )}
            {full && <p className="px-1 text-[14px] text-[var(--app-muted)]">You’re in {MAX_COMMUNITIES}, the most. Leave one from its page to join another.</p>}
          </>
        )}
        {error && <p className="px-1 text-[14px] text-[var(--app-live)]">{error}</p>}

        {myProfile && (
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'join' ? 'claim' : 'join');
              setError('');
            }}
            className="w-full h-11 text-[15px] font-semibold text-[var(--app-primary)]"
          >
            {mode === 'join' ? 'I lead a community' : 'Join a community instead'}
          </button>
        )}
      </div>
    </Sheet>
  );
};
