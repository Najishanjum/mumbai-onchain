export type MatchCategory = 'EXCELLENT' | 'STRONG' | 'GOOD' | 'POTENTIAL';

export interface MatchScoreBreakdown {
  overall: number; // 0 - 100
  interests: number; // 0 - 100
  skills: number; // 0 - 100
  events: number; // 0 - 100
  location: number; // 0 - 100
  network: number; // 0 - 100
  category: MatchCategory;
  categoryLabel: string; // 'Excellent Match' | 'Strong Match' | 'Good Match' | 'Potential Connection'
  categoryEmoji: string; // '🔥' | '⚡' | '✦' | '○'
  categoryBadge: string; // '🔥 90–100% Excellent Match'
  reasons: string[]; // ['Both attending Devcon', 'Both interested in AI Agents', ...]
  sharedEvents: string[];
  sharedInterests: string[];
  sharedSkills: string[];
  mutualConnectionsCount: number;
}
