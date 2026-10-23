import React, { useMemo, useRef, useState } from 'react';
import { Camera, Check, Loader2, Plus, X } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonCategory, PersonProfile } from '../types/person';
import { compressAndOptimizeImage } from '../lib/imageCompressor';
import { useSavedEvents } from '../lib/useSavedEvents';
import { PersonAvatar } from '../components/PersonAvatar';
import { Sheet } from './ui';
import { dayLabel, sortByStart } from './time';

interface ProfileEditorSheetProps {
  isOpen: boolean;
  currentProfile: PersonProfile | null;
  events: EventItem[];
  onClose: () => void;
  onSave: (profile: Partial<PersonProfile>) => void;
}

const ROLES: PersonCategory[] = ['Builder', 'Founder', 'Volunteer', 'Student', 'Attendee', 'Other'];
const CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Singapore', 'Dubai'];
const SKILLS = ['Solidity', 'Rust', 'TypeScript', 'React', 'Go', 'Python', 'ZK', 'Foundry', 'Design', 'Product', 'Growth', 'Research'];
const INTERESTS = ['Ethereum', 'DeFi', 'Layer 2', 'Privacy', 'AI Agents', 'DevTools', 'Identity', 'DAOs', 'Payments', 'Gaming', 'Public goods'];

const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const cleanHandle = (s: string) => s.trim().replace(/^@+/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');

type Draft = {
  name: string;
  category: PersonCategory;
  city: string;
  headline: string;
  avatar: string;
  xHandle: string;
  telegramHandle: string;
  githubUrl: string;
  linkedinUrl: string;
  farcasterHandle: string;
  websiteUrl: string;
  whatsapp: string;
  currentlyBuilding: string;
  lookingFor: string;
  bio: string;
  skills: string[];
  interests: string[];
  attendingEvents: string[];
};

function toDraft(p: PersonProfile | null): Draft {
  return {
    name: p?.name ?? '',
    category: p?.category ?? 'Builder',
    city: p?.city ?? 'Mumbai',
    headline: p?.headline ?? '',
    avatar: p?.avatar ?? '',
    xHandle: p?.xHandle ?? '',
    telegramHandle: p?.telegramHandle ?? '',
    githubUrl: p?.githubUrl ?? '',
    linkedinUrl: p?.linkedinUrl ?? '',
    farcasterHandle: p?.farcasterHandle ?? '',
    websiteUrl: p?.websiteUrl ?? '',
    whatsapp: p?.whatsapp ?? '',
    currentlyBuilding: p?.currentlyBuilding ?? '',
    lookingFor: p?.lookingFor ?? '',
    bio: p?.bio ?? '',
    // New profiles start empty: pre-filled skills made every match look alike.
    skills: p?.skills ?? [],
    interests: p?.interests ?? [],
    attendingEvents: p?.attendingEvents ?? [],
  };
}

const label = 'block app-label mb-1.5';
const input =
  'w-full h-12 px-4 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';
const textarea =
  'w-full px-4 py-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] leading-relaxed outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)] resize-none';

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="app-title text-[20px] font-bold">{title}</h3>
      {hint && <p className="mt-0.5 text-[14px] text-[var(--app-muted)]">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ToggleChips({
  options,
  selected,
  onToggle,
  onAdd,
  addLabel,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onAdd: (v: string) => void;
  addLabel: string;
}) {
  const [custom, setCustom] = useState('');
  // Show the user's own custom values alongside the suggestions.
  const all = [...options, ...selected.filter((s) => !options.includes(s))];
  const add = () => {
    const v = custom.trim();
    if (v) onAdd(v);
    setCustom('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={on}
              className={`app-press h-9 px-3.5 rounded-full text-[14px] font-medium inline-flex items-center gap-1 border ${
                on ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
              }`}
            >
              {on && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              {o}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={addLabel}
          aria-label={addLabel}
          maxLength={30}
          className={`${input} h-10 flex-1`}
        />
        <button
          type="button"
          onClick={add}
          disabled={!custom.trim()}
          aria-label="Add"
          className="app-press w-10 h-10 rounded-xl bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function EditorForm({ currentProfile, events, onClose, onSave }: Omit<ProfileEditorSheetProps, 'isOpen'>) {
  const initial = useMemo(() => toDraft(currentProfile), [currentProfile]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { savedIds } = useSavedEvents();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleIn = (key: 'skills' | 'interests' | 'attendingEvents', v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));
  const addTo = (key: 'skills' | 'interests', v: string) =>
    setDraft((d) => (d[key].some((x) => x.toLowerCase() === v.toLowerCase()) ? d : { ...d, [key]: [...d[key], v] }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const xClean = cleanHandle(draft.xHandle);
  const waClean = draft.whatsapp.replace(/[\s()-]/g, '');
  const errors = {
    name: !draft.name.trim() ? 'Add your name so people know who they met.' : null,
    xHandle: xClean && !X_HANDLE.test(xClean) ? 'X handles are up to 15 letters, numbers or underscores.' : null,
    whatsapp: waClean && !/^\+?\d{8,15}$/.test(waClean) ? 'Use your full number with country code, like +91 98765 43210.' : null,
  };
  const hasErrors = Boolean(errors.name || errors.xHandle || errors.whatsapp);

  async function choosePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('That file isn’t an image. Pick a photo instead.');
      return;
    }
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      // ~400px is sharp on a pass and keeps the profile small (it's stored inline
      // until photos move to Storage in phase 3).
      const { dataUrl } = await compressAndOptimizeImage(file, 400, 400, 0.82);
      set('avatar', dataUrl);
    } catch {
      setPhotoError('Couldn’t read that photo. Try another one.');
    } finally {
      setPhotoBusy(false);
    }
  }

  function save() {
    setTriedSave(true);
    if (hasErrors) return;
    const t = (s: string) => s.trim();
    onSave({
      ...draft,
      name: t(draft.name),
      city: t(draft.city) || 'Mumbai',
      headline: t(draft.headline),
      xHandle: xClean,
      telegramHandle: cleanHandle(draft.telegramHandle),
      farcasterHandle: cleanHandle(draft.farcasterHandle),
      githubUrl: t(draft.githubUrl),
      linkedinUrl: t(draft.linkedinUrl),
      websiteUrl: t(draft.websiteUrl),
      whatsapp: waClean,
      currentlyBuilding: t(draft.currentlyBuilding),
      lookingFor: t(draft.lookingFor),
      bio: t(draft.bio),
    });
  }

  const sortedEvents = useMemo(() => [...events].sort(sortByStart), [events]);
  // The big three plus anything already picked or saved; the rest behind "Show all".
  const featured = sortedEvents.filter(
    (e) => e.priority !== 'NORMAL' || draft.attendingEvents.includes(e.id) || savedIds.includes(e.id)
  );
  const eventList = showAllEvents ? sortedEvents : featured;
  const unsavedPlan = savedIds.filter((id) => !draft.attendingEvents.includes(id));

  return (
    <Sheet open onClose={onClose} label={currentProfile ? 'Edit profile' : 'Create your pass'} hideClose dismissible={!dirty}>
      {/* Header */}
      <div className="sticky top-0 z-30 -mt-[22px] pt-3 pb-3 px-4 bg-[var(--app-bg)]/95 backdrop-blur-md flex items-center gap-2 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} className="h-10 px-2 text-[16px] text-[var(--app-primary)]">
          Cancel
        </button>
        <h2 className="flex-1 text-center text-[17px] font-semibold">{currentProfile ? 'Edit profile' : 'Create your pass'}</h2>
        <button
          type="button"
          onClick={save}
          disabled={!dirty && Boolean(currentProfile)}
          className="app-press h-9 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold disabled:opacity-35"
        >
          {currentProfile ? 'Save' : 'Create'}
        </button>
      </div>

      <div className="px-5 pb-6">
        {/* Photo */}
        <div className="mt-6 flex flex-col items-center">
          <div className="relative">
            <PersonAvatar
              name={draft.name || '?'}
              avatarUrl={draft.avatar}
              size="xl"
              className="rounded-full! border-0! w-28! h-28!"
            />
            {photoBusy && (
              <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[var(--app-on-primary)] animate-spin" aria-label="Processing photo" />
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="app-press h-9 px-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[14px] font-semibold inline-flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" aria-hidden="true" /> {draft.avatar ? 'Change photo' : 'Choose photo'}
            </button>
            {xClean && X_HANDLE.test(xClean) && (
              <button
                type="button"
                onClick={() => set('avatar', `https://unavatar.io/x/${encodeURIComponent(xClean)}`)}
                className="app-press h-9 px-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[14px] font-semibold"
              >
                Use my X photo
              </button>
            )}
            {draft.avatar && (
              <button
                type="button"
                onClick={() => set('avatar', '')}
                aria-label="Remove photo"
                className="app-press w-9 h-9 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {photoError && <p className="mt-2 text-[14px] text-[var(--app-live)]">{photoError}</p>}
        </div>

        <Group title="About you">
          <div>
            <label htmlFor="pe-name" className={label}>
              Name
            </label>
            <input
              id="pe-name"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="What people call you"
              autoComplete="name"
              maxLength={60}
              aria-invalid={Boolean(triedSave && errors.name)}
              className={input}
            />
            {triedSave && errors.name && <p className="mt-1.5 text-[14px] text-[var(--app-live)]">{errors.name}</p>}
          </div>

          <div>
            <span className={label}>I'm here as a</span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('category', r)}
                  aria-pressed={draft.category === r}
                  className={`app-press h-9 px-3.5 rounded-full text-[14px] font-medium border ${
                    draft.category === r
                      ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]'
                      : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="pe-headline" className={label}>
              Headline
            </label>
            <input
              id="pe-headline"
              value={draft.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder="e.g. Smart contract dev at Polygon"
              maxLength={80}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="pe-city" className={label}>
              Based in
            </label>
            <input
              id="pe-city"
              value={draft.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              maxLength={40}
              className={input}
            />
            <div className="mt-2 app-scroll-x flex gap-1.5 overflow-x-auto">
              {CITIES.filter((c) => c !== draft.city).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('city', c)}
                  className="app-press shrink-0 h-8 px-3 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[13px]"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Where to find you" hint="Shown on your pass so people can follow up after you meet.">
          <div>
            <label htmlFor="pe-x" className={label}>
              X
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[var(--app-muted)]">@</span>
              <input
                id="pe-x"
                value={draft.xHandle.replace(/^@+/, '')}
                onChange={(e) => set('xHandle', e.target.value)}
                placeholder="handle"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.xHandle)}
                className={`${input} pl-9`}
              />
            </div>
            {errors.xHandle && <p className="mt-1.5 text-[14px] text-[var(--app-live)]">{errors.xHandle}</p>}
          </div>
          <div>
            <label htmlFor="pe-tg" className={label}>
              Telegram
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[var(--app-muted)]">@</span>
              <input
                id="pe-tg"
                value={draft.telegramHandle.replace(/^@+/, '')}
                onChange={(e) => set('telegramHandle', e.target.value)}
                placeholder="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`${input} pl-9`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pe-wa" className={label}>
              WhatsApp
            </label>
            <input
              id="pe-wa"
              type="tel"
              value={draft.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
              autoComplete="tel"
              className={input}
            />
            {errors.whatsapp ? (
              <p className="mt-1.5 text-[14px] text-[var(--app-live)]">{errors.whatsapp}</p>
            ) : (
              <p className="mt-1.5 text-[14px] text-[var(--app-muted)]">Optional. Anyone who opens your profile can see it.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(
              [
                ['githubUrl', 'GitHub', 'github.com/you'],
                ['linkedinUrl', 'LinkedIn', 'linkedin.com/in/you'],
                ['farcasterHandle', 'Farcaster', 'username'],
                ['websiteUrl', 'Website', 'yoursite.xyz'],
              ] as const
            ).map(([key, name, ph]) => (
              <div key={key}>
                <label htmlFor={`pe-${key}`} className={label}>
                  {name}
                </label>
                <input
                  id={`pe-${key}`}
                  value={draft[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  inputMode={key === 'farcasterHandle' ? 'text' : 'url'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={input}
                />
              </div>
            ))}
          </div>
        </Group>

        <Group title="What you're into" hint="Used to suggest who you should meet.">
          <div>
            <span className={label}>Skills</span>
            <ToggleChips
              options={SKILLS}
              selected={draft.skills}
              onToggle={(v) => toggleIn('skills', v)}
              onAdd={(v) => addTo('skills', v)}
              addLabel="Add a skill"
            />
          </div>
          <div>
            <span className={label}>Interests</span>
            <ToggleChips
              options={INTERESTS}
              selected={draft.interests}
              onToggle={(v) => toggleIn('interests', v)}
              onAdd={(v) => addTo('interests', v)}
              addLabel="Add an interest"
            />
          </div>
          <div>
            <label htmlFor="pe-building" className={label}>
              Building
            </label>
            <textarea
              id="pe-building"
              rows={2}
              value={draft.currentlyBuilding}
              onChange={(e) => set('currentlyBuilding', e.target.value)}
              placeholder="What you're working on right now"
              maxLength={160}
              className={textarea}
            />
          </div>
          <div>
            <label htmlFor="pe-looking" className={label}>
              Looking for
            </label>
            <textarea
              id="pe-looking"
              rows={2}
              value={draft.lookingFor}
              onChange={(e) => set('lookingFor', e.target.value)}
              placeholder="e.g. a co-founder, ETHGlobal teammates, investors"
              maxLength={160}
              className={textarea}
            />
          </div>
          <div>
            <label htmlFor="pe-bio" className={label}>
              Bio
            </label>
            <textarea
              id="pe-bio"
              rows={3}
              value={draft.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="A line or two about you"
              maxLength={280}
              className={textarea}
            />
          </div>
        </Group>

        <Group title="Where you'll be" hint="People going to the same events see you there.">
          {unsavedPlan.length > 0 && (
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, attendingEvents: [...d.attendingEvents, ...unsavedPlan] }))}
              className="app-press w-full h-11 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[15px] font-semibold"
            >
              Add my {unsavedPlan.length} saved event{unsavedPlan.length === 1 ? '' : 's'}
            </button>
          )}
          <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
            {eventList.map((e) => {
              const on = draft.attendingEvents.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleIn('attendingEvents', e.id)}
                  aria-pressed={on}
                  className="app-press w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[var(--app-pressed)]"
                >
                  <span
                    className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      on ? 'bg-[var(--app-primary)] border-[var(--app-primary)] text-[var(--app-on-primary)]' : 'border-[var(--app-line)]'
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug">{e.title}</span>
                    <span className="block text-[13px] text-[var(--app-muted)]">{dayLabel(e.startDate)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {!showAllEvents && featured.length < sortedEvents.length && (
            <button
              type="button"
              onClick={() => setShowAllEvents(true)}
              className="w-full h-10 text-[15px] font-medium text-[var(--app-primary)]"
            >
              Show all {sortedEvents.length} events
            </button>
          )}
        </Group>

        <p className="mt-8 text-center text-[13px] text-[var(--app-muted)]">
          Your profile is public to everyone using Mumbai Onchain.
        </p>
      </div>
    </Sheet>
  );
}

export const ProfileEditorSheet: React.FC<ProfileEditorSheetProps> = ({ isOpen, ...rest }) =>
  // Mounting fresh on every open resets the form to the saved profile.
  isOpen ? <EditorForm {...rest} /> : null;
