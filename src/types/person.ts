export type PersonCategory =
  | 'Builder'
  | 'Founder'
  | 'Volunteer'
  | 'Student'
  | 'Attendee'
  | 'Other';

export type ConnectionStatus = 'NOT_CONNECTED' | 'REQUESTED' | 'CONNECTED';

export interface ProfilePrivacySettings {
  profileVisibility: 'public' | 'community';
  showSnaps: boolean;
  allowTagging: boolean;
  showEvents: boolean;
  showMatchScore: boolean;
}

export interface ProfileActivityItem {
  id: string;
  type: 'snap' | 'event' | 'connect' | 'project';
  text: string;
  timestamp: string;
}

export interface PersonProfile {
  id: string;
  name: string;
  city: string;
  category: PersonCategory;
  bio: string;
  avatar?: string;
  headline?: string;
  currentlyBuilding?: string;
  lookingFor?: string;
  skills?: string[];
  interests?: string[];
  xHandle?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  telegramHandle?: string;
  farcasterHandle?: string;
  websiteUrl?: string;
  walletAddress?: string;
  attendingEvents: string[]; // event IDs matching EventItem.id
  isCurrentUser?: boolean;
  createdAt: string;
  privacySettings?: ProfilePrivacySettings;
  recentActivity?: ProfileActivityItem[];
}

export interface PeopleFilterState {
  searchQuery: string;
  category: string; // 'ALL' or PersonCategory
  eventId: string;  // 'ALL' or specific event ID
  connectionStatus: 'ALL' | 'CONNECTED' | 'REQUESTED';
}
