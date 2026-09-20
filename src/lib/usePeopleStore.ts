import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PersonProfile, ConnectionStatus, PeopleFilterState } from '../types/person';
import { INITIAL_PEOPLE } from '../data/people';

const PEOPLE_STORAGE_KEY = 'mumbai_onchain_people_profiles_v2';
const MY_PROFILE_STORAGE_KEY = 'mumbai_onchain_my_profile_v2';
const CONNECTIONS_STORAGE_KEY = 'mumbai_onchain_connections_v2';

export function usePeopleStore() {
  // Load Community directory from LocalStorage
  const [people, setPeople] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem(PEOPLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
    // Provide 2 realistic pre-connected contacts if brand new
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

  // Save people list to LocalStorage
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

  // Ensure current user's profile is synchronized in the community directory
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

  // Save or Update My Profile
  const saveMyProfile = useCallback((profileData: Partial<PersonProfile>) => {
    const id = myProfile?.id || `user-profile-${Date.now()}`;
    const newProfile: PersonProfile = {
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

    setMyProfile(newProfile);
    setIsEditModalOpen(false);
  }, [myProfile]);

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
      // Don't filter out if user matches
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
    setSelectedPersonId,
    setIsEditModalOpen,
    setFilters,
    saveMyProfile,
    cycleConnection,
    setConnectionStatus,
    getConnectionStatus,
  };
}
