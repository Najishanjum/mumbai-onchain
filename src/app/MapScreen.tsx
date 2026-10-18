import { useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, BedDouble, ChevronLeft, Coffee, Crosshair, Heart, Laptop, LocateFixed, Maximize2, Minimize2, MessageCircle, Navigation, Phone, Pill, Plus, Smartphone, TramFront, UtensilsCrossed, WashingMachine, X, type LucideIcon } from 'lucide-react';
import { LngLatBounds, Map as MapLibre, Marker, setWorkerUrl, type LayerSpecification, type StyleSpecification } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { EventItem } from '../types/event';
import { PLACE_CATEGORIES, PLACES, type Credit, type Place, type PlaceCategory } from '../data/places';
import { useAppTheme } from '../lib/useAppTheme';
import { useBackToClose } from '../lib/useBackToClose';
import { VENUE_TBA } from './time';
import { useCommunityPlaces, useRatingSummary, type RatingSummary } from '../lib/useCommunityPlaces';
import { AddPlaceSheet, GoogleReviewsLink, PlaceReviews, RatingBadge } from './MapCommunity';

// Free OpenStreetMap tiles from OpenFreeMap: no key, no limits, attribution
// shown by MapLibre. Its dark style is recoloured for both themes below.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
// Devcon 8 is at Jio World Centre; distances are measured from there.
const HOME = { lat: 19.0626, lng: 72.8656, name: 'Jio World Centre' };
const VENUE_COLOR = '#FF8A3D';
const ALIASES: Record<string, string> = { 'Jio World Convention Centre': 'Jio World Centre' };

// MapLibre looks for its worker next to its own file, which Vite doesn't copy;
// point it at the bundled copy instead.
setWorkerUrl(mapWorkerUrl);

type Filter = 'all' | 'venue' | PlaceCategory;

