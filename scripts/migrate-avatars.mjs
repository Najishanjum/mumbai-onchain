#!/usr/bin/env node
// One-time move of profile photos out of the database into Storage.
//
// Profiles used to keep their photo inside the row as base64 text (up to
// ~1.3 MB each), so every people-list load downloaded all of them. This
// resizes each to 400px WebP, uploads it to the `avatars` bucket and leaves
// only the URL in the row. New photos already go to Storage from the app.
//
//   npm run migrate:avatars            # dry run: shows what would change
//   npm run migrate:avatars -- --apply # does it
//
// Needs in .env.local: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// (Supabase → Project Settings → API → service_role). The key is only read
// here, never printed. Run it against each project (dev, then production).

import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
const url = get('VITE_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
const apply = process.argv.includes('--apply');

if (!url || !key) {
  console.error('Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local first.');
  process.exit(1);
}

const headers = { apikey: key, authorization: `Bearer ${key}` };

const res = await fetch(`${url}/rest/v1/profiles?select=id,name,owner_id,avatar&avatar=like.data:*`, { headers });
if (!res.ok) {
  console.error('Could not read profiles:', res.status, await res.text());
  process.exit(1);
}
const rows = await res.json();
console.log(`${rows.length} profile photo(s) stored inside the database.${apply ? '' : ' Dry run; add --apply to move them.'}`);

let moved = 0;
let before = 0;
let after = 0;
for (const row of rows) {
  const base64 = row.avatar.split(',')[1] ?? '';
  const original = Buffer.from(base64, 'base64');
  const webp = await sharp(original).rotate().resize(400, 400, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
  before += row.avatar.length;
  after += webp.length;
  // Owned profiles use the owner's folder (the same path the app writes to);
  // unclaimed imports go under legacy/ until their owner claims them.
  const path = row.owner_id ? `${row.owner_id}/avatar.webp` : `legacy/${row.id}.webp`;
  console.log(`- ${row.name}: ${(row.avatar.length / 1024).toFixed(0)} KB in the row → ${(webp.length / 1024).toFixed(0)} KB file at avatars/${path}`);
  if (!apply) continue;

  const up = await fetch(`${url}/storage/v1/object/avatars/${path}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'image/webp', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
    body: webp,
  });
  if (!up.ok) {
    console.error(`  upload failed (${up.status}): ${await up.text()}`);
    continue;
  }
  const publicUrl = `${url}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
  const patch = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { ...headers, 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify({ avatar: publicUrl }),
  });
  if (!patch.ok) {
    console.error(`  row update failed (${patch.status}): ${await patch.text()}`);
    continue;
  }
  moved++;
}

console.log(
  `\nPeople list size: ${(before / 1024 / 1024).toFixed(2)} MB of photos in rows → ${(after / 1024).toFixed(0)} KB of separate files.` +
    (apply ? ` Moved ${moved} of ${rows.length}.` : '')
);
