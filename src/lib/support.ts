// Where people go when they can't recover a profile themselves. Najish moves
// it with the SQL in docs (attach the old profile to their account).
export const SUPPORT_URL = 'https://x.com/najish_anjum';

/** A ready-to-send message with what Najish needs to find both records. */
export function supportMessage(email: string, oldProfile?: string): string {
  return [
    'Hi Najish, please move my old Mumbai Onchain profile to my app account.',
    email ? `Email I sign in with: ${email}` : '',
    oldProfile ? `Old profile: ${oldProfile}` : 'Old profile: (name and X handle I used on the website)',
  ]
    .filter(Boolean)
    .join('\n');
}