interface Pin {
  id: string;
  kind: 'venue' | PlaceCategory;
  name: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  area?: string;
  place?: Place;
  eventCount?: number;
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const formatKm = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
const digits = (phone: string) => phone.replace(/[^\d]/g, '');

function directions(pin: Pin): string {
  // An approximate pin only marks the area, so let Google find the place by name.
  if (pin.place?.approx) {
    const q = [pin.name, pin.area, 'Mumbai'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
}

/** Thanks the person whose list a place came from, linking to their post. */
function CreditLine({ credit, lead = 'Recommended by' }: { credit: Credit; lead?: string }) {
  return (
    <a
      href={credit.url}
      target="_blank"
      rel="noopener noreferrer"
      className="app-press flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--app-primary-soft)] text-[13px] text-[var(--app-ink)]"
    >
      <Heart className="w-4 h-4 shrink-0 text-[var(--app-primary)]" fill="currentColor" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        {lead} <b>{credit.name}</b> · {credit.source}
      </span>
      <span className="text-[var(--app-primary)] font-bold shrink-0">Read ↗</span>
    </a>
  );
}

/** Event venues with coordinates, one pin per venue. */
function venuePins(events: EventItem[]): Pin[] {
  const byName = new Map<string, Pin>();
  for (const e of events) {
    // Venues not announced yet have no real spot on the map.
    if (e.location === VENUE_TBA || /to be announced/i.test(e.location) || e.latitude == null || e.longitude == null) continue;
    const first = e.location.split(',')[0].trim();
    const name = ALIASES[first] ?? first;
    const pin = byName.get(name);
    if (pin) pin.eventCount = (pin.eventCount ?? 0) + 1;
    else byName.set(name, { id: `venue:${name}`, kind: 'venue', name, lat: e.latitude, lng: e.longitude, color: VENUE_COLOR, label: 'Venue', eventCount: 1 });
  }
  return [...byName.values()];
}

function placePins(list: Place[]): Pin[] {
  return list.map((p) => {
    const cat = PLACE_CATEGORIES.find((c) => c.id === p.category)!;
    return { id: p.id, kind: p.category, name: p.name, lat: p.lat, lng: p.lng, color: cat.color, label: cat.label, area: p.area, place: p };
  });
}

/** An icon per category, used on the pins, the chips and the list. */
const ICONS: Record<PlaceCategory, LucideIcon> = {
  stay: BedDouble,
  food: UtensilsCrossed,
  cafe: Coffee,
  cowork: Laptop,
  laundry: WashingMachine,
  health: Pill,
  money: Banknote,
  sim: Smartphone,
  transport: TramFront,
};

// Pins are plain DOM elements owned by MapLibre, so React can't render into
// them. MapScreen renders every icon once in a hidden <PinIcons /> template,
// and each pin clones its category's SVG from there.
function iconSvg(category: PlaceCategory): Node | null {
  return document.getElementById(`map-icon-${category}`)?.cloneNode(true) ?? null;
}

function PinIcons() {
  return (
    <div hidden>
      {(Object.keys(ICONS) as PlaceCategory[]).map((k) => {
        const Icon = ICONS[k];
        return <Icon key={k} id={`map-icon-${k}`} width={16} height={16} strokeWidth={2.4} aria-hidden="true" />;
      })}
    </div>
  );
}

// ── Aurora map, in the app's Today colours ───────────────────────────────
// The dark style is redrawn in greys: land almost black, water fully black,
// roads in white getting brighter with importance. A gradient laid over the
// canvas with mix-blend-mode: multiply (.map-neon) then turns the white roads
// mint, pink and saffron while black stays black.
const ROAD_GREYS: Record<string, string> = {
  highway_motorway_inner: '#FFFFFF',
  highway_major_inner: '#E2E2E2',
  highway_motorway_subtle: '#9A9A9A',
  highway_major_subtle: '#8A8A8A',
  highway_minor: '#6E6E6E',
  highway_path: '#3C3C3C',
};

// The same recipe in both themes. Dark: near-black land, black sea, roads
// from white (motorways) to dim grey (lanes), tinted by multiply. Light: the
// negative, with white land and dark roads tinted by screen (see .map-neon).
const PALETTES = {
  dark: { land: '#141417', water: '#000000', building: '#18181C', casing: 'rgba(255,255,255,0.12)', rail: '#3A3A3A', text: '#D8D8DE', halo: '#000000' },
  light: { land: '#FFFFFF', water: '#E4E8EE', building: '#F2F2F2', casing: 'rgba(0,0,0,0.10)', rail: '#C5C5C5', text: '#3A3A44', halo: '#FFFFFF' },
};

/** #RRGGBB to its negative, so the light map's roads mirror the dark ones. */
function invert(hex: string): string {
  return `#${(0xffffff ^ parseInt(hex.slice(1), 16)).toString(16).padStart(6, '0')}`;
}

function neon(style: StyleSpecification, theme: 'dark' | 'light'): StyleSpecification {
  const c = PALETTES[theme];
  const road = (id: string) => (theme === 'dark' ? ROAD_GREYS[id] : invert(ROAD_GREYS[id]));
  const layers = style.layers.map((layer): LayerSpecification => {
    const src = 'source-layer' in layer ? layer['source-layer'] : undefined;
    if (layer.type === 'background') return { ...layer, paint: { ...layer.paint, 'background-color': c.land } };
    if (layer.type === 'fill') {
      const color = src === 'water' ? c.water : src === 'building' ? c.building : c.land;
      return { ...layer, paint: { ...layer.paint, 'fill-color': color } };
    }
    if (layer.type === 'line') {
      if (src === 'waterway') return { ...layer, paint: { ...layer.paint, 'line-color': c.water } };
      if (layer.id in ROAD_GREYS) return { ...layer, paint: { ...layer.paint, 'line-color': road(layer.id), 'line-opacity': 1 } };
      if (layer.id.includes('casing')) return { ...layer, paint: { ...layer.paint, 'line-color': c.casing } };
      if (layer.id.startsWith('railway')) return { ...layer, paint: { ...layer.paint, 'line-color': c.rail } };
    }
    if (layer.type === 'symbol') {
      return { ...layer, paint: { ...layer.paint, 'text-color': c.text, 'text-halo-color': c.halo } };
    }
    return layer;
  });
  return { ...style, layers };
}

function applyStyle(m: MapLibre, theme: 'dark' | 'light') {
  m.setStyle(MAP_STYLE, { transformStyle: (_prev, next) => neon(next, theme) });
}

function pinElement(pin: Pin, onSelect: (id: string) => void): HTMLElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `map-pin${pin.kind === 'venue' ? ' is-venue' : ''}`;
  el.style.setProperty('--pin', pin.color);
  el.setAttribute('aria-label', `${pin.name}, ${pin.label}`);
  if (pin.kind === 'venue') {
    const img = document.createElement('img');
    img.src = '/icons/icon-192.png';
    img.alt = '';
    el.appendChild(img);
  } else {
    const icon = iconSvg(pin.kind);
    if (icon) {
      (icon as Element).removeAttribute('id');
      el.appendChild(icon);
    }
  }
  el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onSelect(pin.id);
  });
  return el;
}

/**
 * The city map (centre button → Map): event venues and the guide places on a
 * dark map, filtered by category, with a card for the selected pin and a list
 * sorted by distance from the main venue.
 */
