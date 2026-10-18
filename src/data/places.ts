import { OSM_PLACES } from './osmPlaces';

// City guide for the Map (centre button → Map): places attendees need around
// the week, pinned next to the event venues. Event venues come from the
// schedule; everything here is added by hand.
//
// Hand-picked places live here; OpenStreetMap places are generated into
// osmPlaces.ts; places people add in the app come from community_places.

export type PlaceCategory =
  | 'stay'
  | 'food'
  | 'cafe'
  | 'cowork'
  | 'laundry'
  | 'health'
  | 'money'
  | 'sim'
  | 'transport';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  area?: string;
  /** One line that helps someone decide: "Dorms and private rooms, 10 min to the metro". */
  tip?: string;
  price?: string;
  hours?: string;
  /** With country code, digits only or +91…; used for Call and WhatsApp. */
  phone?: string;
  link?: string;
  /** A discount or perk for Mumbai Onchain attendees. */
  deal?: string;
  sample?: boolean;
  /** From OpenStreetMap (osmPlaces.ts). */
  osm?: boolean;
  /** Added in the app by someone (community_places); their name for the card. */
  addedBy?: string;
  /** The pin marks the neighbourhood, not the door; Directions searches by name instead. */
  approx?: boolean;
  /** Who recommended it, credited on the card with a link to their post. */
  credit?: Credit;
}

export const PLACE_CATEGORIES: { id: PlaceCategory; label: string; color: string }[] = [
  { id: 'stay', label: 'Stay', color: '#7C9BFF' },
  { id: 'food', label: 'Food', color: '#FF7A4D' },
  { id: 'cafe', label: 'Cafés', color: '#D6A274' },
  { id: 'cowork', label: 'Coworking', color: '#5FD3B0' },
  { id: 'laundry', label: 'Laundry', color: '#8FD3FF' },
  { id: 'health', label: 'Pharmacy', color: '#FF7AA2' },
  { id: 'money', label: 'ATM', color: '#FFC93A' },
  { id: 'sim', label: 'SIM', color: '#B79BFF' },
  { id: 'transport', label: 'Transport', color: '#AEB6C2' },
];

export interface Credit {
  name: string;
  source: string;
  /** What the list was, shown above the places: "Hostel picks". */
  list: string;
  url: string;
}

// Picks from Nidhi's threads for India Blockchain Week (@IBWofficial): hostels
// (13 Oct 2026) and cafés (11 Sep 2026). Tips are short summaries; each card
// links to her thread.
const NIDHI_HOSTELS: Credit = { name: 'Nidhi', source: 'India Blockchain Week', list: 'Hostel picks', url: 'https://x.com/IBWofficial/status/2109986968021147833' };
const NIDHI_CAFES: Credit = { name: 'Nidhi', source: 'India Blockchain Week', list: 'Café picks', url: 'https://x.com/IBWofficial/status/2098393891930284485' };

const HOSTELS: Place[] = [
  { id: 'hosteller-chakala', name: 'The Hosteller', category: 'stay', lat: 19.1044, lng: 72.8594, area: 'Chakala, Andheri East', tip: 'New and spotless; every bunk has a privacy curtain, lamp and charger. Quiet, professional crowd.', price: 'From ₹1,300', credit: NIDHI_HOSTELS },
  { id: 'ostelo-saki-naka', name: 'Ostelo', category: 'stay', lat: 19.1036, lng: 72.8885, area: 'Saki Naka', tip: 'Best value: personal fan and under-bed storage, kitchen and TV lounge. Near the metro and airport.', price: 'From ₹935', credit: NIDHI_HOSTELS, approx: true },
  { id: 'zostel-marol', name: 'Zostel Mumbai', category: 'stay', lat: 19.117, lng: 72.882, area: 'Marol', tip: 'Big café, rooftop and an AC workspace. Livelier on weekends.', price: 'From ₹1,209', credit: NIDHI_HOSTELS, approx: true },
  { id: 'backpackers-villa-andheri', name: 'Backpackers Villa', category: 'stay', lat: 19.118, lng: 72.856, area: 'Andheri East', tip: 'Graffiti walls, chill crowd, two minutes from the metro.', price: 'From ₹1,009', credit: NIDHI_HOSTELS, approx: true },
  { id: 'locomo-og-vile-parle', name: 'Locomo Hostel OG', category: 'stay', lat: 19.099, lng: 72.849, area: 'Vile Parle East', tip: 'Great rooftop, AC workspace and breakfast included. Near the station, halfway between IBW and Devcon.', price: 'From ₹1,320', credit: NIDHI_HOSTELS, approx: true },
  { id: 'namastey-mumbai-bandra', name: 'Namastey Mumbai Backpackers', category: 'stay', lat: 19.064, lng: 72.829, area: 'Pali Village, Bandra', tip: 'Nidhi’s own pick: cafés a short walk away, generous breakfast and a social common area.', credit: NIDHI_HOSTELS, approx: true },
  { id: 'forrest-bandra-east', name: 'Forrest Hostels', category: 'stay', lat: 19.0647, lng: 72.8499, area: 'Bandra East', tip: 'Themed rooms, a café inside, cleaned three times a day. Right next to BKC.', price: 'From ₹1,264', credit: NIDHI_HOSTELS },
  { id: 'hammock-khar', name: 'Hammock Hostels', category: 'stay', lat: 19.07, lng: 72.827, area: 'Chuim Village, Khar', tip: 'Terrace breakfast, evening events and very clean. The cheapest bed on her list.', price: 'From ₹892', credit: NIDHI_HOSTELS, approx: true },
  { id: 'backpacker-cowies-colaba', name: 'Backpacker Cowies', category: 'stay', lat: 18.923, lng: 72.831, area: 'Walton Road, Colaba', tip: 'For South Bombay: minutes from the Gateway of India, with a busy rooftop at night.', price: 'From ₹1,143', credit: NIDHI_HOSTELS, approx: true },
  { id: 'indie-stays-kalina', name: 'Indie Stays', category: 'stay', lat: 19.0773, lng: 72.8615, area: 'Kalina', tip: 'Best if you stay on for Devcon: near BKC, big lounge, clean AC dorms, breakfast included. Popular with solo women travellers.', price: 'From ₹1,559', credit: NIDHI_HOSTELS, approx: true },
];

