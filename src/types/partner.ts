export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityPartnerApplicationInput {
  community_name: string;
  community_logo_url: string;
  community_description: string;
  lead_name: string;
  email: string;
  phone: string;
  website_url?: string;
  x_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  telegram_url?: string;
  discord_url?: string;
  whatsapp_url?: string; // group invite, chat.whatsapp.com/…
}

export interface CommunityPartnerApplication extends CommunityPartnerApplicationInput {
  id: string;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PublicCommunityPartner {
  id: string;
  community_name: string;
  community_logo_url: string;
  community_description: string;
  website_url?: string;
  x_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  telegram_url?: string;
  discord_url?: string;
  whatsapp_url?: string;
  created_at?: string;
}