export default function MapScreen({
  open,
  onClose,
  events,
  onOpenVenues,
  onRequireProfile,
}: {
  open: boolean;
  onClose: () => void;
  events: EventItem[];
  onOpenVenues: () => void;
  /** Adding or rating needs an account and a profile. */
  onRequireProfile: () => void;
}) {
  useBackToClose(open, onClose);
  const { resolved } = useAppTheme(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  // Back leaves full screen first, then closes the map.
  useBackToClose(open && expanded, () => setExpanded(false));
  useEffect(() => {
    map.current?.resize();
  }, [expanded]);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());

  const { places: community, canAdd, addPlace } = useCommunityPlaces(open);
  const { summary, refresh: refreshRatings } = useRatingSummary(open);
  // Adding a place: move the map so the crosshair is on it, then fill in the form.
  const [picking, setPicking] = useState(false);
  const [addAt, setAddAt] = useState<{ lat: number; lng: number } | null>(null);
  const startAdding = () => {
    if (!canAdd) return onRequireProfile();
    setSelectedId(null);
    setPicking(true);
  };
  const pins = useMemo(() => [...venuePins(events), ...placePins([...PLACES, ...community])], [events, community]);
  const visible = useMemo(() => pins.filter((p) => filter === 'all' || p.kind === filter), [pins, filter]);
  const sorted = useMemo(() => [...visible].sort((a, b) => km(HOME, a) - km(HOME, b)), [visible]);
  // One thank-you per person whose picks are on screen.
  const credits = useMemo(() => {
    const seen = new Map<string, Credit>();
    for (const p of visible) if (p.place?.credit) seen.set(p.place.credit.url + p.place.credit.name, p.place.credit);
    return [...seen.values()];
  }, [visible]);
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const counts = useMemo(() => {
    const c = new Map<Filter, number>();
    for (const p of pins) c.set(p.kind, (c.get(p.kind) ?? 0) + 1);
    return c;
  }, [pins]);
  const chips: { id: Filter; label: string; color?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'venue', label: 'Venues', color: VENUE_COLOR },
    ...PLACE_CATEGORIES.filter((c) => counts.has(c.id)),
  ];

  // Create the map once while open; switch style with the app theme.
  useEffect(() => {
    if (!open || !container.current) return;
    const m = new MapLibre({
      container: container.current,
      center: [HOME.lng, HOME.lat],
      zoom: 11.5,
      attributionControl: { compact: true },
    });
    applyStyle(m, resolved);
    // The IBW-style colour wash: sits right above the map canvas (under the
    // pins) and tints the white roads; see .map-neon in index.css.
    const wash = document.createElement('div');
    wash.className = 'map-neon';
    m.getCanvas().after(wash);
    m.on('click', () => setSelectedId(null));
    map.current = m;
    const all = markers.current;
    return () => {
      all.forEach((mk) => mk.remove());
      all.clear();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the style follows the theme below
  }, [open]);

  const styleRef = useRef(resolved);
  useEffect(() => {
    if (styleRef.current === resolved) return;
    styleRef.current = resolved;
    if (map.current) applyStyle(map.current, resolved);
  }, [resolved]);

  // Markers follow the filter; the view fits whatever is shown.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current.clear();
    for (const pin of visible) {
      const mk = new Marker({ element: pinElement(pin, setSelectedId), anchor: 'bottom', offset: [0, -6] }).setLngLat([pin.lng, pin.lat]).addTo(m);
      markers.current.set(pin.id, mk);
    }
    if (visible.length > 1) {
      const b = new LngLatBounds();
      visible.forEach((p) => b.extend([p.lng, p.lat]));
      m.fitBounds(b, { padding: { top: 60, bottom: 40, left: 40, right: 40 }, maxZoom: 14, duration: 500 });
    } else if (visible.length === 1) {
      m.easeTo({ center: [visible[0].lng, visible[0].lat], zoom: 14, duration: 500 });
    }
  }, [visible, open]);

  useEffect(() => {
    markers.current.forEach((mk, id) => mk.getElement().classList.toggle('is-selected', id === selectedId));
    if (selected) map.current?.easeTo({ center: [selected.lng, selected.lat], duration: 400 });
  }, [selectedId, selected]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Map" className="app fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)]">
      <PinIcons />
      <header className={`shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 flex items-center gap-1 ${expanded ? 'hidden' : ''}`}>
        <button type="button" onClick={onClose} aria-label="Back" className="app-press w-11 h-11 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="app-title text-[20px] leading-tight">Map</h1>
          <p className="app-label">Venues and places around the week</p>
        </div>
        <button
          type="button"
          onClick={startAdding}
          className="app-press h-10 px-3.5 mr-1 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-bold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} aria-hidden="true" />
          Add place
        </button>
      </header>

      <div
        className={`app-scroll-x flex gap-2 overflow-x-auto px-4 pb-3 ${expanded ? 'absolute inset-x-0 top-0 z-10 pt-[calc(env(safe-area-inset-top)+8px)] pl-[68px]' : 'shrink-0'}`}
        role="radiogroup"
        aria-label="Show on map"
      >
        {chips.map((c) => {
          const on = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setFilter(c.id);
                setSelectedId(null);
              }}
              className={`app-press shrink-0 h-9 px-3.5 rounded-full border text-[14px] font-semibold inline-flex items-center gap-1.5 ${
                on ? 'bg-[var(--app-ink)] text-[var(--app-bg)] border-[var(--app-ink)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
              }`}
            >
              {c.id !== 'all' && <KindIcon kind={c.id} color={c.color!} size={18} />}
              {c.label}
            </button>
          );
        })}
      </div>

      <div
        className={
          expanded ? 'absolute inset-0 overflow-hidden' : 'relative flex-1 min-h-[240px] mx-4 rounded-3xl overflow-hidden border border-[var(--app-line)]'
        }
      >
        {/* Sized inline: maplibre-gl.css sets the map container to position: relative,
            which beats a Tailwind class and collapsed it to 0px tall. */}
        <div ref={container} style={{ position: 'absolute', inset: 0 }} />
        {picking && (
          // The new place goes wherever this crosshair is when they tap Next.
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center" aria-hidden="true">
            <span className="relative w-12 h-12 flex items-center justify-center text-[var(--app-primary)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <Crosshair className="w-12 h-12" strokeWidth={1.6} />
              <span className="absolute w-2.5 h-2.5 rounded-full bg-[var(--app-primary)]" />
            </span>
          </div>
        )}
        {expanded && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="app-press absolute z-10 left-4 top-[calc(env(safe-area-inset-top)+8px)] w-11 h-11 rounded-full bg-[var(--app-surface)]/90 backdrop-blur border border-[var(--app-line)] flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Exit full screen' : 'Full screen map'}
          className={`app-press absolute z-10 right-3 w-11 h-11 rounded-full bg-[var(--app-surface)]/90 backdrop-blur border border-[var(--app-line)] flex items-center justify-center ${
            expanded ? 'top-[calc(env(safe-area-inset-top)+60px)]' : 'top-3'
          }`}
        >
          {expanded ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      <div
        className={
          expanded
            ? `absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] ${selected || picking ? '' : 'hidden'}`
            : 'shrink-0 h-[38%] overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]'
        }
      >
        {picking ? (
          <div className="p-4 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] flex flex-col gap-3">
            <div>
              <h2 className="app-title text-[20px]">Where is it?</h2>
              <p className="text-[14px] text-[var(--app-muted)]">Move the map so the crosshair sits on the place, then tap Next.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 }),
                    () => undefined,
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }
                className="app-press h-11 px-4 rounded-full bg-[var(--app-pressed)] text-[14px] font-bold inline-flex items-center gap-1.5"
              >
                <LocateFixed className="w-4 h-4" aria-hidden="true" />
                Use my location
              </button>
              <button
                type="button"
                onClick={() => {
                  const c = map.current?.getCenter();
                  if (!c) return;
                  setAddAt({ lat: c.lat, lng: c.lng });
                  setPicking(false);
                }}
                className="app-press h-11 px-5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-bold"
              >
                Next
              </button>
              <button type="button" onClick={() => setPicking(false)} className="app-press h-11 px-4 rounded-full text-[14px] font-semibold text-[var(--app-muted)]">
                Cancel
              </button>
            </div>
          </div>
        ) : selected ? (
          <PinCard
            pin={selected}
            summary={selected.place ? summary[selected.place.id] : undefined}
            onClose={() => setSelectedId(null)}
            onOpenVenues={onOpenVenues}
            onRated={refreshRatings}
            onRequireProfile={onRequireProfile}
          />
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Places by distance">
            {credits.map((c) => (
              <li key={c.url + c.name}>
                <CreditLine credit={c} lead={`${c.list} by`} />
              </li>
            ))}
            {sorted.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="app-press w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-left"
                >
                  <KindIcon kind={p.kind} color={p.color} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-bold truncate">{p.name}</span>
                    <span className="block text-[13px] text-[var(--app-muted)] truncate">
                      {p.label}
                      {p.area ? ` · ${p.area}` : ''}
                      {p.eventCount ? ` · ${p.eventCount} event${p.eventCount > 1 ? 's' : ''}` : ''}
                      {p.place?.sample ? ' · Example' : ''}
                    </span>
                    {p.place && summary[p.place.id] && (
                      <span className="block mt-0.5">
                        <RatingBadge summary={summary[p.place.id]} />
                      </span>
                    )}
                  </span>
                  <span className="app-mono text-[12px] text-[var(--app-muted)] shrink-0">{formatKm(km(HOME, p))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddPlaceSheet open={Boolean(addAt)} at={addAt} onClose={() => setAddAt(null)} onAdd={addPlace} />
    </div>
  );
}

function PinCard({
  pin,
  summary,
  onClose,
  onOpenVenues,
  onRated,
  onRequireProfile,
}: {
  pin: Pin;
  summary?: RatingSummary;
  onClose: () => void;
  onOpenVenues: () => void;
  onRated: () => void;
  onRequireProfile: () => void;
}) {
  const p = pin.place;
  const facts = [p?.price, p?.hours].filter(Boolean).join(' · ');
  const action = 'app-press h-11 px-4 rounded-full inline-flex items-center gap-1.5 text-[14px] font-bold';
  return (
    <div className="p-4 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="app-mono text-[11px] font-semibold inline-flex items-center gap-1.5" style={{ color: pin.color }}>
            <KindIcon kind={pin.kind} color={pin.color} size={18} />
            {pin.label.toUpperCase()}
            {p?.sample ? ' · EXAMPLE' : ''}
          </span>
          <h2 className="app-title text-[22px] leading-tight mt-1">{pin.name}</h2>
          <p className="text-[13px] text-[var(--app-muted)]">
            {[pin.area, `${formatKm(km(HOME, pin))} from ${HOME.name}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="app-press w-9 h-9 rounded-full bg-[var(--app-pressed)] flex items-center justify-center shrink-0">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {p?.tip && <p className="text-[15px]">{p.tip}</p>}
      {facts && <p className="app-mono text-[13px] text-[var(--app-muted)]">{facts}</p>}
      {p?.deal && <p className="text-[14px] font-semibold text-[var(--app-primary)]">{p.deal}</p>}
      {p?.approx && <p className="text-[12px] text-[var(--app-faint)]">The pin shows the area. Directions finds the exact place.</p>}
      {p?.credit && <CreditLine credit={p.credit} />}
      {p?.addedBy && <p className="text-[12px] text-[var(--app-muted)]">Added by {p.addedBy} in Mumbai Onchain</p>}
      {p?.osm && <p className="text-[12px] text-[var(--app-faint)]">From OpenStreetMap</p>}
      <div className="flex flex-wrap gap-2 mt-1">
        <a href={directions(pin)} target="_blank" rel="noopener noreferrer" className={`${action} bg-[var(--app-ink)] text-[var(--app-bg)]`}>
          <Navigation className="w-4 h-4" aria-hidden="true" />
          Directions
        </a>
        {pin.kind === 'venue' && (
          <button type="button" onClick={onOpenVenues} className={`${action} bg-[var(--app-pressed)]`}>
            {pin.eventCount} event{pin.eventCount === 1 ? '' : 's'} here
          </button>
        )}
        {p?.phone && (
          <>
            <a href={`tel:+${digits(p.phone)}`} className={`${action} bg-[var(--app-pressed)]`}>
              <Phone className="w-4 h-4" aria-hidden="true" />
              Call
            </a>
            <a href={`https://wa.me/${digits(p.phone)}`} target="_blank" rel="noopener noreferrer" className={`${action} bg-[var(--app-pressed)]`}>
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              WhatsApp
            </a>
          </>
        )}
        {p?.link && (
          <a href={p.link} target="_blank" rel="noopener noreferrer" className={`${action} bg-[var(--app-pressed)]`}>
            Website
          </a>
        )}
        {p && <GoogleReviewsLink name={pin.name} area={pin.area} />}
      </div>
      {p && <PlaceReviews key={p.id} placeId={p.id} summary={summary} onRated={onRated} onRequireProfile={onRequireProfile} />}
    </div>
  );
}

/** The category's icon in its colour; venues show the Mumbai Onchain logo. */
function KindIcon({ kind, color, size }: { kind: Filter; color: string; size: number }) {
  if (kind === 'venue') {
    return <img src="/icons/icon-192.png" alt="" className="rounded-full shrink-0" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${color}` }} />;
  }
  if (kind === 'all') return null;
  const Icon = ICONS[kind];
  return (
    <span className="rounded-full shrink-0 inline-flex items-center justify-center text-[#121419]" style={{ width: size, height: size, background: color }} aria-hidden="true">
      <Icon width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} strokeWidth={2.4} />
    </span>
  );
}
