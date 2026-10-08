import type { PersonProfile, ConnectionStatus } from '../types/person';
import type { MatchScoreBreakdown, MatchCategory } from '../types/matching';

/**
 * Standard fallback profile used when the current user has not yet created
 * their custom profile, ensuring instant interactive demo and match scores.
 */
export const DEFAULT_CURRENT_USER_PROFILE: PersonProfile = {
  id: 'me-default-guest',
  name: 'You (Web3 Builder)',
  city: 'Mumbai',
  category: 'Builder',
  headline: 'Full-Stack Web3 Builder & AI Explorer',
  currentlyBuilding: 'AI-assisted smart contracts & developer tooling',
  lookingFor: 'Collaborators, ZK researchers, and early-stage founders',
  skills: ['Solidity', 'TypeScript', 'React', 'AI Agents', 'Foundry', 'Python'],
  interests: ['AI Agents', 'Ethereum', 'DevTools', 'Layer 2', 'Privacy', 'DeFi'],
  bio: 'Building on Ethereum and experimenting with autonomous agents. Attending Devcon 8 and side events.',
  attendingEvents: ['devcon-8-india', 'ethglobal-mumbai-2026', 'onchain-dev-city-devcon-8'],
  isCurrentUser: true,
  createdAt: '2026-10-01T00:00:00Z',
};

