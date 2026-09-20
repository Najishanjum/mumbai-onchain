import React, { useRef, useState, useEffect } from 'react';
import {
  useScroll,
  useTransform,
  useReducedMotion,
  motion,
  type MotionValue,
} from 'framer-motion';
import type { EventItem } from '../types/event';
import { formatDateDisplay } from '../lib/date';

// ─────────────────────────────────────────────────────────────────────────────
// Static imports used inside card content
// ─────────────────────────────────────────────────────────────────────────────
import { StatusBadge } from './StatusBadge';
import { CalendarButton } from './CalendarButton';
import { MapPin, ArrowUpRight, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

interface DaySlot {
  date: string;
  dayNumber: string;
  weekday: string;
  monthLabel: string;
  events: EventItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAY_DATES = [
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
  '2026-11-06',
  '2026-11-07',
  '2026-11-08',
];

const SCROLL_PER_CARD_VH = 110;

// ─────────────────────────────────────────────────────────────────────────────
// Card content (shared by animated + static fallback)
// ─────────────────────────────────────────────────────────────────────────────

const DayCardContent: React.FC<{
  slot: DaySlot;
  index: number;
  totalCards: number;
  onSelectEvent: (id: string) => void;
}> = ({ slot, index, totalCards, onSelectEvent }) => {
  const hasEvents = slot.events.length > 0;

  return (
    <div className="w-full h-full bg-[#FFFFFF] border border-[#000000] overflow-hidden flex flex-col">
      {/* Telemetry strip */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-2.5 border-b border-[#EBEBEB] bg-[#FAFAFA] shrink-0">
        <span className="font-mono text-[11px] font-bold text-[#000000]">
          [{String(index + 1).padStart(2, '0')}/{String(totalCards).padStart(2, '0')}]
        </span>
        <span className="font-mono text-[11px] text-[#AAAAAA] hidden sm:block">
          MUMBAI ONCHAIN WEEK 2026 • IST
        </span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
        {/* Date column */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-[#EBEBEB] p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-bold text-[#888888] tracking-[0.25em] block">
              {slot.monthLabel}
            </span>
            <span className="font-heading font-black text-7xl sm:text-8xl lg:text-[7rem] text-[#050505] leading-none block tabular-nums">
              {slot.dayNumber}
            </span>
            <span className="font-mono text-sm font-bold text-[#000000] tracking-widest block pt-1">
              {slot.weekday}
            </span>
          </div>
          <div className="pt-4 space-y-1.5">
            <div className="font-mono text-[11px] text-[#777777]">
              {hasEvents
                ? `${slot.events.length} ${slot.events.length === 1 ? 'EVENT' : 'EVENTS'}`
                : 'NO TRACKED EVENTS'}
            </div>
            <div className="font-pixel text-[10px] text-[#CCCCCC]">
              NOV {slot.dayNumber} / 2026
            </div>
          </div>
        </div>

        {/* Events column */}
        <div className="md:col-span-9 overflow-y-auto p-6 sm:p-8">
          {hasEvents ? (
            <div className="divide-y divide-[#EBEBEB]">
              {slot.events.map((evt) => (
                <div
                  key={evt.id}
                  className={`py-5 first:pt-0 last:pb-0 group cursor-pointer transition-colors ${
                    evt.isPrimary
                      ? 'bg-[#FAFAFA] -mx-4 px-4 border-l-4 border-l-[#000000]'
                      : ''
                  }`}
                  onClick={() => onSelectEvent(evt.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="font-bold text-[#000000] text-sm bg-[#F5F5F5] px-2.5 py-1 border border-[#E0E0E0]">
                        {evt.startTime} — {evt.endTime}
                      </span>
                      <span className="text-[#777777] uppercase text-[11px] tracking-wider">
                        {evt.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={evt.status} size="sm" />
                      <CalendarButton event={evt} size="sm" />
                    </div>
                  </div>

                  <h4 className="font-heading font-black text-xl sm:text-2xl lg:text-3xl text-[#050505] leading-tight group-hover:underline flex items-start justify-between gap-2 mb-2">
                    <span>{evt.title}</span>
                    <ArrowUpRight className="w-5 h-5 text-[#CCCCCC] group-hover:text-[#000000] transition-colors shrink-0 mt-0.5" />
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#555555]">
                    <span className="flex items-center gap-1.5 text-[#222222]">
                      <MapPin className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      {evt.location}
                    </span>
                    <span className="text-[#DDDDDD]">•</span>
                    <span>
                      Organizer:{' '}
                      <strong className="text-[#000000]">{evt.organizer}</strong>
                    </span>
                    {evt.officialUrl && (
                      <>
                        <span className="text-[#DDDDDD]">•</span>
                        <a
                          href={evt.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#000000] font-bold hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          REGISTER
                        </a>
                      </>
                    )}
                  </div>

                  {evt.isPrimary && (
                    <div className="mt-3 font-mono text-[11px] text-[#000000] font-bold uppercase tracking-wider bg-[#EEEEEE] px-3 py-1 inline-block">
                      ★ PRIMARY VOLUNTEER &amp; ATTENDEE MISSION
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center min-h-[100px] gap-2">
              <div className="font-mono text-xs text-[#AAAAAA] uppercase tracking-widest">
                NO TRACKED EVENTS THIS DAY
              </div>
              <p className="font-mono text-xs text-[#CCCCCC] max-w-xs">
                Check the community side-events spreadsheet for dinners, after-parties and gatherings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stacked card — scroll-driven animation
// ─────────────────────────────────────────────────────────────────────────────

const StackedCard: React.FC<{
  slot: DaySlot;
  index: number;
  totalCards: number;
  scrollProgress: MotionValue<number>;
  onSelectEvent: (id: string) => void;
}> = ({ slot, index, totalCards, scrollProgress, onSelectEvent }) => {
  const n = totalCards;
  const seg = 1 / n;
  const isFirst = index === 0;
  const isLast = index === n - 1;

  const arrivalStart = Math.max(0, (index - 1) * seg);
  const arrivalEnd = index * seg;
  const departureStart = index * seg;
  const departureEnd = (index + 1) * seg;

  // translateY for incoming card (slides up from 100% below)
  const slideY = useTransform(
    scrollProgress,
    isFirst ? [0, 0.001] : [arrivalStart, arrivalEnd],
    isFirst ? ['0%', '0%'] : ['100%', '0%'],
  );

  // scale + slight y-offset as this card goes behind
  const scaleBack = useTransform(
    scrollProgress,
    isLast ? [0, 1] : [departureStart, departureEnd],
    isLast ? [1, 1] : [1, 0.978],
  );
  const yBack = useTransform(
    scrollProgress,
    isLast ? [0, 1] : [departureStart, departureEnd],
    isLast ? [0, 0] : [0, -18],
  );
  const opacityBack = useTransform(
    scrollProgress,
    isLast ? [0, 1] : [departureStart, departureEnd],
    isLast ? [1, 1] : [1, 0.82],
  );

  // Clip: incoming card's content only visible once it's arrived
  const clipValue = useTransform(
    scrollProgress,
    isFirst ? [0, 0.001] : [arrivalStart, arrivalEnd],
    isFirst ? ['inset(0 0 0 0)'] : ['inset(0 0 100% 0)', 'inset(0 0 0 0)'],
  );

  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{
        y: isFirst ? yBack : slideY,
        scale: scaleBack,
        opacity: opacityBack,
        clipPath: clipValue,
        zIndex: index + 1,
        transformOrigin: 'top center',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.09), 0 1px 4px 0 rgba(0,0,0,0.05)',
      }}
    >
      <DayCardContent
        slot={slot}
        index={index}
        totalCards={totalCards}
        onSelectEvent={onSelectEvent}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ScrollDayLabel
// ─────────────────────────────────────────────────────────────────────────────

const ScrollDayLabel: React.FC<{
  slots: DaySlot[];
  scrollProgress: MotionValue<number>;
}> = ({ slots, scrollProgress }) => {
  const [label, setLabel] = useState(`NOV ${slots[0].dayNumber} — ${slots[0].weekday}`);

  useEffect(() => {
    const unsub = scrollProgress.on('change', (v) => {
      const idx = Math.min(
        Math.floor(v * slots.length),
        slots.length - 1
      );
      const s = slots[idx];
      setLabel(`NOV ${s.dayNumber} — ${s.weekday}`);
    });
    return unsub;
  }, [scrollProgress, slots]);

  return (
    <span className="font-mono text-[11px] font-bold text-[#444444] bg-[#FFFFFF]/90 px-2.5 py-1 border border-[#D8D8D8] tracking-widest backdrop-blur-sm">
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ScrollHint
// ─────────────────────────────────────────────────────────────────────────────

const ScrollHint: React.FC<{ scrollProgress: MotionValue<number> }> = ({ scrollProgress }) => {
  const opacity = useTransform(scrollProgress, [0, 0.05], [1, 0]);
  return (
    <motion.div
      className="absolute bottom-8 right-6 z-50 pointer-events-none hidden sm:flex flex-col items-center gap-1.5"
      style={{ opacity }}
    >
      <span className="font-mono text-[10px] text-[#AAAAAA] uppercase tracking-widest">SCROLL</span>
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-4 h-6 border border-[#CCCCCC] rounded-full flex items-start justify-center pt-1"
      >
        <div className="w-1 h-1.5 bg-[#AAAAAA] rounded-full" />
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Header
// ─────────────────────────────────────────────────────────────────────────────

const TimelineHeader: React.FC<{
  selectedDayFilter: string;
  setSelectedDayFilter: (v: string) => void;
  slots: DaySlot[];
}> = ({ selectedDayFilter, setSelectedDayFilter, slots }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8D8D8] pb-6">
        <div>
          <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
            PROGRAMME // 01–08 NOVEMBER 2026
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] tracking-tight uppercase">
            SCHEDULE MATRIX
          </h2>
          <p className="font-mono text-xs text-[#555555] mt-1 max-w-xl">
            India Blockchain Week (Nov 1, Sun) → Devcon 8 India (Nov 3–6) → ETHGlobal Mumbai &amp; EIP Hub (Nov 7, Sat).
            {selectedDayFilter === 'ALL' && (
              <span className="text-[#000000] font-bold"> ↓ Scroll the stacked cards to navigate day-by-day.</span>
            )}
          </p>
        </div>
        <div className="font-mono text-xs text-right shrink-0">
          <span className="text-[#000000] font-bold block">TIMEZONE: ASIA/KOLKATA (IST)</span>
          <span className="text-[#777777]">UTC +05:30 • MUMBAI</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="font-mono text-[10px] text-[#666666] uppercase tracking-widest block font-bold">
          JUMP TO DAY:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDayFilter('ALL')}
            className={`px-3.5 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
              selectedDayFilter === 'ALL'
                ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
            }`}
          >
            ALL DAYS
          </button>
          {slots.map((s) => (
            <button
              key={s.date}
              onClick={() => setSelectedDayFilter(s.date)}
              className={`px-3 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
                selectedDayFilter === s.date
                  ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                  : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
              }`}
            >
              NOV {s.dayNumber}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static fallback (prefers-reduced-motion / single-day filter)
// ─────────────────────────────────────────────────────────────────────────────

const StaticTimeline: React.FC<{
  slots: DaySlot[];
  onSelectEvent: (id: string) => void;
}> = ({ slots, onSelectEvent }) => (
  <div className="space-y-6">
    {slots.map((slot, i) => (
      <div key={slot.date} style={{ minHeight: 360 }}>
        <DayCardContent
          slot={slot}
          index={i}
          totalCards={slots.length}
          onSelectEvent={onSelectEvent}
        />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Timeline export
// ─────────────────────────────────────────────────────────────────────────────

export const Timeline: React.FC<TimelineProps> = ({ events, onSelectEvent }) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  // Build all 8 day slots
  const slots: DaySlot[] = DAY_DATES.map((date) => ({
    date,
    dayNumber: date.slice(8),
    weekday: formatDateDisplay(date, 'EEEE').toUpperCase(),
    monthLabel: 'NOV',
    events: events
      .filter((e) => {
        if (e.startDate === date) return true;
        if (e.startDate <= date && e.endDate >= date) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.startTime === 'TBA') return 1;
        if (b.startTime === 'TBA') return -1;
        return a.startTime.localeCompare(b.startTime);
      }),
  }));

  const activeSlots =
    selectedDayFilter === 'ALL'
      ? slots
      : slots.filter((s) => s.date === selectedDayFilter);

  // Scroll tracking — tied to the tall container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const totalCards = activeSlots.length;
  const cardAreaHeight = '82vh';
  const scrollContainerHeight = `${SCROLL_PER_CARD_VH * totalCards}vh`;

  // ── Reduced motion: plain list ────────────────────────────────────────────
  if (prefersReducedMotion) {
    return (
      <div className="space-y-8 select-none">
        <TimelineHeader
          selectedDayFilter={selectedDayFilter}
          setSelectedDayFilter={setSelectedDayFilter}
          slots={slots}
        />
        <StaticTimeline slots={activeSlots} onSelectEvent={onSelectEvent} />
      </div>
    );
  }

  // ── Single-day view: no animation needed ─────────────────────────────────
  if (selectedDayFilter !== 'ALL') {
    return (
      <div className="space-y-8 select-none">
        <TimelineHeader
          selectedDayFilter={selectedDayFilter}
          setSelectedDayFilter={setSelectedDayFilter}
          slots={slots}
        />
        <StaticTimeline slots={activeSlots} onSelectEvent={onSelectEvent} />
      </div>
    );
  }

  // ── Full stacked-scroll mode ──────────────────────────────────────────────
  return (
    <div className="space-y-8 select-none">
      <TimelineHeader
        selectedDayFilter={selectedDayFilter}
        setSelectedDayFilter={setSelectedDayFilter}
        slots={slots}
      />

      {/* Tall scroll container — drives all transitions */}
      <div
        ref={containerRef}
        style={{ height: scrollContainerHeight }}
        className="relative w-full"
      >
        {/* Sticky viewport */}
        <div
          className="sticky top-0 w-full overflow-hidden"
          style={{ height: cardAreaHeight }}
        >
          {/* Card stack */}
          <div className="relative w-full h-full">
            {slots.map((slot, i) => (
              <StackedCard
                key={slot.date}
                slot={slot}
                index={i}
                totalCards={totalCards}
                scrollProgress={scrollYProgress}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EBEBEB] z-50">
            <motion.div
              className="h-full bg-[#000000] origin-left"
              style={{ scaleX: scrollYProgress }}
            />
          </div>

          {/* Active day label */}
          <div className="absolute bottom-4 left-6 z-50 pointer-events-none">
            <ScrollDayLabel slots={slots} scrollProgress={scrollYProgress} />
          </div>

          {/* Scroll hint */}
          <ScrollHint scrollProgress={scrollYProgress} />
        </div>
      </div>
    </div>
  );
};
