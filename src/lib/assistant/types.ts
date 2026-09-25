import type { EventItem } from '../../types/event';
import type { PersonProfile } from '../../types/person';

export type MessageSender = 'user' | 'assistant';

export interface SourceReference {
  name: string;
  type: 'official' | 'luma' | 'local' | 'web' | 'community';
  url?: string;
  verifiedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  events?: EventItem[];
  people?: PersonProfile[];
  sources?: SourceReference[];
  suggestedQueries?: string[];
  isSearchingLive?: boolean;
}

export interface QueryContext {
  events: EventItem[];
  people: PersonProfile[];
  myProfile: PersonProfile | null;
  connections: Record<string, string>;
  notes: Record<string, any>;
  currentTime?: Date;
}

export interface AssistantResponse {
  content: string;
  events?: EventItem[];
  people?: PersonProfile[];
  sources: SourceReference[];
  suggestedFollowUps?: string[];
  sourceDiscrepancyNote?: string;
}
