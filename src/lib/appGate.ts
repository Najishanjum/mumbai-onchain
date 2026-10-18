import { isAppMode } from './pwa';

// The website is the public window: events, schedule, venues and a taste of
// the community. The network itself (profiles, connecting, snaps, scanning
// passes) lives in the installed app. On the website these actions ask the
// visitor to install instead; App.tsx listens and opens the install sheet.

export type AppOnlyAction = 'profile' | 'connect' | 'snap' | 'react' | 'reply' | 'scan' | 'snaps';

export const NEED_APP_EVENT = 'mo:need-app';

/** Number of snaps the website shows; the rest are in the app. */
export const WEBSITE_SNAP_LIMIT = 5;

/** True in the installed app. On the website, asks for the install and returns false. */
export function requireApp(action: AppOnlyAction): boolean {
  if (isAppMode()) return true;
  window.dispatchEvent(new CustomEvent<AppOnlyAction>(NEED_APP_EVENT, { detail: action }));
  return false;
}

export const NEED_APP_COPY: Record<AppOnlyAction, { title: string; body: string }> = {
  profile: { title: 'Make your pass in the app', body: 'Profiles and passes live in the Mumbai Onchain app, so only people at the events can see them.' },
  connect: { title: 'Connect in the app', body: 'Connecting with people happens in the Mumbai Onchain app, where your network stays private.' },
  snap: { title: 'Post snaps from the app', body: 'Snaps are shared inside the Mumbai Onchain app, with the people at the events.' },
  react: { title: 'React in the app', body: 'Reactions and the full snap feed are in the Mumbai Onchain app.' },
  reply: { title: 'Reply in the app', body: 'Replies to stories are sent in the Mumbai Onchain app, privately to the person who posted it.' },
  scan: { title: 'Scan passes in the app', body: 'Scan someone’s pass with the Mumbai Onchain app to add them to your network.' },
  snaps: { title: 'See every snap in the app', body: 'The website shows a few top snaps. The full feed is in the Mumbai Onchain app.' },
};