const CAFES: Place[] = [
  { id: 'subko-mary-lodge', name: 'Subko, Mary Lodge', category: 'cafe', lat: 19.0532, lng: 72.8301, area: 'Chapel Road, Bandra', tip: 'Big space where everyone can sit and work. Try the Sif on the Rocks.', credit: NIDHI_CAFES },
  { id: 'boojee-bandra', name: 'Boojee Café', category: 'cafe', lat: 19.0606, lng: 72.8245, area: 'Bandra', tip: 'The brunch spot right now: two floors, busy from morning. The queue moves fast.', credit: NIDHI_CAFES },
  { id: 'mokai-pali-hill', name: 'Mokai', category: 'cafe', lat: 19.0524, lng: 72.8285, area: 'Pali Hill, Bandra', tip: 'The matcha place, with eight kinds. Full every day.', credit: NIDHI_CAFES, approx: true },
  { id: 'veronicas-bandra', name: 'Veronica’s', category: 'cafe', lat: 19.054, lng: 72.8268, area: 'Waroda Road, Bandra', tip: 'Sandwiches worth the hype; the queue runs on WhatsApp, so add your name and walk around.', credit: NIDHI_CAFES },
  { id: 'leopold-colaba', name: 'Leopold Cafe', category: 'cafe', lat: 18.9227, lng: 72.8318, area: 'Colaba', tip: 'A legendary café. Go once for the room and the history.', credit: NIDHI_CAFES },
  { id: 'mondegar-colaba', name: 'Café Mondegar', category: 'cafe', lat: 18.924, lng: 72.8322, area: 'Colaba', tip: 'Leopold’s legendary neighbour. Go for the room and the history.', credit: NIDHI_CAFES },
  { id: 'pomodoro-bandra', name: 'Pomodoro', category: 'food', lat: 19.0644, lng: 72.831, area: '16th Road, Bandra', tip: 'Outstanding pasta, best with friends. Get the truffle parmesan fries.', credit: NIDHI_CAFES },
  { id: 'dough-and-joe-bandra', name: 'Dough & Joe', category: 'cafe', lat: 19.0547, lng: 72.834, area: 'Hill Road, Bandra', tip: 'Dough knots and hot chocolate, open till 4am.', credit: NIDHI_CAFES, approx: true },
  { id: 'banyan-tree-ballard', name: 'The Banyan Tree', category: 'cafe', lat: 18.9324, lng: 72.8361, area: 'Ballard Estate', tip: 'In Mumbai’s first ice factory around a 150-year-old banyan. Calm, and good for meetings.', credit: NIDHI_CAFES, approx: true },
  { id: 'bayview-colaba', name: 'Bayview Cafe', category: 'cafe', lat: 18.9205, lng: 72.8335, area: 'Colaba', tip: 'Rooftop facing the Gateway and the Taj. Big portions; go early or in the evening.', credit: NIDHI_CAFES, approx: true },
  { id: 'scarlett-house-bandra', name: 'Scarlett House', category: 'cafe', lat: 19.0629, lng: 72.8299, area: 'Pali Village, Bandra', tip: 'Reservation only. Great interiors, good for dates and meetings.', credit: NIDHI_CAFES },
];

const PICKS = [...HOSTELS, ...CAFES];

/** About 150 m: the same name this close is the same place. */
const near = (a: Place, b: Place) => Math.abs(a.lat - b.lat) < 0.0015 && Math.abs(a.lng - b.lng) < 0.0015;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Hand-picked places first; OpenStreetMap fills in the rest, minus anything
// already picked (e.g. Mokai, Café Mondegar).
export const PLACES: Place[] = [
  ...PICKS,
  ...OSM_PLACES.filter((o) => !PICKS.some((p) => near(p, o) && (norm(p.name).includes(norm(o.name)) || norm(o.name).includes(norm(p.name))))),
];
