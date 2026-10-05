import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mumbai_onchain_id_registry_v1';
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
    avatarUrl: 'https://unavatar.io/twitter/vitalik',
    template: 'classic',
    tagline: "I'm building onchain in Mumbai",
    timestamp: Date.now() - 1000 * 60 * 4
  },
  {
    id: 88,
    handle: 'sandeepnailwal',
    displayName: 'Sandeep Nailwal',
    avatarUrl: 'https://unavatar.io/twitter/sandeepnailwal',
    template: 'journey',
    city: 'Delhi NCR',
    tagline: 'Building the future from Mumbai',
    timestamp: Date.now() - 1000 * 60 * 18
  },
  {
    id: 104,
    handle: 'aeyakovenko',
    displayName: 'Anatoly Yakovenko',
    avatarUrl: 'https://unavatar.io/twitter/aeyakovenko',
    template: 'postcard',
    tagline: 'Onchain Mumbai',
    timestamp: Date.now() - 1000 * 60 * 45
  },
  {
    id: 219,
    handle: 'dabit3',
    displayName: 'Nader Dabit',
    avatarUrl: 'https://unavatar.io/twitter/dabit3',
    template: 'classic',
    tagline: 'Connecting Mumbai onchain',
    timestamp: Date.now() - 1000 * 60 * 110
  },
  {
    id: 312,
    handle: 'kashdhanda',
    displayName: 'Kash Dhanda',
    avatarUrl: 'https://unavatar.io/twitter/kashdhanda',
    template: 'journey',
    city: 'San Francisco',
    tagline: 'Shipping from Mumbai',
    timestamp: Date.now() - 1000 * 60 * 180
  },
  {
    id: 405,
    handle: 'rahul_eth',
    displayName: 'Rahul Sharma',
    avatarUrl: 'https://unavatar.io/twitter/rahul_eth',
    template: 'postcard',
    tagline: 'Building at MumbaiOnChain',
    timestamp: Date.now() - 1000 * 60 * 240
  }
];

export function hashHandleToId(handle: string): number {
  if (!handle) return 1;
  const clean = handle.toLowerCase().replace(/[^a-z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 9000) + 100;
}

export function useIdManager() {
  const [registry, setRegistry] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

  const totalIds = BASE_COUNT + Object.keys(registry).length - 6;

  // Retrieve existing ID or create permanent deterministic ID for user
  const getIdForHandle = (handle: string): number => {
    const key = handle.toLowerCase().replace(/^@/, '').trim();
    if (!key) return 0;

    if (registry[key]) {
      return registry[key];
    }

    const assigned = hashHandleToId(key);
    const updated = { ...registry, [key]: assigned };
    setRegistry(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return assigned;
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
    getIdForHandle,
    registerGeneratedCard,
    totalIds,
    recentRecords
  };
}
