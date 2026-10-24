import { STATIONS, type Station, type TransitKind } from '../data/stations';

/** Metres between two points. */
function metres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

/** The closest metro and local train station, if within walking-ish distance (2 km). */
export function nearestStations(lat: number, lng: number): { station: Station; metres: number }[] {
  const out: { station: Station; metres: number }[] = [];
  for (const kind of ['metro', 'train'] as TransitKind[]) {
    let best: { station: Station; metres: number } | null = null;
    for (const s of STATIONS) {
      if (s.kind !== kind) continue;
      const d = metres(lat, lng, s.lat, s.lng);
      if (!best || d < best.metres) best = { station: s, metres: d };
    }
    if (best && best.metres <= 2000) out.push(best);
  }
  return out.sort((a, b) => a.metres - b.metres);
}

export const formatDistance = (m: number) => (m < 950 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(1)} km`);
