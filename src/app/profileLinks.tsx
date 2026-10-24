import type React from 'react';
import { Globe, Link2 } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { DiscordLogo, FacebookLogo, FarcasterLogo, GitHubLogo, InstagramLogo, LinkedInLogo, YouTubeLogo } from './BrandIcons';

// Links beyond X and Telegram: picked from this list on the profile editor,
// shown as logos on profiles. GitHub, LinkedIn, Farcaster and Website keep
// their own profile columns (older app versions read them); the rest live in
// profiles.links.

export type LinkPlatform = 'linkedin' | 'github' | 'farcaster' | 'lens' | 'instagram' | 'youtube' | 'facebook' | 'discord' | 'website';

type Column = 'linkedinUrl' | 'githubUrl' | 'farcasterHandle' | 'websiteUrl';

interface Platform {
  id: LinkPlatform;
  name: string;
  placeholder: string;
  icon: (className: string) => React.ReactNode;
  /** Where a username goes; full links are used as they are. Null: not a link (Discord names). */
  profileUrl: ((user: string) => string) | null;
  column?: Column;
}

export const PLATFORMS: Platform[] = [
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'linkedin.com/in/you', icon: (c) => <LinkedInLogo className={c} />, profileUrl: (u) => `https://www.linkedin.com/in/${u}`, column: 'linkedinUrl' },
  { id: 'github', name: 'GitHub', placeholder: 'username', icon: (c) => <GitHubLogo className={c} />, profileUrl: (u) => `https://github.com/${u}`, column: 'githubUrl' },
  { id: 'farcaster', name: 'Farcaster', placeholder: 'username', icon: (c) => <FarcasterLogo className={c} />, profileUrl: (u) => `https://farcaster.xyz/${u}`, column: 'farcasterHandle' },
  { id: 'lens', name: 'Lens', placeholder: 'username', icon: (c) => <Link2 className={c} aria-hidden="true" />, profileUrl: (u) => `https://hey.xyz/u/${u}` },
  { id: 'instagram', name: 'Instagram', placeholder: 'username', icon: (c) => <InstagramLogo className={c} />, profileUrl: (u) => `https://instagram.com/${u}` },
  { id: 'youtube', name: 'YouTube', placeholder: '@channel', icon: (c) => <YouTubeLogo className={c} />, profileUrl: (u) => `https://youtube.com/@${u}` },
  { id: 'facebook', name: 'Facebook', placeholder: 'username', icon: (c) => <FacebookLogo className={c} />, profileUrl: (u) => `https://facebook.com/${u}` },
  { id: 'discord', name: 'Discord', placeholder: 'username', icon: (c) => <DiscordLogo className={c} />, profileUrl: null },
  { id: 'website', name: 'Website', placeholder: 'yoursite.xyz', icon: (c) => <Globe className={c} aria-hidden="true" />, profileUrl: null, column: 'websiteUrl' },
];

const isUrl = (v: string) => /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+\//.test(v) || /^www\./i.test(v);
const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

/** What someone entered for a platform, from its column or profiles.links. */
export function linkValue(p: Pick<PersonProfile, Column | 'links'>, id: LinkPlatform): string {
  const platform = PLATFORMS.find((x) => x.id === id)!;
  return (platform.column ? p[platform.column] : p.links?.[id])?.trim() ?? '';
}

/** Where tapping the logo goes, or null when it isn't a link (a Discord username). */
export function linkHref(id: LinkPlatform, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (id === 'website' || isUrl(v)) return withScheme(v);
  const platform = PLATFORMS.find((x) => x.id === id)!;
  return platform.profileUrl ? platform.profileUrl(v.replace(/^@+/, '')) : null;
}

/** Splits the editor's links back into the profile columns and profiles.links. */
export function linksToProfile(values: Partial<Record<LinkPlatform, string>>): Pick<PersonProfile, Column | 'links'> {
  const out: Pick<PersonProfile, Column | 'links'> = { linkedinUrl: '', githubUrl: '', farcasterHandle: '', websiteUrl: '', links: {} };
  for (const platform of PLATFORMS) {
    let v = values[platform.id]?.trim() ?? '';
    if (!v) continue;
    if (platform.id === 'farcaster' || (!isUrl(v) && platform.id !== 'website')) v = v.replace(/^@+/, '');
    // GitHub and LinkedIn columns hold links: older app versions open them as they are.
    if ((platform.id === 'github' || platform.id === 'linkedin') && !isUrl(v)) v = platform.profileUrl!(v);
    if (platform.column) out[platform.column] = v;
    else out.links![platform.id] = v.slice(0, 200);
  }
  return out;
}
