import { useState } from 'react';
import { calculateMocId, cleanUsername } from '../../lib/xProfileUtils';

const STORAGE_USER_ID_KEY = 'mumbai_onchain_moc_user_id_registry_v2';
const STORAGE_HANDLE_KEY = 'mumbai_onchain_id_registry_v1';
const BASE_COUNT = 1248;

export interface GeneratedIdRecord {
  id: number;
  handle: string;
  displayName: string;
  avatarUrl: string;
  template: 'classic' | 'postcard' | 'journey';
  city?: string;
  tagline?: string;
  timestamp: number;
}

const INITIAL_COMMUNITY_IDS: GeneratedIdRecord[] = [
  {
    id: 42,
    handle: 'vitalik',
    displayName: 'Vitalik Buterin',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1799793144837586944/0g8z61P-_400x400.jpg',
    template: 'classic',
    tagline: "I'm building onchain in Mumbai",
    timestamp: Date.now() - 1000 * 60 * 4
  },
  {
    id: 88,
    handle: 'sandeepnailwal',
    displayName: 'Sandeep Nailwal',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1684534720177340416/8h4u4o7g_400x400.jpg',
    template: 'journey',
    city: 'Delhi NCR',
    tagline: 'Building the future from Mumbai',
    timestamp: Date.now() - 1000 * 60 * 18
  },
  {
    id: 104,
    handle: 'aeyakovenko',
    displayName: 'Anatoly Yakovenko',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1715428987116490752/0WqH0v_4_400x400.jpg',
    template: 'postcard',
    tagline: 'Onchain Mumbai',
    timestamp: Date.now() - 1000 * 60 * 45
  },
  {
    id: 219,
    handle: 'dabit3',
    displayName: 'Nader Dabit',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1758620247654060032/KzB3OQxG_400x400.jpg',
    template: 'classic',
    tagline: 'Connecting Mumbai onchain',
    timestamp: Date.now() - 1000 * 60 * 110
  },
  {
    id: 312,
    handle: 'kashdhanda',
    displayName: 'Kash Dhanda',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1749871407355449344/vWzB0n0j_400x400.jpg',
    template: 'journey',
    city: 'San Francisco',
    tagline: 'Shipping from Mumbai',
    timestamp: Date.now() - 1000 * 60 * 180
  },
  {
    id: 405,
    handle: 'rahul_eth',
    displayName: 'Rahul Sharma',
    avatarUrl: '',
    template: 'postcard',
    tagline: 'Building at MumbaiOnChain',
    timestamp: Date.now() - 1000 * 60 * 240
  }
];

export function useIdManager() {
  // Map of X User ID -> MOC ID
  const [userIdRegistry, setUserIdRegistry] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_ID_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      '783214': 42, // Vitalik's X User ID
      '1102914175323537408': 88 // Sandeep
    };
  });

  // Map of handle -> MOC ID (legacy / fallback)
  const [handleRegistry, setHandleRegistry] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HANDLE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      vitalik: 42,
      sandeepnailwal: 88,
      aeyakovenko: 104,
      dabit3: 219,
      kashdhanda: 312,
      rahul_eth: 405
    };
  });

  const [recentRecords, setRecentRecords] = useState<GeneratedIdRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mumbai_onchain_recent_ids_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMMUNITY_IDS;
  });

  const totalIds = BASE_COUNT + Object.keys(handleRegistry).length - 6;

  // Retrieve existing ID or create permanent deterministic ID for user (X User ID primary, handle fallback)
  const getIdForProfile = (xUserId?: string, handle?: string): number => {
    const cleanHandle = cleanUsername(handle || '').toLowerCase();
    const cleanUserId = (xUserId || '').trim();

    // 1. Check by stable X User ID first
    if (cleanUserId && userIdRegistry[cleanUserId]) {
      return userIdRegistry[cleanUserId];
    }

    // 2. Check by handle
    if (cleanHandle && handleRegistry[cleanHandle]) {
      const assigned = handleRegistry[cleanHandle];
      if (cleanUserId && !userIdRegistry[cleanUserId]) {
        const updatedUserIds = { ...userIdRegistry, [cleanUserId]: assigned };
        setUserIdRegistry(updatedUserIds);
        try {
          localStorage.setItem(STORAGE_USER_ID_KEY, JSON.stringify(updatedUserIds));
        } catch (e) {
          console.error(e);
        }
      }
      return assigned;
    }

    // 3. Create permanent deterministic MOC ID
    const seed = cleanUserId || cleanHandle || 'moc_user';
    const assigned = calculateMocId(seed);

    if (cleanUserId) {
      const updatedUserIds = { ...userIdRegistry, [cleanUserId]: assigned };
      setUserIdRegistry(updatedUserIds);
      try {
        localStorage.setItem(STORAGE_USER_ID_KEY, JSON.stringify(updatedUserIds));
      } catch (e) {
        console.error(e);
      }
    }

    if (cleanHandle) {
      const updatedHandles = { ...handleRegistry, [cleanHandle]: assigned };
      setHandleRegistry(updatedHandles);
      try {
        localStorage.setItem(STORAGE_HANDLE_KEY, JSON.stringify(updatedHandles));
      } catch (e) {
        console.error(e);
      }
    }

    return assigned;
  };

  const getIdForHandle = (handle: string): number => {
    return getIdForProfile(undefined, handle);
  };

  const registerGeneratedCard = (record: GeneratedIdRecord) => {
    const updated = [record, ...recentRecords.filter((r) => r.handle.toLowerCase() !== record.handle.toLowerCase())].slice(0, 20);
    setRecentRecords(updated);
    try {
      localStorage.setItem('mumbai_onchain_recent_ids_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return {
    getIdForProfile,
    getIdForHandle,
    registerGeneratedCard,
    totalIds,
    recentRecords
  };
}
