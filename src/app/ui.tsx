import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import type { EventItem } from '../types/event';
import { isLive, VENUE_TBA } from './time';
import { eventCover } from './covers';
import { useBackToClose } from '../lib/useBackToClose';

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between px-5 mb-2.5">
      <h2 className="app-title text-[20px]">{title}</h2>
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-[15px] font-semibold text-[var(--app-primary)] py-1 -my-1">
          {action}
        </button>
      )}
    </div>
  );
}

export function SaveButton({
  saved,
  onToggle,
  title,
  size = 'md',
}: {
  saved: boolean;
  onToggle: () => void;
  title: string;
  size?: 'md' | 'lg';
}) {
  const box = size === 'lg' ? 'w-11 h-11' : 'w-10 h-10';
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from your plan` : `Save ${title} to your plan`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`app-press shrink-0 ${box} rounded-full flex items-center justify-center ${
        saved ? 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]' : 'text-[var(--app-faint)] hover:text-[var(--app-muted)]'
      }`}
    >
      <Bookmark className="w-[19px] h-[19px]" fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}

export function LiveDot() {
  return (
    <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[var(--app-live)] ring-4 ring-[var(--app-live-soft)]" aria-hidden="true" />
  );
}

// Generated cover for events without artwork: a flat badge-band colour
// picked from the title so each one is stable, with the title in dark type.
const FALLBACK_COLORS = ['var(--role-builder)', 'var(--role-founder)', 'var(--role-attendee)', 'var(--role-volunteer)', 'var(--role-student)'];

function FallbackCover({ title, big = false }: { title: string; big?: boolean }) {
  const hash = [...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return (
    <div
      className="w-full h-full flex items-end p-2.5 text-[#0D1316]"
      style={{ background: FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length] }}
    >
      <span className={`font-extrabold leading-[1.05] tracking-tight line-clamp-3 ${big ? 'text-[28px] p-3' : 'text-[12px]'}`}>
        {title}
      </span>
    </div>
  );
}

/** Square cover thumbnail with an optional status pill, Luma style. */
export function CoverThumb({
  src,
  title,
  badge,
  size = 84,
}: {
  src: string | null;
  title: string;
  badge?: { label: string; tone: 'live' | 'saved' } | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative shrink-0 self-start" style={{ width: size, height: size + (badge ? 8 : 0) }}>
      <div className="w-full rounded-[14px] overflow-hidden bg-[var(--app-segment)]" style={{ height: size }}>
        {src && !failed ? (
          <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
        ) : (
          <FallbackCover title={title} />
        )}
      </div>
      {badge && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 bottom-0 h-6 px-2.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap border-2 border-[var(--app-surface)] ${
            badge.tone === 'live'
              ? 'bg-[var(--app-live)] text-white'
              : 'bg-[var(--app-saved)] text-[var(--app-on-primary)]'
          }`}
        >
          {badge.tone === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />}
          {badge.label}
        </span>
      )}
    </div>
  );
}

/**
 * Big cover for the event sheet and Today's next-event card. Square Luma art
 * and wide website banners both show uncropped, over a blurred copy of
 * themselves that fills the frame.
 */
export function CoverHero({ src, title, height = 260 }: { src: string | null; title: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div style={{ height }} className="overflow-hidden">
        <FallbackCover title={title} big />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden bg-[var(--app-segment)]" style={{ height }}>
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70" />
      <img src={src} alt={`${title} cover`} onError={() => setFailed(true)} className="relative w-full h-full object-contain" />
    </div>
  );
}

function whenShort(e: EventItem, showDate?: string): string {
  if (e.startDate !== e.endDate) {
    const f = (d: string) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
    return `${f(e.startDate)} – ${f(e.endDate)}`;
  }
  const time = e.startTime === 'TBA' ? 'Time TBA' : e.startTime;
  return showDate ? `${showDate}, ${time}` : time;
}