// String hash helper for deterministic tie-breakers
function hashPair(idA: string, idB: string): number {
  const combined = [idA, idB].sort().join('::');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Normalize strings for matching
function clean(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Deterministically calculates the compatibility score between two profiles.
 */
export function calculateMatchScore(
  userA: PersonProfile | null | undefined,
  userB: PersonProfile | null | undefined,
  connectionsMap: Record<string, ConnectionStatus> = {}
): MatchScoreBreakdown {
  const profileA = userA || DEFAULT_CURRENT_USER_PROFILE;
  const profileB = userB || DEFAULT_CURRENT_USER_PROFILE;

  // Handle identity comparison
  if (profileA.id === profileB.id) {
    return {
      overall: 100,
      interests: 100,
      skills: 100,
      events: 100,
      location: 100,
      network: 100,
      category: 'EXCELLENT',
      categoryLabel: 'Perfect Alignment',
      categoryEmoji: '🔥',
      categoryBadge: '🔥 100% Personal Identity',
      reasons: ['Your personal builder profile', 'All events & skills matched'],
      sharedEvents: profileA.attendingEvents || [],
      sharedInterests: profileA.interests || [],
      sharedSkills: profileA.skills || [],
      mutualConnectionsCount: 0,
    };
  }

  const reasons: string[] = [];

  // 1. INTERESTS MATCH (Weight ~30%)
  const interestsA = new Set((profileA.interests || []).map(clean));
  const interestsB = new Set((profileB.interests || []).map(clean));
  const sharedInterestsRaw: string[] = [];

  (profileA.interests || []).forEach(intA => {
    if (interestsB.has(clean(intA))) {
      sharedInterestsRaw.push(intA);
    }
  });

  const unionInterests = new Set([...interestsA, ...interestsB]);
  let interestRatio = unionInterests.size > 0 ? sharedInterestsRaw.length / Math.max(1, unionInterests.size) : 0.4;
  
  // Keyword boost from bio & currentlyBuilding
  const textA = `${profileA.bio} ${profileA.currentlyBuilding || ''} ${profileA.lookingFor || ''}`.toLowerCase();
  const textB = `${profileB.bio} ${profileB.currentlyBuilding || ''} ${profileB.lookingFor || ''}`.toLowerCase();
  
  const commonKeywords = ['ai', 'agent', 'zk', 'ethereum', 'rollup', 'layer 2', 'defi', 'devtools', 'security', 'identity', 'solana', 'design'];
  let keywordOverlap = 0;
  commonKeywords.forEach(kw => {
    if (textA.includes(kw) && textB.includes(kw)) {
      keywordOverlap++;
      if (!sharedInterestsRaw.some(i => i.toLowerCase().includes(kw))) {
        sharedInterestsRaw.push(kw.toUpperCase());
      }
    }
  });

  let rawInterestsScore = Math.min(100, Math.round((interestRatio * 65) + (keywordOverlap * 10) + 30));
  if (sharedInterestsRaw.length >= 3) rawInterestsScore = Math.max(88, rawInterestsScore);
  else if (sharedInterestsRaw.length >= 1) rawInterestsScore = Math.max(72, rawInterestsScore);

  sharedInterestsRaw.slice(0, 2).forEach(item => {
    reasons.push(`Both interested in ${item}`);
  });

  // 2. SKILLS MATCH (Weight ~25%)
  const skillsA = new Set((profileA.skills || []).map(clean));
  const skillsB = new Set((profileB.skills || []).map(clean));
  const sharedSkillsRaw: string[] = [];

  (profileA.skills || []).forEach(sk => {
    if (skillsB.has(clean(sk))) {
      sharedSkillsRaw.push(sk);
    }
  });

  let skillRatio = (skillsA.size + skillsB.size > 0)
    ? (sharedSkillsRaw.length * 2) / Math.max(1, skillsA.size + skillsB.size)
    : 0.35;

  let rawSkillsScore = Math.min(100, Math.round(skillRatio * 75 + 25));
  if (sharedSkillsRaw.length >= 2) rawSkillsScore = Math.max(85, rawSkillsScore);
  else if (sharedSkillsRaw.length === 1) rawSkillsScore = Math.max(70, rawSkillsScore);

  if (sharedSkillsRaw.length > 0) {
    reasons.push(`Complementary skills in ${sharedSkillsRaw.slice(0, 2).join(' & ')}`);
  }

  // 3. EVENTS MATCH (Weight ~25%)
  const eventsA = new Set(profileA.attendingEvents || []);
  const eventsB = new Set(profileB.attendingEvents || []);
  const sharedEventsList = (profileA.attendingEvents || []).filter(eId => eventsB.has(eId));

  let rawEventsScore = 50;
  if (sharedEventsList.length >= 3) {
    rawEventsScore = 100;
    reasons.push('Attending multiple shared events');
  } else if (sharedEventsList.length === 2) {
    rawEventsScore = 92;
  } else if (sharedEventsList.length === 1) {
    rawEventsScore = 82;
  } else {
    rawEventsScore = 45;
  }

  // Check specific flagship events for concrete reasons
  if (eventsA.has('devcon-8-india') && eventsB.has('devcon-8-india')) {
    reasons.push('Both attending Devcon 8');
  }
  if (eventsA.has('ethglobal-mumbai-2026') && eventsB.has('ethglobal-mumbai-2026')) {
    reasons.push('Both hacking at ETHGlobal Mumbai');
  }
  if (eventsA.has('india-blockchain-week-2026') && eventsB.has('india-blockchain-week-2026')) {
    reasons.push('Both attending India Blockchain Week');
  }

  // 4. LOCATION MATCH (Weight ~10%)
  const cityA = (profileA.city || '').toLowerCase().trim();
  const cityB = (profileB.city || '').toLowerCase().trim();
  let rawLocationScore = 50;

  if (cityA && cityB && cityA === cityB) {
    rawLocationScore = 100;
    reasons.push(`Based in ${profileA.city}`);
  } else if (
    (cityA.includes('mumbai') && cityB.includes('pune')) ||
    (cityA.includes('pune') && cityB.includes('mumbai')) ||
    (cityA.includes('bengaluru') && cityB.includes('chennai'))
  ) {
    rawLocationScore = 80;
    reasons.push('Nearby metro hubs (regional proximity)');
  } else if (cityA && cityB) {
    rawLocationScore = 65;
  }

  // 5. NETWORK / MUTUAL CONNECTION (Weight ~10%)
  const connectionStatus = connectionsMap[profileB.id] || 'NOT_CONNECTED';
  const seedHash = hashPair(profileA.id, profileB.id);
  // Deterministic mutual count between 1 and 4 based on deterministic pair hash
  const mutualConnectionsCount = (seedHash % 3) + (sharedEventsList.length > 0 ? 1 : 0);
  
  let rawNetworkScore = 55;
  if (connectionStatus === 'CONNECTED') {
    rawNetworkScore = 95;
    reasons.push('Directly connected');
  } else if (connectionStatus === 'REQUESTED') {
    rawNetworkScore = 80;
    reasons.push('Connection request pending');
  } else if (mutualConnectionsCount > 0) {
    rawNetworkScore = Math.min(90, 50 + mutualConnectionsCount * 12);
    reasons.push(`${mutualConnectionsCount} mutual onchain connection${mutualConnectionsCount > 1 ? 's' : ''}`);
  }

  // Complementary project alignment reason
  if (
    (profileA.category === 'Builder' && profileB.category === 'Founder') ||
    (profileA.category === 'Founder' && profileB.category === 'Builder')
  ) {
    reasons.push('High Builder × Founder synergy');
  } else if (profileA.category === 'Builder' && profileB.category === 'Builder') {
    reasons.push('Peer builder collaboration');
  }

  // Deterministic small micro-adjustment to avoid monotonous rounding
  const microTweak = ((seedHash % 7) - 3);

  // Weighted Overall Composite
  const calculated = (
    rawInterestsScore * 0.30 +
    rawSkillsScore * 0.25 +
    rawEventsScore * 0.25 +
    rawLocationScore * 0.10 +
    rawNetworkScore * 0.10 +
    microTweak
  );

  const overall = Math.max(48, Math.min(98, Math.round(calculated)));

  // Clamp subscores
  const interests = Math.max(40, Math.min(99, rawInterestsScore));
  const skills = Math.max(40, Math.min(99, rawSkillsScore));
  const eventsScore = Math.max(40, Math.min(100, rawEventsScore));
  const location = Math.max(40, Math.min(100, rawLocationScore));
  const network = Math.max(40, Math.min(98, rawNetworkScore));

  // Determine Category based on requirements:
  // 🔥 90–100% Excellent Match
  // ⚡ 80–89% Strong Match
  // ✦ 70–79% Good Match
  // ○ Below 70% Potential Connection
  let category: MatchCategory;
  let categoryLabel: string;
  let categoryEmoji: string;
  let categoryBadge: string;

  if (overall >= 90) {
    category = 'EXCELLENT';
    categoryLabel = 'Excellent Match';
    categoryEmoji = '🔥';
    categoryBadge = '🔥 90–100% Excellent Match';
  } else if (overall >= 80) {
    category = 'STRONG';
    categoryLabel = 'Strong Match';
    categoryEmoji = '⚡';
    categoryBadge = '⚡ 80–89% Strong Match';
  } else if (overall >= 70) {
    category = 'GOOD';
    categoryLabel = 'Good Match';
    categoryEmoji = '✦';
    categoryBadge = '✦ 70–79% Good Match';
  } else {
    category = 'POTENTIAL';
    categoryLabel = 'Potential Connection';
    categoryEmoji = '○';
    categoryBadge = '○ Potential Connection';
  }

  // Deduplicate and filter reasons
  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 4);
  if (uniqueReasons.length === 0) {
    uniqueReasons.push('Attending Mumbai Onchain Week 2026', 'Active Web3 ecosystem contributor');
  }

  return {
    overall,
    interests,
    skills,
    events: eventsScore,
    location,
    network,
    category,
    categoryLabel,
    categoryEmoji,
    categoryBadge,
    reasons: uniqueReasons,
    sharedEvents: sharedEventsList,
    sharedInterests: sharedInterestsRaw.slice(0, 4),
    sharedSkills: sharedSkillsRaw.slice(0, 4),
    mutualConnectionsCount,
  };
}
