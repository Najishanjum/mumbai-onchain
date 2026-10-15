#!/usr/bin/env node
// Send a push notification to app users through the send-push Edge Function.
//
//   npm run push -- "Title" "Body text" [url] [userId,userId]
//
// Example:
//   npm run push -- "Devcon doors open" "Hall 1 is open. See you inside." "/?tab=events"
//
// Reads VITE_SUPABASE_URL and PUSH_ADMIN_SECRET from .env.local.

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();

const [title, body = '', url = '/', users] = process.argv.slice(2);
if (!title) {
  console.error('Usage: npm run push -- "Title" "Body" [url] [userId,userId]');
  process.exit(1);
}

const res = await fetch(`${get('VITE_SUPABASE_URL')}/functions/v1/send-push`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-push-secret': get('PUSH_ADMIN_SECRET'),
    // The functions gateway expects a key; the anon key is fine.
    authorization: `Bearer ${get('VITE_SUPABASE_ANON_KEY')}`,
  },
  body: JSON.stringify({ title, body, url, userIds: users ? users.split(',') : undefined }),
});
console.log(res.status, await res.text());
