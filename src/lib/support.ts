// Where people go when they can't recover a profile themselves. Nimsara moves
// it with the SQL in docs (attach the old profile to their account).
export const SUPPORT_URL = 'https://x.com/nimsaraonline';

/** A ready-to-send message with what is needed to find both records. */
export function supportMessage(email: string, oldProfile?: string): string {
  return [
    'Hi Nimsara, please move my old Mumbai Onchain profile to my app account.',
    email ? `Email I sign in with: ${email}` : '',
    oldProfile ? `Old profile: ${oldProfile}` : 'Old profile: (name and X handle I used on the website)',
  ]
    .filter(Boolean)
    .join('\n');
}
