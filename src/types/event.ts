export type EventStatus = 
  | 'VOLUNTEER'
  | 'ATTENDING'
  | 'INTERESTED'
  | 'PENDING'
  | 'PENDING APPROVAL'
  | 'MAYBE'
  | 'CONFLICT'
  | 'COMPLETED';

export type EventCategory =
  | 'Devcon'
  | 'Ecosystem'
  | 'Ethereum'
  | 'Solana'
  | 'Privacy'
  | 'Security'
  | 'DeFi'
  | 'Networking'
  | 'Hackathon'
  | 'AI'
  | 'Governance';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  organizer: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm or "TBA"
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm or "TBA"
  timezone: string;  // "Asia/Kolkata"
  location: string;  // Venue name
  address?: string;  // Full address
  latitude?: number;
  longitude?: number;
  officialUrl: string;
  mapUrl?: string;
  status: EventStatus;
  priority: 'PRIMARY' | 'HIGH' | 'NORMAL';
  isPrimary?: boolean; // For Devcon 8
  tags?: string[];
  devconTracks?: string[];
  imageUrl?: string;
}

export interface UserEventNote {
  id: string;
  eventId: string;
  peopleMet?: string;
  projects?: string;
  ideas?: string;
  followups?: string;
  takeaways?: string;
  contentIdea?: string;
  photos?: string[];
  updatedAt: string;
}

export interface ScheduleConflict {
  event1: EventItem;
  event2: EventItem;
  overlapStart: string;
  overlapEnd: string;
  date: string;
}

export interface FilterState {
  category: string; // 'ALL' or specific category
  date: string;     // 'ALL' or '2026-11-01' etc.
  status: string;   // 'ALL' or specific status
  searchQuery: string;
}
