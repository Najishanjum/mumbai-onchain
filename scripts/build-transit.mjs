#!/usr/bin/env node
// Builds src/data/transit.ts: Mumbai's metro and local train lines (simplified)
// and the stations on them, from OpenStreetMap through the Overpass API.
//
//   npm run transit
//
// Overpass is often busy; the script retries. Check the station list after a
// run (new lines open, names change) and commit the result.

import { writeFileSync } from 'node:fs';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const BBOX = '18.88,72.76,19.33,73.12';

async function overpass(query) {
  for (let i = 0, wait = 15_000; i < 5; i++, wait *= 2) {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'user-agent': 'MumbaiOnchainMap/1.0 (https://www.mumbaionchain.site)' },
      body: new URLSearchParams({ data: query }),
    });
    const text = await res.text();
    if (res.ok && text.startsWith('{')) return JSON.parse(text).elements;
    console.log(`Overpass busy (${res.status}), retrying in ${wait / 1000}s`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error('Overpass kept refusing; try again later');
}

const routes = await overpass(
  `[out:json][timeout:160];(relation["route"~"^(subway|light_rail|monorail)$"](${BBOX});relation["route"="train"]["service"="commuter"](${BBOX});relation["route"="train"]["network"~"Suburban",i](${BBOX}););out geom;`
);
// Points, and station buildings (ways) at their centre.
const stations = (await overpass(`[out:json][timeout:100];(nwr["railway"="station"](${BBOX});nwr["public_transport"="station"](${BBOX}););out center;`))
  .map((e) => (e.center ? { ...e, lat: e.center.lat, lon: e.center.lon } : e))
  .filter((e) => e.lat != null);
// Which routes become which line, and its colour on a dark or light map.
const LINES = [
  { key: 'metro-1', kind: 'metro', name: 'Metro Line 1', color: '#3B82F6', match: (t) => t.network === 'Mumbai Metro' && t.ref === '1' },
  { key: 'metro-2a', kind: 'metro', name: 'Metro Line 2A', color: '#F2C200', match: (t) => t.network === 'Mumbai Metro' && t.ref === '2' },
  { key: 'metro-2b', kind: 'metro', name: 'Metro Line 2B', color: '#F2C200', match: (t) => t.network === 'Mumbai Metro' && t.ref === '2B' },
  { key: 'metro-3', kind: 'metro', name: 'Metro Line 3 (Aqua)', color: '#22C1D6', match: (t) => t.network === 'Mumbai Metro' && t.ref === '3' },
  { key: 'metro-7', kind: 'metro', name: 'Metro Line 7', color: '#EF4444', match: (t) => t.network === 'Mumbai Metro' && t.ref === '7' },
  { key: 'metro-9', kind: 'metro', name: 'Metro Line 9', color: '#EF4444', match: (t) => t.network === 'Mumbai Metro' && t.ref === '9' },
  { key: 'metro-n1', kind: 'metro', name: 'Navi Mumbai Metro Line 1', color: '#A855F7', match: (t) => t.network === 'Navi Mumbai Metro' },
  { key: 'train-w', kind: 'train', name: 'Western line', color: '#EAB308', match: (t) => t.network === 'Mumbai Suburban Railway' && t.ref === 'W' },
  { key: 'train-c', kind: 'train', name: 'Central line', color: '#F43F5E', match: (t) => t.network === 'Mumbai Suburban Railway' && t.ref === 'C' },
  { key: 'train-h', kind: 'train', name: 'Harbour line', color: '#6366F1', match: (t) => t.network === 'Mumbai Suburban Railway' && t.ref === 'H' },
  { key: 'train-t', kind: 'train', name: 'Trans-Harbour line', color: '#8B5CF6', match: (t) => t.network === 'Mumbai Suburban Railway' && t.ref === 'T' },
];
// The city and Navi Mumbai; branches out to Kasara or Khopoli are cut here.
const BOX = { s: 18.88, n: 19.33, w: 72.76, e: 73.12 };
const inBox = (p) => p.lat >= BOX.s && p.lat <= BOX.n && p.lon >= BOX.w && p.lon <= BOX.e;

/** Douglas-Peucker on [lng, lat] points, tolerance in degrees. */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = dx === 0 && dy === 0 ? Math.hypot(p[0] - a[0], p[1] - a[1]) : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy);
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
const r5 = (x) => Math.round(x * 1e5) / 1e5;

