import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Snap, SnapReactionType, CreateSnapInput } from '../types/snap';
import type { PersonProfile } from '../types/person';
import { INITIAL_SNAPS } from '../data/snaps';
import { compressAndOptimizeImage, dataUrlToBlob } from './imageCompressor';
import { usePeopleStore } from './usePeopleStore';
import { supabase, isSupabaseConfigured } from './supabase';

const SNAPS_STORAGE_KEY = 'mumbai_onchain_snaps_v3';
const USER_REACTIONS_STORAGE_KEY = 'mumbai_onchain_user_reactions_v3';

export interface DbSnapRow {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  storage_path?: string | null;
  event_id?: string | null;
  event_name?: string | null;
  date?: string | null;
  caption?: string | null;
  location?: string | null;
  tagged_person_ids?: string[] | null;
  reactions?: {
    heart?: number;
    fire?: number;
    eyes?: number;
    clap?: number;
  } | null;
  visibility?: string | null;
  created_at?: string;
}

interface SnapStoreState {
  snaps: Snap[];
  recentSnaps: Snap[];
  userReactions: Record<string, string[]>; // { [snapId]: ['heart', 'fire'] }
  activeSnapForViewer: Snap | null;
  isAddSnapModalOpen: boolean;
  preselectedEventIdForSnap?: string;
  isSyncingSnaps: boolean;
  setActiveSnapForViewer: (snap: Snap | null) => void;
  setIsAddSnapModalOpen: (isOpen: boolean, defaultEventId?: string) => void;
  addSnap: (input: CreateSnapInput) => Promise<Snap>;
  deleteSnap: (snapId: string) => Promise<boolean>;
  toggleReaction: (snapId: string, reaction: SnapReactionType) => void;
  addTag: (snapId: string, personId: string) => void;
  removeTag: (snapId: string, personId: string) => void;
  getSnapsByAuthor: (authorId: string) => Snap[];
  getSnapsByEvent: (eventId: string) => Snap[];
  refreshSnaps: () => Promise<void>;
  isOwnerOfSnap: (snap: Snap) => boolean;
}

const SnapContext = createContext<SnapStoreState | null>(null);

