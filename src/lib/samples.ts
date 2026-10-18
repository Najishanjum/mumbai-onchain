import { INITIAL_PEOPLE } from '../data/people';
import { INITIAL_SNAPS } from '../data/snaps';
import type { PersonProfile } from '../types/person';
import type { Snap } from '../types/snap';

// data/people.ts and data/snaps.ts are demo content (e.g. "Rohan Deshmukh")
// mixed into the directory and feed. The app hides them so attendees only
// see people who actually signed up.
// lean-ctx: app-only for now; remove from the website too once Najish agrees.
export const SAMPLE_PERSON_IDS = new Set(INITIAL_PEOPLE.map((p) => p.id));
const SAMPLE_SNAP_IDS = new Set(INITIAL_SNAPS.map((s) => s.id));

export const isRealPerson = (p: PersonProfile): boolean => !SAMPLE_PERSON_IDS.has(p.id);

export const isRealSnap = (s: Snap): boolean =>
  !SAMPLE_SNAP_IDS.has(s.id) && !SAMPLE_PERSON_IDS.has(s.authorId);
