import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Clock, ExternalLink, MapPin, Presentation, Search, X } from 'lucide-react';
import { PersonAvatar } from '../components/PersonAvatar';
import { DEVCON_DAYS, fetchSessionDetails, istTime, sessionEventId, type DevconSession, type SessionDetails } from '../lib/devconSessions';
import { Chip, LiveDot, SaveButton, Sheet } from './ui';
import { dayLabel, dayNumber, istDateKey, weekdayShort } from './time';

const isNow = (s: DevconSession, now = Date.now()) => Date.parse(s.starts_at) <= now && now < Date.parse(s.ends_at);
const ended = (s: DevconSession, now = Date.now()) => Date.parse(s.ends_at) <= now;

interface ProgrammeSheetProps {
  open: boolean;
  onClose: () => void;
  sessions: DevconSession[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  onOpenSession: (code: string) => void;
}

/** Devcon 8's programme by day, with stage filter and search. */
export const ProgrammeSheet: React.FC<ProgrammeSheetProps> = ({ open, onClose, sessions, isSaved, toggleSaved, onOpenSession }) => {
  const today = istDateKey();
  const [day, setDay] = useState(() => (DEVCON_DAYS.includes(today) ? today : DEVCON_DAYS[0]));
  const [room, setRoom] = useState('');
  const [query, setQuery] = useState('');

  const ofDay = useMemo(() => sessions.filter((s) => s.day === day), [sessions, day]);
  const rooms = useMemo(() => {
    const n = new Map<string, number>();
    ofDay.forEach((s) => n.set(s.room, (n.get(s.room) ?? 0) + 1));
    return [...n.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ofDay]);

  const q = query.trim().toLowerCase();
  // While searching, all four days; ended sessions go last.
  const list = (q ? sessions : ofDay)
    .filter((s) => !room || s.room === room)
    .filter((s) => !q || [s.title, s.room, s.track, ...s.speakers.map((p) => p.name), ...s.tags].some((f) => f?.toLowerCase().includes(q)))
    .sort((a, b) => Number(ended(a)) - Number(ended(b)) || a.starts_at.localeCompare(b.starts_at) || a.room.localeCompare(b.room));

  return (
    <Sheet open={open} onClose={onClose} label="Devcon 8 programme">
      <div className="px-5 pt-6">
        <p className="text-[13px] font-semibold text-[var(--app-muted)]">Devcon 8 · Jio World Centre</p>
        <h2 className="app-title mt-0.5 text-[26px] font-bold leading-tight">Programme</h2>
        <p className="mt-1 text-[14px] text-[var(--app-muted)]">
          {sessions.length ? `${sessions.length} sessions on stages and hubs. Save one to add it to My plan.` : 'Loading the programme…'}
        </p>

        <div className="mt-4 flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)]">
          <Search className="w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Talks, speakers, topics"
            aria-label="Search sessions"
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="app-press -mr-1 w-8 h-8 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!q && (
        <div className="mt-3 px-5 grid grid-cols-4 gap-1.5">
          {DEVCON_DAYS.map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDay(d);
                  setRoom('');
                }}
                aria-pressed={active}
                aria-label={dayLabel(d, today)}
                className={`app-press py-1.5 rounded-xl flex flex-col items-center ${
                  active ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : d === today ? 'text-[var(--app-today)] ring-2 ring-inset ring-[var(--app-today)]' : 'bg-[var(--app-surface)]'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase ${active ? 'text-[var(--app-on-primary)]/70' : 'text-[var(--app-muted)]'}`}>
                  {d === today ? 'Today' : weekdayShort(d)}
                </span>
                <span className="text-[18px] font-bold leading-tight">{dayNumber(d)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 px-5">
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          aria-label="Stage or hub"
          className="w-full h-10 px-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold"
        >
          <option value="">All stages and hubs{q ? '' : ` · ${ofDay.length}`}</option>
          {(q ? [...new Set(sessions.map((s) => s.room))].sort().map((r) => [r, 0] as const) : rooms).map(([r, n]) => (
            <option key={r} value={r}>
              {r}
              {n ? ` · ${n}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        {list.length > 0 ? (
          <div className="mx-4 rounded-2xl overflow-hidden bg-[var(--app-surface)] divide-y divide-[var(--app-line)] border border-[var(--app-line)]">
            {list.map((s) => (
              <SessionRow
                key={s.code}
                session={s}
                showDay={Boolean(q)}
                saved={isSaved(sessionEventId(s.code))}
                onToggleSave={() => toggleSaved(sessionEventId(s.code))}
                onOpen={() => onOpenSession(s.code)}
              />
            ))}
          </div>
        ) : (
          sessions.length > 0 && <p className="mx-5 py-8 text-center text-[15px] text-[var(--app-muted)]">{q ? 'No matching sessions.' : 'Nothing here this day.'}</p>
        )}
      </div>
    </Sheet>
  );
};

function SessionRow({
  session: s,
  saved,
  showDay,
  onToggleSave,
  onOpen,
}: {
  session: DevconSession;
  saved: boolean;
  showDay: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  const live = isNow(s);
  const done = !live && ended(s);
  const who = s.speakers.map((p) => p.name).join(', ');
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className={`app-press flex gap-3 pl-4 pr-2 py-3 active:bg-[var(--app-pressed)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-inset ${done ? 'opacity-60' : ''}`}
    >
      <div className="w-12 shrink-0 pt-0.5">
        {showDay && <div className="text-[11px] font-semibold uppercase text-[var(--app-muted)]">{weekdayShort(s.day)}</div>}
        <div className="app-mono text-[14px] font-semibold">{istTime(s.starts_at)}</div>
        {live ? (
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--app-live)]">
            <LiveDot /> Now
          </div>
        ) : (
          <div className="app-mono text-[12px] text-[var(--app-muted)]">{istTime(s.ends_at)}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold leading-snug line-clamp-2">{s.title}</div>
        <div className="mt-0.5 text-[13px] text-[var(--app-muted)] truncate">
          {s.room}
          {s.format ? ` · ${s.format}` : ''}
        </div>
        {who && <div className="text-[13px] text-[var(--app-muted)] truncate">{who}</div>}
      </div>
      {(!done || saved) && (
        <div className="self-start">
          <SaveButton saved={saved} onToggle={onToggleSave} title={s.title} />
        </div>
      )}
    </div>
  );
}

interface SessionSheetProps {
  session: DevconSession | null;
  onClose: () => void;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}

/** One session: when and where, speakers, what it's about. */
export const SessionSheet: React.FC<SessionSheetProps> = ({ session, onClose, isSaved, toggleSaved }) => {
  const [details, setDetails] = useState<{ code: string; d: SessionDetails | null } | null>(null);
  const code = session?.code;
  useEffect(() => {
    if (!code) return;
    let live = true;
    void fetchSessionDetails(code).then((d) => live && setDetails({ code, d }));
    return () => {
      live = false;
    };
  }, [code]);
  if (!session) return null;

  const s = session;
  const id = sessionEventId(s.code);
  const saved = isSaved(id);
  const live = isNow(s);
  const done = !live && ended(s);
  const d = details?.code === s.code ? details.d : null;
  const about = d?.description || d?.summary || '';

  return (
    <Sheet open onClose={onClose} label={s.title}>
      <div className="px-5 pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Devcon 8</Chip>
          {s.format && <Chip>{s.format}</Chip>}
          {live && (
            <Chip tone="live">
              <span className="mr-1.5 inline-flex">
                <LiveDot />
              </span>
              On now
            </Chip>
          )}
        </div>
        <h2 className="app-title mt-3 text-[24px] font-bold leading-tight">{s.title}</h2>

        <div className="mt-5 space-y-3">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 mt-0.5 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
            <div>
              <div className="text-[16px] font-semibold">{dayLabel(s.day)}</div>
              <div className="text-[15px] text-[var(--app-muted)]">
                {istTime(s.starts_at)}–{istTime(s.ends_at)} IST
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
            <div>
              <div className="text-[16px] font-semibold">{s.room}</div>
              <div className="text-[15px] text-[var(--app-muted)]">Jio World Centre, BKC</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {done && !saved ? (
            <span className="h-12 rounded-full bg-[var(--app-segment)] text-[15px] font-semibold text-[var(--app-muted)] inline-flex items-center justify-center">Ended</span>
          ) : (
            <button
              type="button"
              onClick={() => toggleSaved(id)}
              aria-pressed={saved}
              className={`app-press h-12 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
                saved ? 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]' : 'bg-[var(--app-primary)] text-[var(--app-on-primary)]'
              }`}
            >
              <Bookmark className="w-[18px] h-[18px]" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
              {saved ? 'In your plan' : 'Save'}
            </button>
          )}
          <a
            href={s.url || 'https://app.devcon.org/schedule'}
            target="_blank"
            rel="noopener noreferrer"
            className="app-press h-12 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-[18px] h-[18px]" aria-hidden="true" /> Devcon app
          </a>
        </div>

        {s.speakers.length > 0 && (
          <section className="mt-7">
            <h3 className="app-label">{s.speakers.length === 1 ? 'Speaker' : 'Speakers'}</h3>
            <div className="mt-2 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
              {s.speakers.map((p) => {
                const inner = (
                  <>
                    <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-semibold truncate">{p.name}</span>
                      {p.x && <span className="block text-[13px] text-[var(--app-muted)] truncate">@{p.x}</span>}
                    </span>
                  </>
                );
                return p.x ? (
                  <a
                    key={p.name}
                    href={`https://x.com/${encodeURIComponent(p.x)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-press flex items-center gap-3 px-4 py-2.5 active:bg-[var(--app-pressed)]"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={p.name} className="flex items-center gap-3 px-4 py-2.5">
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {about && (
          <section className="mt-7">
            <h3 className="app-label">About</h3>
            <p className="mt-2 text-[16px] leading-relaxed whitespace-pre-line">{about}</p>
          </section>
        )}

        {d?.slides && (
          <a
            href={d.slides}
            target="_blank"
            rel="noopener noreferrer"
            className="app-press mt-4 h-11 px-5 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-medium inline-flex items-center gap-2"
          >
            <Presentation className="w-4 h-4" aria-hidden="true" /> Slides
          </a>
        )}

        {(s.track || s.level || s.tags.length > 0) && (
          <section className="mt-7">
            <h3 className="app-label">Topics</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.track && <Chip>{s.track}</Chip>}
              {s.level && <Chip>{s.level}</Chip>}
              {s.tags.filter((t) => t !== s.track && t !== s.room).map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </section>
        )}
      </div>
    </Sheet>
  );
};
