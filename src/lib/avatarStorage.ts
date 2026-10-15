import type { SupabaseClient } from '@supabase/supabase-js';
import { compressAndOptimizeImage, dataUrlToBlob } from './imageCompressor';

// Profile photos live in the `avatars` Storage bucket, one file per person at
// <user id>/avatar.webp, and the profile row keeps only its URL. Photos used to
// be saved inside the row as base64 text (often 0.5–1.3 MB each), so every
// load of the people list downloaded all of them.

const SIZE = 400;

/**
 * If `avatar` is an embedded photo (data: URL), shrink it, upload it and
 * return its public URL. Anything else (already a URL, or empty) comes back
 * unchanged. On a failed upload the embedded photo is returned so nothing is
 * lost; the next save tries again.
 */
export async function storeAvatar(client: SupabaseClient, uid: string, avatar: string | undefined | null): Promise<string> {
  const value = avatar ?? '';
  if (!value.startsWith('data:')) return value;
  try {
    const { dataUrl } = await compressAndOptimizeImage(value, SIZE, SIZE, 0.85);
    const blob = dataUrlToBlob(dataUrl);
    const path = `${uid}/avatar.webp`;
    const { error } = await client.storage.from('avatars').upload(path, blob, {
      contentType: blob.type || 'image/webp',
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) return value;
    const { data } = client.storage.from('avatars').getPublicUrl(path);
    // Same path on every change, so a version keeps phones from showing the old photo.
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch {
    return value;
  }
}
