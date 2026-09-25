import React, { useRef, useState, useEffect } from 'react';
import {
  useScroll,
  useTransform,
  useReducedMotion,
  motion,
  type MotionValue,
} from 'framer-motion';
import type { EventItem } from '../types/event';
import { ExternalLink, Compass, Layers, Grid, MapPin, ArrowUpRight } from 'lucide-react';

interface MapViewProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

const SCROLL_PER_VENUE_VH = 85;

// Identification helpers
const isDevcon8Venue = (v: EventItem): boolean =>
  v.id === 'devcon-8-india' ||
  v.id === 'eip-hub-devcon-8' ||
  v.title.toLowerCase().includes('devcon 8') ||
  v.location.toLowerCase().includes('jio');

const isIBWVenue = (v: EventItem): boolean =>
  v.id === 'india-blockchain-week-2026' ||
  v.title.toLowerCase().includes('india blockchain week') ||
  v.title.toLowerCase().includes('ibw') ||
  v.location.toLowerCase().includes('fairmont');

// Only keep Devcon 8 (Jio World Centre) and Fairmont Mumbai images; remove all images from all other venues
const getVenueImage = (venue: EventItem): string | null => {
  if (isDevcon8Venue(venue)) {
    return '/images/jio-world-centre.png';
  }
  if (isIBWVenue(venue)) {
    return '/images/fairmont-mumbai.jpg';
  }
  return null;
};

