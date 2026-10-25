import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { diff, proposeEdit, reviewEdit, type ContentEdit } from '../lib/contentEdits';
import type { PublicCommunityPartner } from '../types/partner';

// A partner's details: changed by an admin or the community's own lead, and
// shown on the website only after an admin approves the change.

type Details = Pick<
  PublicCommunityPartner,
  'community_name' | 'community_description' | 'website_url' | 'x_url' | 'instagram_url' | 'linkedin_url' | 'telegram_url' | 'discord_url' | 'whatsapp_url'
>;

const FIELDS: { key: keyof Details; label: string; placeholder: string }[] = [
  { key: 'community_name', label: 'Name', placeholder: 'Community name' },
  { key: 'community_description', label: 'About', placeholder: 'What the community is about' },
  { key: 'website_url', label: 'Website', placeholder: 'https://…' },
  { key: 'x_url', label: 'X', placeholder: 'https://x.com/…' },
  { key: 'telegram_url', label: 'Telegram', placeholder: 'https://t.me/…' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
  { key: 'discord_url', label: 'Discord', placeholder: 'https://discord.gg/…' },
  { key: 'whatsapp_url', label: 'WhatsApp group', placeholder: 'https://chat.whatsapp.com/…' },
];
const LABEL = Object.fromEntries(FIELDS.map((f) => [f.key, f.label])) as Record<string, string>;

const field =
  'w-full h-11 px-3.5 rounded-xl bg-[var(--app-bg)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';
const pill = 'app-press h-10 px-4 rounded-full text-[14px] font-bold disabled:opacity-50';

const withScheme = (u: string) => (!u || /^https?:\/\//i.test(u) ? u : `https://${u}`);

/** Edit a partner's details; sends the change for review. */
export function PartnerEditForm({ partner, onCancel, onSent }: { partner: Details & { id: string }; onCancel: () => void; onSent: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(partner[f.key] ?? '')])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const next = Object.fromEntries(FIELDS.map((f) => [f.key, f.key === 'community_name' || f.key === 'community_description' ? values[f.key].trim() : withScheme(values[f.key].trim())]));
    if (next.community_name.length < 2) return setError('Add the community’s name.');
    if (next.whatsapp_url && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(next.whatsapp_url.split('?')[0])) return setError('The WhatsApp link should be a group invite, like chat.whatsapp.com/AbC123…');
    const changes = diff(partner as unknown as Record<string, unknown>, next);
    if (!Object.keys(changes).length) return setError('Nothing changed yet.');
    setBusy(true);
    setError('');
    const err = await proposeEdit('partner', partner.id, changes);
    setBusy(false);
    if (err) return setError(err);
    onSent();
  }

  return (
    <form onSubmit={send} className="space-y-3">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={`pe-${partner.id}-${f.key}`} className="block text-[13px] font-bold text-[var(--app-muted)] mb-1">
            {f.label}
          </label>
          {f.key === 'community_description' ? (
            <textarea
              id={`pe-${partner.id}-${f.key}`}
              value={values[f.key]}
              rows={3}
              maxLength={500}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className={`${field} h-auto py-2.5 resize-none`}
            />
          ) : (
            <input
              id={`pe-${partner.id}-${f.key}`}
              value={values[f.key]}
              maxLength={f.key === 'community_name' ? 80 : 300}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              inputMode={f.key === 'community_name' ? 'text' : 'url'}
              autoCapitalize={f.key === 'community_name' ? 'words' : 'none'}
              autoCorrect="off"
              spellCheck={false}
              className={field}
            />
          )}
        </div>
      ))}
      {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
      <p className="text-[13px] text-[var(--app-muted)]">The app and the website keep the current details until an admin approves your change.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`${pill} bg-[var(--app-pressed)]`} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={`${pill} bg-[var(--app-primary)] text-[var(--app-on-primary)] inline-flex items-center justify-center gap-2`} disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Send for review
        </button>
      </div>
    </form>
  );
}

/** A change to a partner waiting for an admin: what it was, what it becomes. */
export function PartnerChangeCard({
  edit,
  partner,
  mine,
  onDone,
}: {
  edit: ContentEdit;
  partner: (Details & { id: string }) | undefined;
  mine: boolean;
  onDone: (approved: boolean, name: string) => void;
}) {
  const [confirming, setConfirming] = useState<null | 'approve' | 'reject'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = partner?.community_name ?? String(edit.changes.community_name ?? 'A partner');

  async function answer(approve: boolean) {
    setBusy(true);
    setError('');
    const err = await reviewEdit(edit.id, approve);
    setBusy(false);
    if (err) return setError(err);
    onDone(approve, name);
  }

  return (
    <li className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-primary)]/40 p-4">
      <div className="flex items-center gap-2">
        <Pencil className="w-4 h-4 text-[var(--app-primary)]" aria-hidden="true" />
        <h3 className="flex-1 min-w-0 text-[16px] font-extrabold truncate">{name}</h3>
      </div>
      <p className="mt-0.5 text-[13px] text-[var(--app-muted)]">Change by {mine ? 'you' : edit.proposerName}</p>
      <ul className="mt-3 space-y-2">
        {Object.entries(edit.changes).map(([k, v]) => (
          <li key={k} className="text-[14px] leading-snug break-words">
            <span className="block text-[12px] font-bold text-[var(--app-muted)]">{LABEL[k] ?? k}</span>
            {partner && <span className="text-[var(--app-muted)] line-through">{String(partner[k as keyof Details] ?? '') || '(empty)'}</span>}
            {partner && ' → '}
            <b>{String(v) || '(empty)'}</b>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-[14px] text-[var(--app-live)]">{error}</p>}
      <div className="mt-4 pt-3 border-t border-[var(--app-line)]">
        {confirming ? (
          <div className="space-y-2">
            <p className="text-[14px]">{confirming === 'approve' ? `Apply this to ${name} in the app and on the website?` : 'Drop this change? The details stay as they are.'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`${pill} bg-[var(--app-pressed)]`} onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${pill} ${confirming === 'approve' ? 'bg-[#3CC48C] text-[#06130D]' : 'bg-[var(--app-live)] text-white'}`}
                disabled={busy}
                onClick={() => answer(confirming === 'approve')}
              >
                {confirming === 'approve' ? 'Yes, apply' : 'Yes, drop'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${pill} bg-[var(--app-pressed)]`} onClick={() => setConfirming('reject')}>
              Reject
            </button>
            <button type="button" className={`${pill} bg-[#3CC48C] text-[#06130D]`} onClick={() => setConfirming('approve')}>
              Approve
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
