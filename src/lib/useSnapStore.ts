import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Snap, SnapReactionType, CreateSnapInput } from '../types/snap';
import { INITIAL_SNAPS } from '../data/snaps';
import { compressAndOptimizeImage } from './imageCompressor';
import { usePeopleStore } from './usePeopleStore';

const SNAPS_STORAGE_KEY = 'mumbai_onchain_snaps_v2';
const USER_REACTIONS_STORAGE_KEY = 'mumbai_onchain_user_reactions_v2';

interface SnapStoreState {
  snaps: Snap[];
  recentSnaps: Snap[];
  userReactions: Record<string, string[]>; // { [snapId]: ['heart', 'fire'] }
  activeSnapForViewer: Snap | null;
  isAddSnapModalOpen: boolean;
  preselectedEventIdForSnap?: string;
  setActiveSnapForViewer: (snap: Snap | null) => void;
  setIsAddSnapModalOpen: (isOpen: boolean, defaultEventId?: string) => void;
  addSnap: (input: CreateSnapInput) => Promise<Snap>;
  deleteSnap: (snapId: string) => void;
  toggleReaction: (snapId: string, reaction: SnapReactionType) => void;
  addTag: (snapId: string, personId: string) => void;
  removeTag: (snapId: string, personId: string) => void;
  getSnapsByAuthor: (authorId: string) => Snap[];
  getSnapsByEvent: (eventId: string) => Snap[];
}

const SnapContext = createContext<SnapStoreState | null>(null);

