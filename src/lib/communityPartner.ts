import { supabase, isSupabaseConfigured } from './supabase';
import { compressAndOptimizeImage, dataUrlToBlob } from './imageCompressor';
import type { CommunityPartnerApplicationInput, PublicCommunityPartner } from '../types/partner';

export interface UploadLogoResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface SubmitApplicationResult {
  success: boolean;
  error?: string;
}

/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validates phone / WhatsApp number with country code.
 * Accepts formats like +91 9876543210, +1 (555) 234-5678, +447123456789.
 */
export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  // Must start with + and contain at least 7 digits
  if (!trimmed.startsWith('+')) return false;
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Validates or cleans a URL.
 */
export function isValidUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Formats a user-entered link or handle to a full URL.
 */
export function formatSocialUrl(value: string, platform: 'website' | 'x' | 'instagram' | 'linkedin' | 'telegram' | 'discord'): string {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Handle handles with @
  const cleanHandle = raw.replace(/^@/, '');

  switch (platform) {
    case 'x':
      return `https://x.com/${cleanHandle}`;
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'linkedin':
      return raw.includes('linkedin.com') ? `https://${raw}` : `https://linkedin.com/in/${cleanHandle}`;
    case 'telegram':
      return raw.includes('t.me') ? `https://${raw}` : `https://t.me/${cleanHandle}`;
    case 'discord':
      return raw.includes('discord.gg') || raw.includes('discord.com') ? `https://${raw}` : `https://discord.gg/${cleanHandle}`;
    case 'website':
    default:
      return `https://${raw}`;
  }
}

/**
 * Uploads a community logo to the Supabase Storage bucket `community-logos`.
 * Compresses standard bitmap images to optimized WebP format for fast loading and low bandwidth.
 */
export async function uploadCommunityLogo(file: File): Promise<UploadLogoResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Please check your environment variables.',
    };
  }

  // 1. Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|svg|gif)$/i)) {
    return {
      success: false,
      error: 'Please upload a valid image file (PNG, JPG, WebP, SVG, or GIF).',
    };
  }

  // 2. Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image file size exceeds the 5MB limit. Please upload a smaller file.',
    };
  }

  try {
    let uploadBlob: Blob;
    let fileExt = 'webp';

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      uploadBlob = file;
      fileExt = 'svg';
    } else {
      // Compress and optimize to 500x500 WebP
      const { dataUrl } = await compressAndOptimizeImage(file, 500, 500, 0.9);
      uploadBlob = dataUrlToBlob(dataUrl);
      fileExt = 'webp';
    }

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 20);
    const filePath = `${Date.now()}_${sanitizedName}_${randomSuffix}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('community-logos')
      .upload(filePath, uploadBlob, {
        contentType: uploadBlob.type || 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });

    if (uploadError) {
      if (uploadError.message.includes('Bucket not found') || (uploadError as any).statusCode === '404') {
        return {
          success: false,
          error:
            'Storage bucket "community-logos" not found. Please run the database migration in Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        error: `Logo upload failed: ${uploadError.message}`,
      };
    }

    const { data: publicData } = supabase.storage
      .from('community-logos')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while uploading the logo.',
    };
  }
}

/**
 * Submits a community partner application to Supabase.
 * Enforces `status = 'pending'` on creation.
 */
export async function submitCommunityPartnerApplication(
  input: CommunityPartnerApplicationInput
): Promise<SubmitApplicationResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Please check your environment variables.',
    };
  }

  try {
    const payload = {
      community_name: input.community_name.trim(),
      community_logo_url: input.community_logo_url.trim(),
      community_description: input.community_description.trim(),
      lead_name: input.lead_name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      website_url: input.website_url?.trim() || '',
      x_url: input.x_url?.trim() || '',
      instagram_url: input.instagram_url?.trim() || '',
      linkedin_url: input.linkedin_url?.trim() || '',
      telegram_url: input.telegram_url?.trim() || '',
      discord_url: input.discord_url?.trim() || '',
      status: 'pending',
    };

    const { error } = await supabase
      .from('community_partner_applications')
      .insert([payload]);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        return {
          success: false,
          error:
            'The "community_partner_applications" table was not found in Supabase. Please execute the migration SQL (supabase/migrations/20261019000000_community_partner_applications.sql) in your Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        error: `Submission failed: ${error.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while submitting your application.',
    };
  }
}

/**
 * Initial launch partner cohorts displayed when no approved applications exist yet.
 */
export const DEFAULT_COMMUNITY_PARTNERS: PublicCommunityPartner[] = [
  {
    id: 'partner-web3bharat',
    community_name: 'Web3 Bharat',
    community_logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    community_description: 'A grassroots community fostering Web3 builders, developers, and researchers across India through hackathons and workshops.',
    website_url: 'https://web3bharat.xyz',
    x_url: 'https://x.com/Web3Bharat',
    telegram_url: 'https://t.me/web3bharat',
  },
  {
    id: 'partner-superteam-india',
    community_name: 'Superteam India',
    community_logo_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=200&q=80',
    community_description: 'The premier community of founders, developers, and creatives building open-source tech and crypto products in India.',
    website_url: 'https://superteam.fun',
    x_url: 'https://x.com/SuperteamIN',
    discord_url: 'https://discord.gg/superteam',
  },
  {
    id: 'partner-ethmumbai',
    community_name: 'Ethereum Mumbai',
    community_logo_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=200&q=80',
    community_description: 'Mumbai’s local Ethereum community organizing developer meetups, core protocol discussions, and builder demo days.',
    website_url: 'https://ethereum.org',
    x_url: 'https://x.com/Mumbai_onchain',
    telegram_url: 'https://t.me/+Yi25K6W8KMo0MDZl',
  },
];

/**
 * Fetches approved community partners from Supabase.
 * Returns default ecosystem partners if none are approved yet.
 */
export async function fetchApprovedCommunityPartners(): Promise<PublicCommunityPartner[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_COMMUNITY_PARTNERS;
  }

  try {
    const { data, error } = await supabase
      .from('community_partner_applications')
      .select('id, community_name, community_logo_url, community_description, website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_COMMUNITY_PARTNERS;
    }

    return data as PublicCommunityPartner[];
  } catch {
    return DEFAULT_COMMUNITY_PARTNERS;
  }
}

