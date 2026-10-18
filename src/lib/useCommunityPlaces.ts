import { useCallback, useEffect, useState } from 'react';
import type { Place, PlaceCategory } from '../data/places';
import { supabase } from './supabase';
import { usePeopleStore } from './usePeopleStore';

// The map's community side: places people add (community_places) and
// Mumbai Onchain ratings for any place (place_ratings). Everything degrades
// to "nothing yet" when the tables aren't there or the network is down.

interface CommunityRow {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  area: string | null;
  tip: string | null;
  price: string | null;
  added_by_name: string | null;
  owner_id: string;
}

export interface NewPlace {
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  area?: string;
  tip?: string;
  price?: string;
}

export interface RatingSummary {
  average: number;
  total: number;
}

export interface Review {
  ownerId: string;
  name: string;
  stars: number;
  comment: string;
  updatedAt: string;
}

const toPlace = (r: CommunityRow): Place => ({
  id: r.id,
  name: r.name,
  category: r.category,
  lat: r.lat,
  lng: r.lng,
  area: r.area ?? undefined,
  tip: r.tip ?? undefined,
  price: r.price ?? undefined,
  addedBy: r.added_by_name ?? 'someone',
});

/** Places people added, plus adding one. */
export function useCommunityPlaces(enabled: boolean) {
  const { authUser, myProfile } = usePeopleStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    supabase
      .from('community_places')
      .select('id, name, category, lat, lng, area, tip, price, added_by_name, owner_id')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (live && !error && data) setPlaces((data as CommunityRow[]).map(toPlace));
      });
    return () => {
      live = false;
    };
  }, [enabled, nonce]);

  const canAdd = Boolean(authUser && myProfile);

  const addPlace = useCallback(
    async (p: NewPlace): Promise<string | null> => {
      if (!authUser || !myProfile) return 'Sign in and make your profile to add places.';
      const { error } = await supabase.from('community_places').insert({
        name: p.name.trim(),
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        area: p.area?.trim() || null,
        tip: p.tip?.trim() || null,
        price: p.price?.trim() || null,
        added_by_profile_id: myProfile.id,
        added_by_name: myProfile.name,
      });
      if (error) return 'Couldn’t add the place. Check your connection and try again.';
      setNonce((n) => n + 1);
      return null;
    },
    [authUser, myProfile]
  );

  return { places, canAdd, addPlace };
}

/** Average stars and count for every rated place. */
export function useRatingSummary(enabled: boolean) {
  const [summary, setSummary] = useState<Record<string, RatingSummary>>({});
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    supabase.rpc('place_rating_summary').then(({ data, error }) => {
      if (!live || error || !data) return;
      const next: Record<string, RatingSummary> = {};
      for (const r of data as { place_id: string; average: number; total: number }[]) next[r.place_id] = { average: Number(r.average), total: r.total };
      setSummary(next);
    });
    return () => {
      live = false;
    };
  }, [enabled, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { summary, refresh };
}

/** One place's Mumbai Onchain reviews, and rating it. */
export function usePlaceReviews(placeId: string | null) {
  const { authUser, myProfile } = usePeopleStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!placeId) return;
    let live = true;
    supabase
      .from('place_ratings')
      .select('owner_id, reviewer_name, stars, comment, updated_at')
      .eq('place_id', placeId)
      .order('updated_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!live || error || !data) return;
        setReviews(
          data.map((r) => ({ ownerId: r.owner_id, name: r.reviewer_name ?? 'Someone', stars: r.stars, comment: r.comment ?? '', updatedAt: r.updated_at }))
        );
      });
    return () => {
      live = false;
    };
  }, [placeId, nonce]);

  const mine = authUser ? reviews.find((r) => r.ownerId === authUser.id) ?? null : null;
  const canRate = Boolean(authUser && myProfile);

  const rate = useCallback(
    async (stars: number, comment: string): Promise<string | null> => {
      if (!placeId || !authUser || !myProfile) return 'Sign in and make your profile to rate places.';
      const { error } = await supabase.from('place_ratings').upsert({
        place_id: placeId,
        owner_id: authUser.id,
        reviewer_profile_id: myProfile.id,
        reviewer_name: myProfile.name,
        stars,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (error) return 'Couldn’t save your rating. Try again.';
      setNonce((n) => n + 1);
      return null;
    },
    [placeId, authUser, myProfile]
  );

  return { reviews, mine, canRate, rate };
}
