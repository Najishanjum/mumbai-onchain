import React from 'react';
// Brand logos come from BrandIcons (lucide 1.x dropped them).
import { Check, Globe, Pencil, QrCode, UserPlus } from 'lucide-react';
import { GitHubLogo, LinkedInLogo, TelegramLogo, WhatsAppLogo, XLogo } from './BrandIcons';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { useConnectionCounts, type ConnectionCounts } from '../lib/useConnectionCounts';
import { isRealSnap } from '../lib/samples';
import { PersonAvatar } from '../components/PersonAvatar';
import { Chip, Sheet } from './ui';
import { roleColor } from './Badge';
import { dayLabel, sortByStart } from './time';

interface PersonSheetProps {
  person: PersonProfile | null;
  isCurrentUser: boolean;
  events: EventItem[];
  onClose: () => void;
  onOpenEvent: (id: string) => void;
  onEditProfile: () => void;
  onShowPass: () => void;
}

const handle = (h?: string) => h?.trim().replace(/^@/, '') || '';
const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

function socialLinks(p: PersonProfile) {
  const links: { label: string; href: string; icon: React.ReactNode }[] = [];
  const x = handle(p.xHandle);
  if (x) links.push({ label: `@${x}`, href: `https://x.com/${x}`, icon: <XLogo className="w-4 h-4" /> });
  const tg = handle(p.telegramHandle);
  if (tg) links.push({ label: 'Telegram', href: `https://t.me/${tg}`, icon: <TelegramLogo className="w-4 h-4" /> });
  const wa = p.whatsapp?.replace(/\D/g, '');
  if (wa) links.push({ label: 'WhatsApp', href: `https://wa.me/${wa}`, icon: <WhatsAppLogo className="w-4 h-4" /> });
  if (p.githubUrl) links.push({ label: 'GitHub', href: withScheme(p.githubUrl), icon: <GitHubLogo className="w-4 h-4" /> });
  if (p.linkedinUrl) links.push({ label: 'LinkedIn', href: withScheme(p.linkedinUrl), icon: <LinkedInLogo className="w-4 h-4" /> });
  const fc = handle(p.farcasterHandle);
  if (fc) links.push({ label: 'Farcaster', href: `https://warpcast.com/${fc}`, icon: <span className="font-bold text-[13px]">⌐◨</span> });
  if (p.websiteUrl) links.push({ label: 'Website', href: withScheme(p.websiteUrl), icon: <Globe className="w-4 h-4" /> });
  return links;
}

/**
 * Where "Message" goes: their Telegram chat if they added one (opens straight
 * into a chat), otherwise their X profile, where the DM button is one tap
 * away (X has no link that opens a DM from a handle alone).
 */