const features = [];
const lineSegments = []; // for matching stations: [kind, [lng,lat][]]
for (const L of LINES) {
  const seen = new Set();
  const parts = [];
  for (const r of routes.filter((x) => L.match(x.tags || {}))) {
    for (const m of r.members || []) {
      if (m.type !== 'way' || !m.geometry || seen.has(m.ref)) continue;
      seen.add(m.ref);
      // Split where the way leaves the box.
      let run = [];
      for (const p of m.geometry) {
        if (inBox(p)) run.push([p.lon, p.lat]);
        else if (run.length) { parts.push(run); run = []; }
      }
      if (run.length > 1) parts.push(run);
    }
  }
  const coords = parts.map((p) => simplify(p, 0.00008).map(([x, y]) => [r5(x), r5(y)])).filter((p) => p.length > 1);
  if (!coords.length) { console.log('no geometry for', L.key); continue; }
  coords.forEach((c) => lineSegments.push([L.kind, c]));
  features.push({ type: 'Feature', properties: { kind: L.kind, name: L.name, color: L.color }, geometry: { type: 'MultiLineString', coordinates: coords } });
}

/** Metres from a point to the nearest line of a kind. */
function nearest(kind, lat, lng) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110540;
  let best = Infinity;
  for (const [k, c] of lineSegments) {
    if (k !== kind) continue;
    for (let i = 1; i < c.length; i++) {
      const ax = (c[i - 1][0] - lng) * kx, ay = (c[i - 1][1] - lat) * ky, bx = (c[i][0] - lng) * kx, by = (c[i][1] - lat) * ky;
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }
  return best;
}

const out = [];
const names = new Set();
for (const n of stations) {
  const t = n.tags || {};
  // Rail only: public_transport=station also covers bus stations.
  const rail = t.railway === 'station' || t.train === 'yes' || t.subway === 'yes' || t.light_rail === 'yes' || t.monorail === 'yes' || /subway|light_rail|train|monorail/.test(t.station || '');
  if (!rail || t.bus === 'yes' || t.amenity === 'bus_station') continue;
  // One entry per station: "Ghatkopar Station (E)", "Vashi Railway", "Kurla West" → the station's name.
  const name = (t['name:en'] || t.name || '')
    .replace(/\s+(metro\s+)?station\s*(\((e|w)\))?$/i, '')
    .replace(/\s+\((e|w)\)$/i, '')
    .replace(/\s+railway$/i, '')
    .replace(/\s+[LM]\d+$/, '') // "Andheri L1": the line's code, not part of the name
    .replace(/\s+(east|west)$/i, '')
    .trim();
  if (!name || /\bbus\b/i.test(name) || !inBox(n)) continue;
  const metroish = /subway|light_rail|monorail/.test(t.station || '') || /metro/i.test(t.network || '');
  const kind = metroish ? 'metro' : 'train';
  if (nearest(kind, n.lat, n.lon) > (kind === "train" ? 400 : 250)) continue; // not on a line we draw (e.g. under construction)
  const key = `${kind}:${name.toLowerCase()}`;
  if (names.has(key)) continue;
  names.add(key);
  out.push({ name, kind, lat: r5(n.lat), lng: r5(n.lon) });
}
out.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

const credit = `From OpenStreetMap (© OpenStreetMap contributors, ODbL), downloaded ${new Date().toISOString().slice(0, 10)}
// through the Overpass API by scripts/build-transit.mjs.`;

// Stations: small, used on every event page ("Nearest station").
const stationsFile = `// Mumbai's metro and local train stations, for "Nearest station" on events
// and the map. ${credit}

export type TransitKind = 'metro' | 'train';

export interface Station {
  name: string;
  kind: TransitKind;
  lat: number;
  lng: number;
}

export const STATIONS: Station[] = ${JSON.stringify(out)};
`;

// Lines: only the map loads these.
const file = `// Mumbai's metro and local train lines, simplified, for the map's Metro and
// Local train layers. ${credit} Lines still being built are left out.

import type { TransitKind } from './stations';

export { STATIONS, type Station, type TransitKind } from './stations';

export interface TransitLine {
  type: 'Feature';
  properties: { kind: TransitKind; name: string; color: string };
  geometry: { type: 'MultiLineString'; coordinates: number[][][] };
}

export const TRANSIT_LINES: { type: 'FeatureCollection'; features: TransitLine[] } = ${JSON.stringify({ type: 'FeatureCollection', features })};
`;
writeFileSync(new URL('../src/data/stations.ts', import.meta.url), stationsFile);
writeFileSync(new URL('../src/data/transit.ts', import.meta.url), file);
console.log('lines', features.map((f) => `${f.properties.name}:${f.geometry.coordinates.reduce((s, c) => s + c.length, 0)}`).join(', '));
console.log('stations', out.length, 'metro', out.filter((s) => s.kind === 'metro').length, 'train', out.filter((s) => s.kind === 'train').length, 'bytes', file.length);