/** One event in a list, Luma style: cover · host, title, time, place · save. */
export function EventRow({
  event,
  saved,
  onToggleSave,
  onOpen,
  showDate,
}: {
  event: EventItem;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
  showDate?: string;
}) {
  const live = isLive(event);
  const badge = live ? { label: 'Now', tone: 'live' as const } : saved ? { label: 'Saved', tone: 'saved' as const } : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className="app-press flex gap-3.5 pl-4 pr-2 py-3.5 bg-[var(--app-surface)] active:bg-[var(--app-pressed)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-inset"
    >
      <CoverThumb src={eventCover(event)} title={event.title} badge={badge} />
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] text-[var(--app-muted)] truncate">{event.organizer}</div>
        <div className="mt-0.5 text-[16px] font-semibold leading-snug line-clamp-2">{event.title}</div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[14px] text-[var(--app-muted)] min-w-0">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="app-mono text-[13px] truncate">{whenShort(event, showDate)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[14px] text-[var(--app-muted)] min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{event.location === VENUE_TBA ? 'Venue TBA' : event.location}</span>
        </div>
      </div>
      <div className="self-start">
        <SaveButton saved={saved} onToggle={onToggleSave} title={event.title} />
      </div>
    </div>
  );
}

/**
 * Bottom sheet, iOS style: slides up, dims the page, closes on the X, a tap
 * on the backdrop, Escape, or a swipe down from the top of its content.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
  hideClose = false,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  /** For sheets with their own header (e.g. Cancel / Save). */
  hideClose?: boolean;
  /** False while a form has unsaved edits: no backdrop tap, Escape or swipe. */
  dismissible?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  // iPhone edge swipe or Android back closes the sheet (not while a form has unsaved edits).
  useBackToClose(open, () => dismissible && onClose());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissible && onClose();
    window.addEventListener('keydown', onKey);
    // Stop the page behind from scrolling while the sheet is up.
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose, dismissible]);

  // A new event or person in an already-open sheet starts at the top.
  useEffect(() => {
    if (open && panelRef.current) panelRef.current.scrollTop = 0;
  }, [open, label]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    // Only start a dismiss drag when the content is scrolled to the top.
    startY.current = dismissible && (panelRef.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 110) onClose();
    else setDragY(0);
    startY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div
        className="app-backdrop absolute inset-0 bg-black/40"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className="app app-sheet relative w-full max-w-lg max-h-[calc(100dvh-env(safe-area-inset-top)-12px)] overflow-y-auto overscroll-contain rounded-t-[28px] bg-[var(--app-bg)] outline-none pb-[calc(env(safe-area-inset-bottom)+24px)] transition-transform duration-200"
      >
        <div className="sticky top-0 z-10 flex justify-center pt-2 pb-1 pointer-events-none">
          <span className="w-10 h-1.5 rounded-full bg-[var(--app-faint)]/60" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          hidden={hideClose}
          className="app-press sticky top-2 z-20 float-right mr-3 -mt-5 w-9 h-9 rounded-full bg-[var(--app-surface)]/90 backdrop-blur border border-[var(--app-line)] flex items-center justify-center"
        >
          <X className="w-[18px] h-[18px]" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Chip({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'live' | 'saved' }) {
  const tones = {
    plain: 'bg-[var(--app-surface)] border border-[var(--app-line)]',
    live: 'bg-[var(--app-live-soft)] text-[var(--app-live)]',
    saved: 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]',
  };
  return <span className={`inline-flex items-center h-7 px-3 rounded-full text-[13px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function GroupedList({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden bg-[var(--app-surface)] divide-y divide-[var(--app-line)] border border-[var(--app-line)]">
      {children}
    </div>
  );
}

export function RowLink({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-press w-full flex items-center gap-3 px-4 py-3.5 text-left bg-[var(--app-surface)] active:bg-[var(--app-pressed)]"
    >
      <span className="w-8 h-8 rounded-lg bg-[var(--app-bg)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 text-[16px] font-medium">{label}</span>
      {detail && <span className="text-[15px] text-[var(--app-muted)]">{detail}</span>}
      <ChevronRight className="w-4 h-4 text-[var(--app-faint)]" aria-hidden="true" />
    </button>
  );
}