function mapDbRowToSnap(row: DbSnapRow, peopleMap: Map<string, PersonProfile>, myProfile: PersonProfile | null): Snap {
  const author = peopleMap.get(row.user_id) || (myProfile && myProfile.id === row.user_id ? myProfile : null);

  return {
    id: row.id,
    authorId: row.user_id,
    authorName: author?.name || (row.user_id === myProfile?.id ? (myProfile?.name || 'You') : 'Community Member'),
    authorAvatar: author?.avatar || (row.user_id === myProfile?.id ? myProfile?.avatar : ''),
    authorRole: author?.category || (row.user_id === myProfile?.id ? myProfile?.category : 'Builder'),
    authorCity: author?.city || (row.user_id === myProfile?.id ? myProfile?.city : 'Mumbai'),
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url || row.image_url,
    storagePath: row.storage_path || undefined,
    eventId: row.event_id || 'devcon-8-india',
    eventName: row.event_name || 'Mumbai Onchain Week',
    date: row.date || 'Nov 2026',
    caption: row.caption || '',
    location: row.location || 'Mumbai, India',
    taggedPersonIds: Array.isArray(row.tagged_person_ids) ? row.tagged_person_ids : [],
    visibility: (row.visibility as 'public' | 'private') || 'public',
    reactions: {
      heart: row.reactions?.heart ?? 0,
      fire: row.reactions?.fire ?? 0,
      eyes: row.reactions?.eyes ?? 0,
      clap: row.reactions?.clap ?? 0,
    },
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const SnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { myProfile, people } = usePeopleStore();
  const [isSyncingSnaps, setIsSyncingSnaps] = useState<boolean>(false);

  // Map of people for rapid author lookup
  const peopleMap = useMemo(() => {
    const map = new Map<string, PersonProfile>();
    people.forEach(p => map.set(p.id, p));
    if (myProfile) map.set(myProfile.id, myProfile);
    return map;
  }, [people, myProfile]);

  const peopleMapRef = useRef(peopleMap);
  peopleMapRef.current = peopleMap;

  const myProfileRef = useRef(myProfile);
  myProfileRef.current = myProfile;

  // Initial load from LocalStorage cache or fallback to initial seed
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
      console.error('Error loading snaps from localStorage cache:', e);
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

  // Fetch Snaps from Supabase database
  const fetchSupabaseSnaps = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      setIsSyncingSnaps(true);
      const { data, error } = await supabase
        .from('snaps')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Note: Could not query Supabase snaps table yet:', error.message);
        return;
      }

      if (data && Array.isArray(data)) {
        const remoteSnaps = (data as DbSnapRow[]).map(row =>
          mapDbRowToSnap(row, peopleMapRef.current, myProfileRef.current)
        );

        setSnaps(prev => {
          const map = new Map<string, Snap>();
          // 1. Base seed
          INITIAL_SNAPS.forEach(s => map.set(s.id, s));
          // 2. Previously cached
          prev.forEach(s => map.set(s.id, s));
          // 3. Remote authoritative
          remoteSnaps.forEach(s => map.set(s.id, s));

          // Sort newest first
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
    } catch (err) {
      console.error('Error fetching Supabase snaps:', err);
    } finally {
      setIsSyncingSnaps(false);
    }
  }, []);

  // Realtime subscription for cross-device live updates
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    // Initial fetch
    fetchSupabaseSnaps();

    // Subscribe to Realtime postgres changes
    const channel = client
      .channel('realtime:community_snaps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'snaps' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as DbSnapRow;
            if (row.visibility && row.visibility !== 'public') return;
            const newSnap = mapDbRowToSnap(row, peopleMapRef.current, myProfileRef.current);
            setSnaps(prev => {
              if (prev.some(s => s.id === newSnap.id)) return prev;
              return [newSnap, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as DbSnapRow;
            const updatedSnap = mapDbRowToSnap(row, peopleMapRef.current, myProfileRef.current);
            setSnaps(prev => prev.map(s => (s.id === updatedSnap.id ? updatedSnap : s)));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setSnaps(prev => prev.filter(s => s.id !== deletedId));
              setActiveSnapForViewer(curr => (curr?.id === deletedId ? null : curr));
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchSupabaseSnaps]);

  // Keep author metadata fresh when profiles change
  useEffect(() => {
    setSnaps(prev =>
      prev.map(snap => {
        const author = peopleMap.get(snap.authorId) || (myProfile && myProfile.id === snap.authorId ? myProfile : null);
        if (author) {
          return {
            ...snap,
            authorName: author.name || snap.authorName,
            authorAvatar: author.avatar || snap.authorAvatar,
            authorRole: author.category || snap.authorRole,
            authorCity: author.city || snap.authorCity,
          };
        }
        return snap;
      })
    );
  }, [peopleMap, myProfile]);

  // Sync snaps to LocalStorage with safe quota recovery
  useEffect(() => {
    try {
      // Avoid storing massive dataUrls in localStorage if unnecessary
      const lightweightSnaps = snaps.slice(0, 30).map(s => {
        if (s.imageUrl.startsWith('data:') && s.imageUrl.length > 300000) {
          // Truncate gigantic base64 from localStorage if space constrained
          return { ...s, imageUrl: s.thumbnailUrl || s.imageUrl };
        }
        return s;
      });
      localStorage.setItem(SNAPS_STORAGE_KEY, JSON.stringify(lightweightSnaps));
    } catch (e) {
      console.warn('LocalStorage quota notice for Snaps cache:', e);
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

  // Sorted recent snaps: newest uploads first
  const recentSnaps = useMemo(() => {
    return [...snaps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [snaps]);

  // Check if current user is owner of a Snap
  const isOwnerOfSnap = useCallback((snap: Snap): boolean => {
    if (!snap) return false;
    const currentId = myProfile?.id;
    if (currentId && (snap.authorId === currentId || snap.authorId === 'me-user' || snap.authorId === 'me')) {
      return true;
    }
    if (snap.authorId === 'me' || snap.authorId === 'me-user') {
      return true;
    }
    return false;
  }, [myProfile?.id]);

  // Add a new Snap: Uploads image to Supabase Storage bucket 'snaps' and writes record to Supabase 'snaps' table
  const addSnap = useCallback(async (input: CreateSnapInput): Promise<Snap> => {
    if (!input.file && !input.imageDataUrl) {
      throw new Error('Image is required to create a Snap.');
    }

    // 1. Optimize & Compress image
    const compressed = await compressAndOptimizeImage(
      input.file || input.imageDataUrl!,
      1400,
      1400,
      0.82
    );

    const authorId = myProfile?.id || 'me-user';
    const authorName = myProfile?.name || 'You';
    const authorAvatar = myProfile?.avatar || '';
    const authorRole = myProfile?.category || 'Builder';
    const authorCity = myProfile?.city || 'Mumbai';

    const snapId = `snap-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storageFilePath = `${authorId}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;

    let finalImageUrl = compressed.dataUrl;
    let finalThumbnailUrl = compressed.thumbnailUrl;
    let uploadedStoragePath: string | undefined = undefined;

    // 2. Upload to Supabase Storage bucket 'snaps'
    if (isSupabaseConfigured() && supabase) {
      try {
        const imageBlob = dataUrlToBlob(compressed.dataUrl);
        const { error: uploadError } = await supabase.storage
          .from('snaps')
          .upload(storageFilePath, imageBlob, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Supabase Storage notice (using optimized image):', uploadError.message);
        } else {
          // Retrieve public permanent URL from Supabase Storage
          const { data: { publicUrl } } = supabase.storage
            .from('snaps')
            .getPublicUrl(storageFilePath);

          if (publicUrl) {
            finalImageUrl = publicUrl;
            uploadedStoragePath = storageFilePath;
          }
        }
      } catch (storageErr) {
        console.warn('Supabase Storage exception handled:', storageErr);
      }
    }

    // 3. Assemble Snap object
    const newSnap: Snap = {
      id: snapId,
      authorId,
      authorName,
      authorAvatar,
      authorRole,
      authorCity,
      imageUrl: finalImageUrl,
      thumbnailUrl: finalThumbnailUrl || finalImageUrl,
      storagePath: uploadedStoragePath,
      eventId: input.eventId || 'devcon-8-india',
      eventName: input.eventName || 'Mumbai Onchain Week',
      date: input.date || 'Nov 2026',
      caption: input.caption || '',
      location: input.location || 'Mumbai, India',
      taggedPersonIds: input.taggedPersonIds || [],
      visibility: 'public',
      reactions: { heart: 0, fire: 0, eyes: 0, clap: 0 },
      createdAt: new Date().toISOString(),
    };

    // 4. Create Snap record in Supabase database
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: dbError } = await supabase.from('snaps').insert([
          {
            id: newSnap.id,
            user_id: newSnap.authorId,
            image_url: newSnap.imageUrl,
            thumbnail_url: newSnap.thumbnailUrl,
            storage_path: newSnap.storagePath || null,
            event_id: newSnap.eventId,
            event_name: newSnap.eventName,
            date: newSnap.date,
            caption: newSnap.caption,
            location: newSnap.location,
            tagged_person_ids: newSnap.taggedPersonIds,
            reactions: newSnap.reactions,
            visibility: 'public',
            created_at: newSnap.createdAt,
          },
        ]);

        if (dbError) {
          console.warn('Supabase DB snaps insert notice:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('Supabase DB insert exception handled:', dbErr);
      }
    }

    // 5. Immediate UI update: display on profile & recent snaps instantly
    setSnaps(prev => [newSnap, ...prev]);
    setIsAddSnapModalOpenState(false);
    return newSnap;
  }, [myProfile]);

  // Delete a snap: Owner only. Removes from Supabase DB, Supabase Storage, and local state
  const deleteSnap = useCallback(async (snapId: string): Promise<boolean> => {
    const target = snaps.find(s => s.id === snapId);
    if (!target) return false;

    // Check ownership
    const currentId = myProfile?.id;
    const isOwner = Boolean(
      (currentId && target.authorId === currentId) ||
      target.authorId === 'me-user' ||
      target.authorId === 'me'
    );

    if (!isOwner) {
      console.warn('Unauthorized: Only the creator can delete their Snap.');
      return false;
    }

    // Remove from Supabase DB and Storage if connected
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: dbDeleteError } = await supabase
          .from('snaps')
          .delete()
          .eq('id', snapId);

        if (dbDeleteError) {
          console.warn('Supabase snap delete error:', dbDeleteError.message);
        }

        // Delete from Storage bucket if storage path is present
        if (target.storagePath) {
          const { error: storageDeleteError } = await supabase.storage
            .from('snaps')
            .remove([target.storagePath]);

          if (storageDeleteError) {
            console.warn('Supabase storage delete error:', storageDeleteError.message);
          }
        }
      } catch (err) {
        console.error('Error deleting snap from Supabase:', err);
      }
    }

    // Immediate state update: removes from profile, Recent Snaps, event snaps
    setSnaps(prev => prev.filter(s => s.id !== snapId));
    setActiveSnapForViewer(curr => (curr?.id === snapId ? null : curr));
    return true;
  }, [snaps, myProfile?.id]);

  // Toggle reaction
  const toggleReaction = useCallback((snapId: string, reaction: SnapReactionType) => {
    setUserReactions(prev => {
      const currentGiven = prev[snapId] || [];
      const hasReacted = currentGiven.includes(reaction);
      const nextGiven = hasReacted
        ? currentGiven.filter(r => r !== reaction)
        : [...currentGiven, reaction];

      setSnaps(prevSnaps => {
        return prevSnaps.map(snap => {
          if (snap.id !== snapId) return snap;
          const delta = hasReacted ? -1 : 1;
          const currentCount = snap.reactions[reaction] || 0;
          const nextReactions = {
            ...snap.reactions,
            [reaction]: Math.max(0, currentCount + delta),
          };

          // Optimistically update Supabase DB if available
          if (isSupabaseConfigured() && supabase) {
            supabase
              .from('snaps')
              .update({ reactions: nextReactions })
              .eq('id', snapId)
              .then();
          }

          return {
            ...snap,
            reactions: nextReactions,
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
      const nextTags = [...existing, personId];
      if (isSupabaseConfigured() && supabase) {
        supabase.from('snaps').update({ tagged_person_ids: nextTags }).eq('id', snapId).then();
      }
      return { ...s, taggedPersonIds: nextTags };
    }));
  }, []);

  const removeTag = useCallback((snapId: string, personId: string) => {
    setSnaps(prev => prev.map(s => {
      if (s.id !== snapId) return s;
      const nextTags = (s.taggedPersonIds || []).filter(id => id !== personId);
      if (isSupabaseConfigured() && supabase) {
        supabase.from('snaps').update({ tagged_person_ids: nextTags }).eq('id', snapId).then();
      }
      return { ...s, taggedPersonIds: nextTags };
    }));
  }, []);

  // Queries: newest Snaps first
  const getSnapsByAuthor = useCallback((authorId: string): Snap[] => {
    return snaps
      .filter(s => {
        if (s.visibility && s.visibility !== 'public') return false;
        if (authorId === 'me' || authorId === (myProfile?.id || 'me-user')) {
          return s.authorId === authorId || s.authorId === (myProfile?.id || 'me-user') || s.authorId === 'me';
        }
        return s.authorId === authorId;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [snaps, myProfile?.id]);

  const getSnapsByEvent = useCallback((eventId: string): Snap[] => {
    return snaps
      .filter(s => s.eventId === eventId && (!s.visibility || s.visibility === 'public'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [snaps]);

  const value = {
    snaps,
    recentSnaps,
    userReactions,
    activeSnapForViewer,
    isAddSnapModalOpen,
    preselectedEventIdForSnap,
    isSyncingSnaps,
    setActiveSnapForViewer,
    setIsAddSnapModalOpen,
    addSnap,
    deleteSnap,
    toggleReaction,
    addTag,
    removeTag,
    getSnapsByAuthor,
    getSnapsByEvent,
    refreshSnaps: fetchSupabaseSnaps,
    isOwnerOfSnap,
  };

  return React.createElement(SnapContext.Provider, { value }, children);
};

export function useSnapStore(): SnapStoreState {
  const context = useContext(SnapContext);
  if (!context) {
    throw new Error('useSnapStore must be used within a SnapProvider');
  }
  return context;
}