// Keep address and location in Devcon 8 Jio World Centre & IBW Fairmont, replace all other locations with "Mumbai, India"
const getVenueLocationInfo = (venue: EventItem) => {
  if (isDevcon8Venue(venue)) {
    return {
      location: 'Jio World Centre',
      address: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
      latitude: 19.0628,
      longitude: 72.8687,
      mapQuery: 'Jio+World+Centre+BKC+Mumbai',
    };
  }
  if (isIBWVenue(venue)) {
    return {
      location: 'Fairmont Mumbai',
      address: 'Near International Airport, Sahar, Mumbai, Maharashtra 400099',
      latitude: 19.0968,
      longitude: 72.8584,
      mapQuery: 'Fairmont+Mumbai+Sahar',
    };
  }
  return {
    location: 'Mumbai, India',
    address: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    mapQuery: 'Mumbai+India',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Venue Card Content (Shared between Animated Stack and Static Grid)
// ─────────────────────────────────────────────────────────────────────────────
interface VenueCardContentProps {
  venue: EventItem;
  index: number;
  totalVenues: number;
  onSelectEvent: (id: string) => void;
  isCurrent?: boolean;
}

const VenueCardContent: React.FC<VenueCardContentProps> = ({
  venue,
  index,
  totalVenues,
  onSelectEvent,
  isCurrent = false,
}) => {
  const venueImage = getVenueImage(venue);
  const locInfo = getVenueLocationInfo(venue);
  const officialGoogleMapsLink = `https://maps.google.com/?q=${encodeURIComponent(locInfo.mapQuery)}`;

  return (
    <div className="w-full h-full bg-[#FFFFFF] border-2 border-[#000000] overflow-hidden flex flex-col justify-between select-none">
      {/* Telemetry Strip */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-2.5 border-b-2 border-[#000000] bg-[#FAFAFA] shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
          <span className="text-[#000000]">
            [{String(index + 1).padStart(2, '0')}/{String(totalVenues).padStart(2, '0')}]
          </span>
          <span className="text-[#888888]">•</span>
          <span className="text-[#F97316] uppercase tracking-wider">
            {venue.category}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#777777] hidden sm:flex items-center gap-2">
          <span>MUMBAI ONCHAIN WEEK // KEY VENUE NODE</span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 text-[#15803D] font-bold bg-[#F0FDF4] px-1.5 py-0.5 border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span>ACTIVE VENUE</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {venueImage ? (
        /* 2-Column with image (Devcon 8 Jio World Centre & Fairmont Mumbai) */
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 items-stretch">
          <div className="lg:col-span-6 relative h-56 sm:h-64 lg:h-auto overflow-hidden bg-[#000000] border-b-2 lg:border-b-0 lg:border-r-2 border-[#000000]">
            <img
              src={venueImage}
              alt={locInfo.location}
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute top-3 left-3 bg-[#000000] text-[#FFFFFF] px-3 py-1 font-mono text-[11px] font-bold tracking-wider flex items-center gap-1.5 border border-[#333333]">
              <MapPin className="w-3 h-3 text-[#F97316]" />
              <span>VENUE SPOTLIGHT #{String(index + 1).padStart(2, '0')}</span>
            </div>

            <div className="absolute bottom-3 left-3 bg-[#000000]/85 backdrop-blur-sm text-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#CCCCCC] border border-[#222222]">
              {locInfo.latitude.toFixed(4)}° N, {locInfo.longitude.toFixed(4)}° E
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="font-mono text-xs text-[#777777] uppercase tracking-widest block font-bold mb-1">
                  LOCATION SPECIFICATION
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-4xl text-[#050505] uppercase tracking-tight">
                  {locInfo.location}
                </h3>
                <p className="font-mono text-xs text-[#555555] mt-1.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                  <span>{locInfo.address}</span>
                </p>
              </div>

              {/* Event Happening at this Venue */}
              <div className="bg-[#FAFAFA] border border-[#000000] p-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#666666] uppercase tracking-wider font-bold">
                  <span>EVENT AT THIS VENUE</span>
                  <span className="text-[#000000]">{venue.startDate}</span>
                </div>
                <h4 className="font-heading font-black text-lg sm:text-xl text-[#000000] leading-snug">
                  {venue.title}
                </h4>
                <p className="font-mono text-xs text-[#555555]">
                  Timing: <strong className="text-[#000000]">{venue.startTime} — {venue.endTime} IST</strong>
                  {venue.organizer && <span> • Hosted by {venue.organizer}</span>}
                </p>
                {venue.description && (
                  <p className="font-sans text-xs text-[#666666] line-clamp-2 pt-1 border-t border-[#EAEAEA]">
                    {venue.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={officialGoogleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>VIEW ON GOOGLE MAPS</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onSelectEvent(venue.id)}
                className="inline-flex items-center gap-2 bg-transparent hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border-2 border-[#000000] px-5 py-2.5 font-mono text-xs font-bold transition-all active:scale-95"
              >
                <span>EVENT BRIEF [{String(index + 1).padStart(2, '0')}]</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Clean Technical Full-Width Layout (All image removed, Location is Mumbai India) */
        <div className="flex-1 min-h-0 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto bg-[#FFFFFF]">
          <div className="max-w-3xl space-y-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#777777] uppercase tracking-widest font-bold mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>LOCATION SPECIFICATION // NODE #{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] uppercase tracking-tight">
                {locInfo.location}
              </h3>
              <p className="font-mono text-sm text-[#555555] mt-1.5 flex items-center gap-2">
                <span>Address:</span>
                <strong className="text-[#000000] font-semibold">{locInfo.address}</strong>
              </p>
            </div>

            {/* Event Happening at this Venue */}
            <div className="bg-[#FAFAFA] border-2 border-[#000000] p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-[#666666] uppercase tracking-wider font-bold">
                <span>EVENT AT THIS VENUE</span>
                <span className="text-[#000000] font-bold">{venue.startDate}</span>
              </div>
              <h4 className="font-heading font-black text-xl sm:text-2xl text-[#000000] leading-snug">
                {venue.title}
              </h4>
              <p className="font-mono text-xs text-[#555555]">
                Timing: <strong className="text-[#000000]">{venue.startTime} — {venue.endTime} IST</strong>
                {venue.organizer && <span> • Hosted by {venue.organizer}</span>}
              </p>
              {venue.description && (
                <p className="font-sans text-sm text-[#555555] leading-relaxed pt-2 border-t border-[#EAEAEA]">
                  {venue.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <a
              href={officialGoogleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <span>VIEW ON GOOGLE MAPS</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => onSelectEvent(venue.id)}
              className="inline-flex items-center gap-2 bg-transparent hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border-2 border-[#000000] px-5 py-2.5 font-mono text-xs font-bold transition-all active:scale-95"
            >
              <span>EVENT BRIEF [{String(index + 1).padStart(2, '0')}]</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Footer Bar */}
      <div className="px-5 sm:px-8 py-2 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between font-mono text-[11px] text-[#888888] shrink-0">
        <span>DEVCON 8 & MUMBAI ONCHAIN ECOSYSTEM</span>
        <span className="font-bold text-[#000000]">{locInfo.location}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stacked Venue Card — Scroll-driven Animation (Preserved Overlapping Mechanics)
// ─────────────────────────────────────────────────────────────────────────────
interface StackedVenueCardProps {
  venue: EventItem;
  index: number;
  totalVenues: number;
  scrollProgress: MotionValue<number>;
  onSelectEvent: (id: string) => void;
}

const StackedVenueCard: React.FC<StackedVenueCardProps> = ({
  venue,
  index,
  totalVenues,
  scrollProgress,
  onSelectEvent,
}) => {
  const n = totalVenues;
  const seg = 1 / n;
  const isFirst = index === 0;
  const isLast = index === n - 1;

  const arrivalStart = Math.max(0, (index - 1) * seg);
  const arrivalEnd = index * seg;
  const departureStart = index * seg;
  const departureEnd = (index + 1) * seg;

  // translateY for incoming card (slides up from 100% below to overlap)
  const slideY = useTransform(
    scrollProgress,
    [arrivalStart, Math.max(arrivalEnd, arrivalStart + 0.001)],
    ['100%', '0%'],
  );

  // scale + yBack as this card goes behind the next incoming card
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

  // Clip incoming cards until arrival
  const clipValue = useTransform(
    scrollProgress,
    [arrivalStart, Math.max(arrivalEnd, arrivalStart + 0.001)],
    ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
  );

  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{
        y: isFirst ? yBack : slideY,
        scale: scaleBack,
        opacity: opacityBack,
        ...(isFirst ? {} : { clipPath: clipValue }),
        zIndex: index + 1,
        transformOrigin: 'top center',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12), 0 2px 6px 0 rgba(0,0,0,0.06)',
      }}
    >
      <VenueCardContent
        venue={venue}
        index={index}
        totalVenues={totalVenues}
        onSelectEvent={onSelectEvent}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main MapView Component
// ─────────────────────────────────────────────────────────────────────────────
export const MapView: React.FC<MapViewProps> = ({ events, onSelectEvent }) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter all events that have actual physical locations in Mumbai
  const venueEvents = events.filter(
    e => e.location && e.location !== 'TBA, Mumbai' && e.location !== 'Online'
  );

  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    venueEvents[0]?.id || events[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'stacked' | 'grid'>('stacked');

  const selectedVenue =
    venueEvents.find(v => v.id === selectedVenueId) || venueEvents[0] || events[0];

  const selectedInfo = selectedVenue ? getVenueLocationInfo(selectedVenue) : {
    location: 'Jio World Centre',
    address: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
    latitude: 19.0628,
    longitude: 72.8687,
    mapQuery: 'Jio+World+Centre+BKC+Mumbai',
  };

  // Scroll tracking for stacked animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const totalVenues = venueEvents.length;
  const cardAreaHeight = 'calc(100vh - 80px)';
  const scrollContainerHeight = `${SCROLL_PER_VENUE_VH * totalVenues}vh`;

  // Update selected venue as user scrolls through the stack
  useEffect(() => {
    if (viewMode !== 'stacked') return;
    const unsub = scrollYProgress.on('change', (v) => {
      const idx = Math.min(
        Math.floor(v * totalVenues),
        totalVenues - 1
      );
      if (venueEvents[idx]) {
        setSelectedVenueId(venueEvents[idx].id);
      }
    });
    return unsub;
  }, [scrollYProgress, totalVenues, venueEvents, viewMode]);

  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(selectedInfo.mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const officialGoogleMapsLink = `https://maps.google.com/?q=${encodeURIComponent(selectedInfo.mapQuery)}`;

  return (
    <div className="w-full space-y-8 select-none">
      
      {/* Geospatial Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAEAEA] pb-6">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#000000]">
                <Compass className="w-3.5 h-3.5" />
                <span>GEOSPATIAL MATRIX // MUMBAI 2026</span>
              </span>
              <span>•</span>
              <span className="text-[#15803D] font-bold bg-[#F0FDF4] px-2 py-0.5 border border-[#BBF7D0]">
                {totalVenues} VENUES TRACKED
              </span>
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] tracking-tight uppercase">
              MUMBAI EVENT MAP & VENUES
            </h2>
            <p className="font-mono text-xs text-[#555555] mt-1 max-w-2xl">
              1. Jio World Centre (Devcon 8) → 2. Fairmont Mumbai (IBW) → All other venues in Mumbai, India.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#000000] p-1 bg-[#FAFAFA] font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'stacked'
                    ? 'bg-[#000000] text-[#FFFFFF]'
                    : 'text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>STACKED SCROLL</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#000000] text-[#FFFFFF]'
                    : 'text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>ALL VENUES</span>
              </button>
            </div>

            <a
              href="https://maps.app.goo.gl/yyQ84FcUdu4bmFPB6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-4 py-2.5 font-mono text-xs font-bold transition-all shrink-0"
            >
              <span>OFFICIAL MAP</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Horizontal Quick Venue Scrubber / Filter Bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#777777]">
            <span className="font-bold uppercase text-[#000000]">
              SELECT MUMBAI VENUE NODES ({totalVenues}):
            </span>
            <span className="hidden sm:inline">
              ↓ Scroll down to watch venues overlap seamlessly
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar font-mono text-xs">
            {venueEvents.map((v, idx) => {
              const isSelected = v.id === selectedVenue?.id;
              const vInfo = getVenueLocationInfo(v);
              const label =
                vInfo.location === 'Mumbai, India'
                  ? `Mumbai, India [${String(idx + 1).padStart(2, '0')}]`
                  : vInfo.location;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVenueId(v.id);
                    if (viewMode === 'stacked' && containerRef.current) {
                      const containerTop = containerRef.current.offsetTop;
                      const progressTarget = idx / totalVenues;
                      const targetScrollY =
                        containerTop + progressTarget * (containerRef.current.offsetHeight - window.innerHeight);
                      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                    }
                  }}
                  className={`px-3 py-1.5 border font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                      : 'bg-[#FFFFFF] text-[#444444] border-[#D8D8D8] hover:border-[#000000]'
                  }`}
                >
                  <span className={isSelected ? 'text-[#F97316] font-bold' : 'text-[#888888]'}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Google Map Visual Reference */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] overflow-hidden flex flex-col">
        <div className="bg-[#000000] text-[#FFFFFF] px-4 sm:px-6 py-3 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-bold uppercase tracking-wider truncate">
              CURRENT FOCUS: {selectedInfo.location}
            </span>
          </div>
          <a
            href={officialGoogleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F97316] hover:underline shrink-0 font-bold ml-2 flex items-center gap-1"
          >
            <span>EXPAND IN GOOGLE MAPS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="w-full h-72 sm:h-96">
          <iframe
            title="Mumbai Venue Interactive Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={googleMapEmbedUrl}
          />
        </div>
      </div>

      {/* Section Subtitle */}
      <div className="border-b-2 border-[#000000] pb-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-xs font-bold text-[#F97316] uppercase tracking-widest">
            OVERLAPPING VENUE TIMELINE SEQUENCE
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#050505] uppercase">
            MUMBAI VENUES // STEP-BY-STEP STACK
          </h3>
        </div>
        <div className="font-mono text-xs text-[#666666] hidden md:block text-right">
          <span>01 JIO WORLD → 02 FAIRMONT → 03+ MUMBAI, INDIA</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          STACKED CARDS ANIMATION (Preserved exact smooth overlapping physics)
          ──────────────────────────────────────────────────────────────────── */}
      {viewMode === 'stacked' && !prefersReducedMotion ? (
        <div
          ref={containerRef}
          style={{ height: scrollContainerHeight }}
          className="relative w-full"
        >
          {/* Sticky container sticking under navbar */}
          <div
            className="sticky top-20 w-full"
            style={{ height: cardAreaHeight, overflow: 'clip' }}
          >
            {venueEvents.map((venue, idx) => (
              <StackedVenueCard
                key={venue.id}
                venue={venue}
                index={idx}
                totalVenues={totalVenues}
                scrollProgress={scrollYProgress}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Static Grid Fallback */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venueEvents.map((venue, idx) => (
            <div key={venue.id} className="min-h-[420px]">
              <VenueCardContent
                venue={venue}
                index={idx}
                totalVenues={totalVenues}
                onSelectEvent={onSelectEvent}
                isCurrent={venue.id === selectedVenue?.id}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
