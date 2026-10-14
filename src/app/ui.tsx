import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronRight, MapPin, X } from 'lucide-react';
import type { EventItem } from '../types/event';
import { isLive, timeRange } from './time';

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
      <h2 className="app-title text-[20px] font-bold">{title}</h2>
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-[15px] font-medium text-[var(--app-saved)] py-1 -my-1">
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
    <span className="relative inline-flex w-2 h-2" aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-[var(--app-live)] opacity-60 motion-safe:animate-ping" />
      <span className="relative w-2 h-2 rounded-full bg-[var(--app-live)]" />
    </span>
  );
}

/** One line in a list of events: time · title/venue · save. */
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
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className="app-press flex items-center gap-3 pl-5 pr-3 py-3 bg-[var(--app-surface)] active:bg-[#F7F6F2] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-saved)] focus-visible:ring-inset"
    >
      <div className="w-[52px] shrink-0 self-start pt-0.5">
        {showDate && <div className="text-[12px] font-semibold text-[var(--app-muted)] leading-tight">{showDate}</div>}
        <div className="text-[15px] font-semibold leading-tight">
          {event.startTime === 'TBA' ? 'TBA' : event.startTime}
        </div>
        {live && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--app-live)]">
            <LiveDot /> Now
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold leading-snug line-clamp-2">{event.title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[14px] text-[var(--app-muted)] min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{event.location}</span>
          {event.startDate !== event.endDate && <span className="shrink-0">· {timeRange(event).split(' · ')[1]}</span>}
        </div>
      </div>
      <SaveButton saved={saved} onToggle={onToggleSave} title={event.title} />
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
          <span className="w-10 h-1.5 rounded-full bg-black/20" aria-hidden="true" />
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
      className="app-press w-full flex items-center gap-3 px-4 py-3.5 text-left bg-[var(--app-surface)] active:bg-[#F7F6F2]"
    >
      <span className="w-8 h-8 rounded-lg bg-[var(--app-bg)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 text-[16px] font-medium">{label}</span>
      {detail && <span className="text-[15px] text-[var(--app-muted)]">{detail}</span>}
      <ChevronRight className="w-4 h-4 text-[var(--app-faint)]" aria-hidden="true" />
    </button>
  );
}