function messageLink(p: PersonProfile): { href: string; label: string; icon: React.ReactNode } | null {
  const tg = handle(p.telegramHandle);
  if (tg) return { href: `https://t.me/${tg}`, label: `Message ${p.name} on Telegram`, icon: <TelegramLogo className="w-[18px] h-[18px]" /> };
  const x = handle(p.xHandle);
  if (x) return { href: `https://x.com/${x}`, label: `Message ${p.name} on X`, icon: <XLogo className="w-[18px] h-[18px]" /> };
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="app-label">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export const PersonSheet: React.FC<PersonSheetProps> = ({
  person,
  isCurrentUser,
  events,
  onClose,
  onOpenEvent,
  onEditProfile,
  onShowPass,
}) => {
  const { myProfile, connections, setConnectionStatus } = usePeopleStore();
  const { getSnapsByAuthor, setActiveSnapForViewer } = useSnapStore();
  // Re-read when you add or remove them, so their "Added you" moves.
  const counts = useConnectionCounts(person?.id, person ? connections[person.id] : null);
  if (!person) return null;

  const added = connections[person.id] === 'CONNECTED';
  const links = socialLinks(person);
  const message = messageLink(person);
  const going = events.filter((e) => person.attendingEvents?.includes(e.id)).sort(sortByStart);
  const snaps = getSnapsByAuthor(person.id).filter(isRealSnap);
  // Reasons only make sense against the user's real profile, not the demo fallback.
  const reasons = !isCurrentUser && myProfile ? calculateMatchScore(myProfile, person, connections).reasons.slice(0, 3) : [];

  return (
    <Sheet open onClose={onClose} label={person.name}>
      {/* clear-both: the sheet's close button floats right, and a flex column
          beside a float shrinks to make room, pushing the profile to the left. */}
      <div className="clear-both px-5 pt-1 flex flex-col items-center text-center">
        <PersonAvatar name={person.name} avatarUrl={person.avatar} size="xl" className="rounded-full! border-0! w-24! h-24!" />
        <h2 className="app-title mt-3 text-[26px] font-bold leading-tight">{person.name}</h2>
        {person.headline && <p className="mt-1 text-[16px] leading-snug max-w-[32ch]">{person.headline}</p>}
        <p className="mt-2 flex items-center gap-2 text-[15px] text-[var(--app-muted)]">
          <span
            className="h-6 px-2.5 rounded-md text-[12px] font-extrabold tracking-[0.08em] text-[#0D1316] inline-flex items-center"
            style={{ background: roleColor(person.category) }}
          >
            {(person.category || 'Attendee').toUpperCase()}
          </span>
          {person.city}
        </p>
        {counts && <ConnectionCountsLine counts={counts} />}

        <div className="mt-5 w-full grid grid-cols-1 gap-2">
          {isCurrentUser ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onShowPass}
                className="app-press h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
              >
                <QrCode className="w-[18px] h-[18px]" aria-hidden="true" /> My pass
              </button>
              <button
                type="button"
                onClick={onEditProfile}
                className="app-press h-12 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
              >
                <Pencil className="w-[18px] h-[18px]" aria-hidden="true" /> Edit
              </button>
            </div>
          ) : (
            <div className={`grid gap-2 ${message ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={() => setConnectionStatus(person.id, added ? 'NOT_CONNECTED' : 'CONNECTED')}
                aria-pressed={added}
                className={`app-press h-12 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
                  added ? 'bg-[var(--app-surface)] border border-[var(--app-line)] text-[var(--app-muted)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
                }`}
              >
                {added ? <Check className="w-[18px] h-[18px]" /> : <UserPlus className="w-[18px] h-[18px]" />}
                {added ? 'In my people' : 'Add'}
              </button>
              {message && (
                <a
                  href={message.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={message.label}
                  className="app-press h-12 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
                >
                  {message.icon}
                  Message
                </a>
              )}
            </div>
          )}
        </div>

        {links.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="app-press h-9 px-3.5 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[14px] font-medium inline-flex items-center gap-1.5"
              >
                {l.icon}
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="px-5">
        {reasons.length > 0 && (
          <Section title="Why you should meet">
            <ul className="rounded-2xl bg-[var(--app-primary-soft)] p-4 space-y-1.5">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2 text-[15px]">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--app-primary)]" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {person.bio && (
          <Section title="About">
            <p className="text-[16px] leading-relaxed">{person.bio}</p>
          </Section>
        )}

        {person.currentlyBuilding && (
          <Section title="Building">
            <p className="text-[16px] leading-relaxed">{person.currentlyBuilding}</p>
          </Section>
        )}

        {person.lookingFor && (
          <Section title="Looking for">
            <p className="text-[16px] leading-relaxed">{person.lookingFor}</p>
          </Section>
        )}

        {(person.skills?.length ?? 0) + (person.interests?.length ?? 0) > 0 && (
          <Section title="Skills & interests">
            <div className="flex flex-wrap gap-2">
              {person.skills?.map((s) => (
                <Chip key={`s-${s}`}>{s}</Chip>
              ))}
              {person.interests?.map((s) => (
                <Chip key={`i-${s}`} tone="saved">
                  {s}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {going.length > 0 && (
          <Section title={`Going to · ${going.length}`}>
            <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
              {going.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEvent(e.id)}
                  className="app-press w-full flex items-baseline gap-3 px-4 py-3 text-left active:bg-[var(--app-pressed)]"
                >
                  <span className="w-[72px] shrink-0 text-[13px] font-semibold text-[var(--app-muted)]">
                    {dayLabel(e.startDate)}
                  </span>
                  <span className="flex-1 text-[15px] font-semibold leading-snug">{e.title}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {snaps.length > 0 && (
          <Section title="Highlights">
            <div className="grid grid-cols-3 gap-1.5">
              {snaps.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSnapForViewer(s)}
                  aria-label={s.caption || 'Snap'}
                  className="app-press aspect-square overflow-hidden rounded-lg bg-[var(--app-line)]"
                >
                  <img src={s.thumbnailUrl || s.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Sheet>
  );
};

/** "12 Added · 8 Added you" under a name. */
export function ConnectionCountsLine({ counts, className = 'mt-2' }: { counts: ConnectionCounts; className?: string }) {
  return (
    <p className={`${className} text-[14px] text-[var(--app-muted)]`}>
      <b className="text-[var(--app-ink)]">{counts.added}</b> Added
      <span aria-hidden="true"> · </span>
      <b className="text-[var(--app-ink)]">{counts.addedYou}</b> Added you
    </p>
  );
}
