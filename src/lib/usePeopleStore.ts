import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { PersonProfile, ConnectionStatus, PeopleFilterState } from '../types/person';
import { INITIAL_PEOPLE } from '../data/people';
import { supabase, isSupabaseConfigured } from './supabase';
import { signOut } from './auth';

const PEOPLE_STORAGE_KEY = 'mumbai_onchain_people_profiles_v2';
const MY_PROFILE_STORAGE_KEY = 'mumbai_onchain_my_profile_v2';
const CONNECTIONS_STORAGE_KEY = 'mumbai_onchain_connections_v2';

interface DbProfileRow {
  id: string;
  name: string;
  city: string;
  category: string;
  bio?: string | null;
  avatar?: string | null;
  x_handle?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  attending_events?: string[] | null;
  created_at?: string;
  // Added by supabase/migrations/20261015000000_accounts_and_rls.sql
  owner_id?: string | null;
  headline?: string | null;
  currently_building?: string | null;
  looking_for?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  telegram_handle?: string | null;
  farcaster_handle?: string | null;
  website_url?: string | null;
}

function mapDbToPerson(row: DbProfileRow, myProfileId?: string): PersonProfile {
  return {
    id: row.id,
    name: row.name || 'Anonymous Builder',
    city: row.city || 'Mumbai',
    category: (row.category as PersonProfile['category']) || 'Builder',
    bio: row.bio || '',
    avatar: row.avatar || '',
    xHandle: row.x_handle || '',
    githubUrl: row.github_url || '',
    linkedinUrl: row.linkedin_url || '',
    attendingEvents: Array.isArray(row.attending_events) ? row.attending_events : [],
    headline: row.headline || '',
    currentlyBuilding: row.currently_building || '',
    lookingFor: row.looking_for || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    interests: Array.isArray(row.interests) ? row.interests : [],
    telegramHandle: row.telegram_handle || '',
    farcasterHandle: row.farcaster_handle || '',
    websiteUrl: row.website_url || '',
    isCurrentUser: Boolean(myProfileId && row.id === myProfileId),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function personToDbRow(p: PersonProfile, ownerId: string) {
  return {
    id: p.id,
    owner_id: ownerId,
    name: p.name,
    city: p.city,
    category: p.category,
    bio: p.bio || '',
    avatar: p.avatar || '',
    x_handle: p.xHandle || '',
    github_url: p.githubUrl || '',
    linkedin_url: p.linkedinUrl || '',
    attending_events: p.attendingEvents || [],
    headline: p.headline || '',
    currently_building: p.currentlyBuilding || '',
    looking_for: p.lookingFor || '',
    skills: p.skills || [],
    interests: p.interests || [],
    telegram_handle: p.telegramHandle || '',
    farcaster_handle: p.farcasterHandle || '',
    website_url: p.websiteUrl || '',
    updated_at: new Date().toISOString(),
  };
}

function usePeopleStoreState() {
  const isCloudConnected = isSupabaseConfigured();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load Community directory from LocalStorage initially as fallback
  const [people, setPeople] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem(PEOPLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: PersonProfile) => p.id));
          const missing = INITIAL_PEOPLE.filter(p => !existingIds.has(p.id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {
      console.error('Error reading people from localStorage:', e);
    }
    return INITIAL_PEOPLE;
  });

  // Load Current User's Profile from LocalStorage
  const [myProfile, setMyProfile] = useState<PersonProfile | null>(() => {
    try {
      const saved = localStorage.getItem(MY_PROFILE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading myProfile from localStorage:', e);
    }
    return null;
  });

  // Load Connections status from LocalStorage: { [profileId: string]: 'NOT_CONNECTED' | 'REQUESTED' | 'CONNECTED' }
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>(() => {
    try {
      const saved = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading connections from localStorage:', e);
    }
    return {
      'person-aarav-patel': 'CONNECTED',
      'person-priya-sharma': 'REQUESTED',
    };
  });

  // Active drawer/modal states
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<PeopleFilterState>({
    searchQuery: '',
    category: 'ALL',
    eventId: 'ALL',
    connectionStatus: 'ALL',
  });

  // Save people list to LocalStorage as cache
  useEffect(() => {
    try {
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
    } catch (e) {
      console.error('Failed to save people to localStorage:', e);
    }
  }, [people]);

  // Save current user profile to LocalStorage
  useEffect(() => {
    try {
      if (myProfile) {
        localStorage.setItem(MY_PROFILE_STORAGE_KEY, JSON.stringify(myProfile));
      } else {
        localStorage.removeItem(MY_PROFILE_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save myProfile to localStorage:', e);
    }
  }, [myProfile]);

  // Save connections map to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
    } catch (e) {
      console.error('Failed to save connections to localStorage:', e);
    }
  }, [connections]);

  // Fetch profiles from Supabase and subscribe to realtime changes
  const fetchSupabaseProfiles = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not load profiles from Supabase:', error.message);
        return;
      }

      if (data) {
        const remoteProfiles = (data as DbProfileRow[]).map(row => mapDbToPerson(row, myProfile?.id));
        
        setPeople(prev => {
          const map = new Map<string, PersonProfile>();
          // Base seeded profiles
          INITIAL_PEOPLE.forEach(p => map.set(p.id, p));
          // Cached local profiles
          prev.forEach(p => map.set(p.id, p));
          // Remote profiles from Supabase override
          remoteProfiles.forEach(p => map.set(p.id, p));

          // Ensure current user profile is correctly tagged
          if (myProfile) {
            const existing = map.get(myProfile.id);
            if (existing) {
              map.set(myProfile.id, { ...existing, ...myProfile, isCurrentUser: true });
            } else {
              map.set(myProfile.id, { ...myProfile, isCurrentUser: true });
            }
          }

          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error('Error in fetchSupabaseProfiles:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [myProfile?.id]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    fetchSupabaseProfiles();

    // Set up Realtime listener for cross-browser live sync
    const channel = client
      .channel('realtime:community_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedPerson = mapDbToPerson(payload.new as DbProfileRow, myProfile?.id);
            setPeople(prev => {
              const idx = prev.findIndex(p => p.id === updatedPerson.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = {
                  ...updatedPerson,
                  isCurrentUser: Boolean(myProfile && myProfile.id === updatedPerson.id),
                };
                return next;
              } else {
                return [updatedPerson, ...prev];
              }
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setPeople(prev => prev.filter(p => p.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchSupabaseProfiles, myProfile?.id]);

  // Ensure current user's profile is synchronized in the community directory locally
  useEffect(() => {
    if (!myProfile) return;
    setPeople(prev => {
      const existingIdx = prev.findIndex(p => p.id === myProfile.id || p.isCurrentUser);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...myProfile, isCurrentUser: true };
        return updated;
      } else {
        return [{ ...myProfile, isCurrentUser: true }, ...prev];
      }
    });
  }, [myProfile]);

  // ── Accounts ────────────────────────────────────────────────────────────
  // The signed-in Supabase user; profiles and snaps are owned by this ID.
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Latest local profile, read by the attach step without re-running it.
  const myProfileRef = useRef<PersonProfile | null>(myProfile);
  useEffect(() => {
    myProfileRef.current = myProfile;
  }, [myProfile]);

  // On sign-in: load this account's profile (a new phone, or Safari vs the
  // installed app), or attach the profile already on this device to it.
  const attachedFor = useRef<string | null>(null);
  // Which account has finished loading/attaching its profile, so the UI knows
  // whether to show "create your pass" or the restored one.
  const [accountReadyFor, setAccountReadyFor] = useState<string | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!authUser || !client || attachedFor.current === authUser.id) return;
    attachedFor.current = authUser.id;
    const uid = authUser.id;

    (async () => {
      try {
        await attach(client, uid);
      } finally {
        setAccountReadyFor(uid);
      }
    })();

    async function attach(client: NonNullable<typeof supabase>, uid: string) {
      const { data: owned } = await client.from('profiles').select('*').eq('owner_id', uid).maybeSingle();
      if (owned) {
        setMyProfile({ ...mapDbToPerson(owned as DbProfileRow, owned.id), isCurrentUser: true });
        return;
      }
      const local = myProfileRef.current;
      if (!local) return; // nothing to keep; they'll create a profile

      // A profile made on this device before accounts existed.
      const { data: claimed } = await client.rpc('claim_profile', { p_profile_id: local.id });
      const keepId = (claimed as DbProfileRow | null)?.id;
      // Not in the cloud yet, or not claimable: save it as a new owned profile.
      const id = keepId || `user-${uid}`;
      const profile = { ...local, id, isCurrentUser: true };
      const { error } = await client.from('profiles').upsert(personToDbRow(profile, uid));
      if (error) console.error('Could not attach profile to account:', error.message);
      setMyProfile(profile);
    }
  }, [authUser]);

  const signOutAndClear = useCallback(async () => {
    await signOut();
    attachedFor.current = null;
    // The profile stays in the account; this device just forgets it.
    setMyProfile(null);
  }, []);

  // Save or Update My Profile (both locally and to Supabase)
  const saveMyProfile = useCallback(async (profileData: Partial<PersonProfile>) => {
    const id = myProfile?.id || (authUser ? `user-${authUser.id}` : `user-profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    const newProfile: PersonProfile = {
      // Keep every field the editor sends (headline, skills, interests,
      // Telegram, website…). Only the columns below exist in Supabase today,
      // but the rest must at least survive on this device.
      ...myProfile,
      ...profileData,
      id,
      name: profileData.name || 'Anonymous Builder',
      city: profileData.city || 'Mumbai',
      category: profileData.category || 'Builder',
      bio: profileData.bio || '',
      avatar: profileData.avatar || '',
      xHandle: profileData.xHandle || '',
      githubUrl: profileData.githubUrl || '',
      linkedinUrl: profileData.linkedinUrl || '',
      attendingEvents: profileData.attendingEvents || ['devcon-8-india'],
      isCurrentUser: true,
      createdAt: myProfile?.createdAt || new Date().toISOString(),
    };

    // Immediate optimistic local update
    setMyProfile(newProfile);
    setIsEditModalOpen(false);

    // Sync to Supabase. The database only accepts writes from the signed-in
    // owner; without an account the profile stays on this device until they
    // sign in (the attach step above uploads it then).
    if (isSupabaseConfigured() && supabase && authUser) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('profiles').upsert(personToDbRow(newProfile, authUser.id));
        if (error) {
          console.error('Supabase profile save error:', error);
        }
      } catch (e) {
        console.error('Failed to sync profile to Supabase:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [myProfile, authUser]);

  // Transition connection: CONNECT -> REQUESTED -> CONNECTED -> NOT_CONNECTED
  const cycleConnection = useCallback((personId: string) => {
    setConnections(prev => {
      const current = prev[personId] || 'NOT_CONNECTED';
      let next: ConnectionStatus;
      if (current === 'NOT_CONNECTED') {
        next = 'REQUESTED';
      } else if (current === 'REQUESTED') {
        next = 'CONNECTED';
      } else {
        next = 'NOT_CONNECTED';
      }
      return { ...prev, [personId]: next };
    });
  }, []);

  const setConnectionStatus = useCallback((personId: string, status: ConnectionStatus) => {
    setConnections(prev => ({
      ...prev,
      [personId]: status,
    }));
  }, []);

  const getConnectionStatus = useCallback((personId: string): ConnectionStatus => {
    return connections[personId] || 'NOT_CONNECTED';
  }, [connections]);

  // Filtered list calculation
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      if (filters.category !== 'ALL' && person.category !== filters.category) {
        return false;
      }

      if (filters.eventId !== 'ALL' && !person.attendingEvents.includes(filters.eventId)) {
        return false;
      }

      const status = connections[person.id] || 'NOT_CONNECTED';
      if (filters.connectionStatus === 'CONNECTED' && status !== 'CONNECTED') {
        return false;
      }
      if (filters.connectionStatus === 'REQUESTED' && status !== 'REQUESTED') {
        return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchName = person.name.toLowerCase().includes(q);
        const matchCity = person.city.toLowerCase().includes(q);
        const matchBio = person.bio.toLowerCase().includes(q);
        const matchCategory = person.category.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchBio && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [people, filters, connections]);

  const selectedPerson = useMemo(() => {
    if (!selectedPersonId) return null;
    if (myProfile && (myProfile.id === selectedPersonId || selectedPersonId === 'me')) {
      return myProfile;
    }
    return people.find(p => p.id === selectedPersonId) || null;
  }, [selectedPersonId, myProfile, people]);

  // Statistics
  const stats = useMemo(() => {
    const total = people.length;
    const connectedCount = Object.values(connections).filter(s => s === 'CONNECTED').length;
    const requestedCount = Object.values(connections).filter(s => s === 'REQUESTED').length;
    const buildersCount = people.filter(p => p.category === 'Builder').length;
    const volunteersCount = people.filter(p => p.category === 'Volunteer').length;
    const studentsCount = people.filter(p => p.category === 'Student').length;
    return {
      total,
      connectedCount,
      requestedCount,
      buildersCount,
      volunteersCount,
      studentsCount,
    };
  }, [people, connections]);

  return {
    people,
    myProfile,
    connections,
    selectedPersonId,
    selectedPerson,
    isEditModalOpen,
    filters,
    filteredPeople,
    stats,
    isCloudConnected,
    isSyncing,
    refreshProfiles: fetchSupabaseProfiles,
    authUser,
    authReady,
    accountReady: Boolean(authUser && accountReadyFor === authUser.id),
    signOut: signOutAndClear,
    setSelectedPersonId,
    setIsEditModalOpen,
    setFilters,
    saveMyProfile,
    cycleConnection,
    setConnectionStatus,
    getConnectionStatus,
  };
}

export type PeopleStoreType = ReturnType<typeof usePeopleStoreState>;

const PeopleContext = createContext<PeopleStoreType | null>(null);

export const PeopleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = usePeopleStoreState();
  return React.createElement(PeopleContext.Provider, { value: store }, children);
};

export function usePeopleStore(): PeopleStoreType {
  const context = useContext(PeopleContext);
  if (!context) {
    throw new Error('usePeopleStore must be used within a PeopleProvider');
  }
  return context;
}
