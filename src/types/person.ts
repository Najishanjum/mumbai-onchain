export type PersonCategory =
  | 'Builder'
  | 'Founder'
  | 'Volunteer'
  | 'Student'
  | 'Attendee'
  | 'Other';

export type ConnectionStatus = 'NOT_CONNECTED' | 'REQUESTED' | 'CONNECTED';

export interface PersonProfile {
  id: string;
  name: string;
  city: string;
  category: PersonCategory;
  bio: string;
  avatar?: string;
  xHandle?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  attendingEvents: string[]; // event IDs matching EventItem.id
  isCurrentUser?: boolean;
  createdAt: string;
}

export interface PeopleFilterState {
  searchQuery: string;
  category: string; // 'ALL' or PersonCategory
  eventId: string;  // 'ALL' or specific event ID
  connectionStatus: 'ALL' | 'CONNECTED' | 'REQUESTED';
}
