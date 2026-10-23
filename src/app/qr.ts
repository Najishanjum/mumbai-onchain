import type { PersonProfile } from '../types/person';

// Same format the website's QR pass uses, so passes made on either one scan
// on both: <origin>/?tab=people&person=<id>. Opening it in a phone camera
// lands on that person's profile.
export function profileUrl(personId: string): string {
  return `${window.location.origin}/?tab=people&person=${encodeURIComponent(personId)}`;
}

/** Resolve scanned text (pass URL, raw ID, @handle or name) to a person. */
export function findPersonFromQr(data: string, people: PersonProfile[]): PersonProfile | null {
  const text = data.trim();
  const fromUrl = text.match(/[?&]person=([^&#]+)/);
  if (fromUrl) {
    const id = decodeURIComponent(fromUrl[1]);
    return people.find((p) => p.id === id) ?? null;
  }
  const byId = people.find((p) => p.id === text);
  if (byId) return byId;
  const h = text.replace(/^@/, '').toLowerCase();
  return (
    people.find(
      (p) =>
        p.xHandle?.replace(/^@/, '').toLowerCase() === h ||
        p.telegramHandle?.replace(/^@/, '').toLowerCase() === h ||
        p.name.toLowerCase() === h
    ) ?? null
  );
}

export function vCard(p: PersonProfile): string {
  const x = p.xHandle?.replace(/^@/, '');
  const tg = p.telegramHandle?.replace(/^@/, '');
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.name}`,
    p.headline ? `TITLE:${p.headline}` : '',
    p.city ? `ADR;TYPE=WORK:;;${p.city};;;;` : '',
    x ? `X-SOCIALPROFILE;type=twitter:https://x.com/${x}` : '',
    tg ? `X-SOCIALPROFILE;type=telegram:https://t.me/${tg}` : '',
    p.whatsapp ? `TEL;TYPE=CELL:${p.whatsapp}` : '',
    p.websiteUrl ? `URL:${p.websiteUrl}` : '',
    `NOTE:Met at Mumbai Onchain Week · ${profileUrl(p.id)}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');
}