export const SnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { myProfile } = usePeopleStore();

  // Load snaps from LocalStorage or fallback to seed
  const [snaps, setSnaps] = useState<Snap[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: Snap) => s.id));
          const missing = INITIAL_SNAPS.filter(s => !existingIds.has(s.id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {
      console.error('Error loading snaps from localStorage:', e);
    }
    return INITIAL_SNAPS;
  });

  // Track which reactions current user gave: { [snapId]: ['heart', 'fire'] }
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(USER_REACTIONS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading user reactions:', e);
    }
    return {};
  });

  // Lightbox & Modal state
  const [activeSnapForViewer, setActiveSnapForViewer] = useState<Snap | null>(null);
  const [isAddSnapModalOpen, setIsAddSnapModalOpenState] = useState<boolean>(false);
  const [preselectedEventIdForSnap, setPreselectedEventIdForSnap] = useState<string | undefined>();

  const setIsAddSnapModalOpen = useCallback((isOpen: boolean, defaultEventId?: string) => {
    setPreselectedEventIdForSnap(defaultEventId);
    setIsAddSnapModalOpenState(isOpen);
  }, []);

  // Sync snaps to LocalStorage (with safe quota recovery)
  useEffect(() => {
    try {
      localStorage.setItem(SNAPS_STORAGE_KEY, JSON.stringify(snaps));
    } catch (e) {
      console.warn('LocalStorage quota warning for Snaps. Trimming older entries...', e);
      try {
        // Keep newest 30 snaps if storage is constrained
        const trimmed = snaps.slice(0, 30);
        localStorage.setItem(SNAPS_STORAGE_KEY, JSON.stringify(trimmed));
      } catch (innerErr) {
        console.error('Failed to save trimmed snaps:', innerErr);
      }
    }
  }, [snaps]);

  // Sync user reactions
  useEffect(() => {
    try {
      localStorage.setItem(USER_REACTIONS_STORAGE_KEY, JSON.stringify(userReactions));
    } catch (e) {
      console.error('Failed to save user reactions:', e);
    }
  }, [userReactions]);

  // Sorted recent snaps
  const recentSnaps = useMemo(() => {
    return [...snaps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [snaps]);

  // Add a new Snap
  const addSnap = useCallback(async (input: CreateSnapInput): Promise<Snap> => {
    let finalImageUrl = input.imageDataUrl || '';
    let finalThumbnailUrl = input.imageDataUrl || '';

    if (input.file) {
      const compressed = await compressAndOptimizeImage(input.file, 1200, 1200, 0.8);
      finalImageUrl = compressed.dataUrl;
      finalThumbnailUrl = compressed.thumbnailUrl;
    } else if (input.imageDataUrl && input.imageDataUrl.startsWith('data:')) {
      const compressed = await compressAndOptimizeImage(input.imageDataUrl, 1200, 1200, 0.8);
      finalImageUrl = compressed.dataUrl;
      finalThumbnailUrl = compressed.thumbnailUrl;
    }

    if (!finalImageUrl) {
      throw new Error('Image is required to create a Snap.');
    }

    const authorId = myProfile?.id || 'me-user';
    const authorName = myProfile?.name || 'You';
    const authorAvatar = myProfile?.avatar || '';
    const authorRole = myProfile?.category || 'Builder';
    const authorCity = myProfile?.city || 'Mumbai';

    const newSnap: Snap = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorId,
      authorName,
      authorAvatar,
      authorRole,
      authorCity,
      imageUrl: finalImageUrl,
      thumbnailUrl: finalThumbnailUrl,
      eventId: input.eventId || 'devcon-8-india',
      eventName: input.eventName || 'Mumbai Onchain Week',
      date: input.date || 'Nov 2026',
      caption: input.caption || '',
      location: input.location || 'Mumbai, India',
      taggedPersonIds: input.taggedPersonIds || [],
      reactions: { heart: 1, fire: 1, eyes: 0, clap: 0 },
      createdAt: new Date().toISOString(),
    };

    setSnaps(prev => [newSnap, ...prev]);
    setIsAddSnapModalOpenState(false);
    return newSnap;
  }, [myProfile]);

  // Delete a snap
  const deleteSnap = useCallback((snapId: string) => {
    setSnaps(prev => prev.filter(s => s.id !== snapId));
    if (activeSnapForViewer?.id === snapId) {
      setActiveSnapForViewer(null);
    }
  }, [activeSnapForViewer]);

  // Toggle lightweight reaction
  const toggleReaction = useCallback((snapId: string, reaction: SnapReactionType) => {
    setUserReactions(prev => {
      const currentGiven = prev[snapId] || [];
      const hasReacted = currentGiven.includes(reaction);
      const nextGiven = hasReacted
        ? currentGiven.filter(r => r !== reaction)
        : [...currentGiven, reaction];

      // Update reaction counts in snaps
      setSnaps(prevSnaps => {
        return prevSnaps.map(snap => {
          if (snap.id !== snapId) return snap;
          const delta = hasReacted ? -1 : 1;
          const currentCount = snap.reactions[reaction] || 0;
          return {
            ...snap,
            reactions: {
              ...snap.reactions,
              [reaction]: Math.max(0, currentCount + delta),
            },
          };
        });
      });

      return { ...prev, [snapId]: nextGiven };
    });
  }, []);

  // Tagging
  const addTag = useCallback((snapId: string, personId: string) => {
    setSnaps(prev => prev.map(s => {
      if (s.id !== snapId) return s;
      const existing = s.taggedPersonIds || [];
      if (existing.includes(personId)) return s;
      return { ...s, taggedPersonIds: [...existing, personId] };
    }));
  }, []);

  const removeTag = useCallback((snapId: string, personId: string) => {
    setSnaps(prev => prev.map(s => {
      if (s.id !== snapId) return s;
      return {
        ...s,
        taggedPersonIds: (s.taggedPersonIds || []).filter(id => id !== personId),
      };
    }));
  }, []);

  // Queries
  const getSnapsByAuthor = useCallback((authorId: string): Snap[] => {
    return snaps.filter(s => s.authorId === authorId || (authorId === 'me' && s.authorId === (myProfile?.id || 'me-user')));
  }, [snaps, myProfile]);

  const getSnapsByEvent = useCallback((eventId: string): Snap[] => {
    return snaps.filter(s => s.eventId === eventId);
  }, [snaps]);

  const value = {
    snaps,
    recentSnaps,
    userReactions,
    activeSnapForViewer,
    isAddSnapModalOpen,
    preselectedEventIdForSnap,
    setActiveSnapForViewer,
    setIsAddSnapModalOpen,
    addSnap,
    deleteSnap,
    toggleReaction,
    addTag,
    removeTag,
    getSnapsByAuthor,
    getSnapsByEvent,
  };

  return React.createElement(SnapContext.Provider, { value }, children);
};

export function useSnapStore(): SnapStoreState {
  const context = useContext(SnapContext);
  if (!context) {
    throw new Error('useSnapStore must be used within a SnapProvider');
  }
  return context;
};
