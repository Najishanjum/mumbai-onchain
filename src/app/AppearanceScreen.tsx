import { useEffect } from 'react';
import { Check, ChevronLeft, IdCard, Moon, Sun, SunMoon } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { setThemePref, useAppTheme, type ThemePref } from '../lib/useAppTheme';
import { setAppPrefs, useAppPrefs, type AccentPref, type BadgePref } from '../lib/useAppPrefs';
import { GroupedList } from './ui';
import { useBackToClose } from '../lib/useBackToClose';
import { BlankBadge, LanyardBadge, Mandala, roleColor } from './Badge';

const THEME_OPTIONS: { id: ThemePref; label: string; Icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'system', label: 'System', Icon: SunMoon },
];

const ACCENTS: { id: AccentPref; label: string }[] = [
  { id: 'role', label: 'My role' },
  { id: 'builder', label: 'Petal blue' },
  { id: 'founder', label: 'Flame orange' },
  { id: 'student', label: 'Sun yellow' },
  { id: 'volunteer', label: 'Petal purple' },
  { id: 'attendee', label: 'Sea blue' },
  { id: 'other', label: 'Gateway cream' },
];

const BADGES: { id: BadgePref; label: string; card: string[] }[] = [
  { id: 'auto', label: 'Auto', card: ['#F6F5F2', '#121419'] },
  { id: 'white', label: 'White', card: ['#F6F5F2'] },
  { id: 'black', label: 'Black', card: ['#121419'] },
];

export const THEME_LABELS: Record<ThemePref, string> = { dark: 'Dark', light: 'Light', system: 'System' };

/** A settings row with an iOS-style switch. */
function ToggleRow({ label, detail, on, onChange }: { label: string; detail: string; on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[var(--app-surface)] active:bg-[var(--app-pressed)]"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-medium">{label}</span>
        <span className="block text-[13px] text-[var(--app-muted)]">{detail}</span>
      </span>
      <span
        className={`relative w-[51px] h-[31px] rounded-full shrink-0 transition-colors ${on ? 'bg-[var(--app-primary)]' : 'bg-[var(--app-segment)]'}`}
        aria-hidden="true"
      >
        <span className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-[left] ${on ? 'left-[22px]' : 'left-[2px]'}`} />
      </span>
    </button>
  );
}

/**
 * Appearance, opened from Me: a live preview of the badge on its lanyard,
 * with the jaali and mandala behind it, and the settings below. Every change
 * applies to the whole app straight away.
 */
export function AppearanceScreen({ open, onClose, myProfile }: { open: boolean; onClose: () => void; myProfile: PersonProfile | null }) {
  const { pref: themePref } = useAppTheme(false);
  const prefs = useAppPrefs();
  useBackToClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Appearance" className="app fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)]">
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 flex items-center gap-1 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} aria-label="Back" className="app-press w-11 h-11 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <h1 className="app-title text-[20px]">Appearance</h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {/* Live preview: the real badge, scaled down, over the real background touches */}
        <section aria-label="Preview" className="relative isolate overflow-hidden mx-4 mt-4 h-[300px] rounded-3xl border border-[var(--app-line)] bg-[var(--app-bg)] [background-image:var(--app-glow)] bg-no-repeat">
          <div className="app-motif" aria-hidden="true" />
          <Mandala className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] z-[-1] pointer-events-none" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.58]">
            {myProfile ? <LanyardBadge person={myProfile} /> : <BlankBadge onCreate={onClose} />}
          </div>
          <span className="absolute left-3 bottom-3 app-label px-2 py-1 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)]">
            Preview · tap the badge to flip
          </span>
        </section>

        <div className="px-4">
          <h2 id="theme-title" className="app-label px-1 mt-6 mb-2">Theme</h2>
          <div role="radiogroup" aria-labelledby="theme-title" className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ id, label, Icon }) => {
              const on = themePref === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setThemePref(id)}
                  className={`app-press h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-[14px] font-semibold ${
                    on ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="px-1 mt-2 text-[13px] text-[var(--app-muted)]">System follows your phone’s light or dark setting.</p>

          <h2 id="accent-title" className="app-label px-1 mt-6 mb-2">App colour</h2>
          <div role="radiogroup" aria-labelledby="accent-title" className="grid grid-cols-4 gap-x-2 gap-y-3">
            {ACCENTS.map(({ id, label }) => {
              const on = prefs.accent === id;
              const swatch = id === 'role' ? roleColor(myProfile?.category ?? 'attendee') : `var(--role-${id})`;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setAppPrefs({ accent: id })}
                  className="app-press flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      on ? 'ring-2 ring-offset-2 ring-[var(--app-ink)] ring-offset-[var(--app-bg)]' : ''
                    }`}
                    style={{ background: swatch }}
                  >
                    {id === 'role' && <IdCard className="w-5 h-5 text-[#121419]" aria-hidden="true" />}
                    {on && id !== 'role' && <Check className="w-5 h-5 text-[#121419]" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className={`text-[12px] leading-tight text-center ${on ? 'font-bold' : 'text-[var(--app-muted)]'}`}>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="px-1 mt-3 text-[13px] text-[var(--app-muted)]">Your badge band always shows your real role.</p>

          <h2 id="badge-title" className="app-label px-1 mt-6 mb-2">Badge</h2>
          <div role="radiogroup" aria-labelledby="badge-title" className="grid grid-cols-3 gap-2">
            {BADGES.map(({ id, label, card }) => {
              const on = prefs.badge === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setAppPrefs({ badge: id })}
                  className={`app-press h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-[14px] font-semibold ${
                    on ? 'border-[var(--app-primary)] bg-[var(--app-primary-soft)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                  }`}
                >
                  <span className="w-5 h-7 rounded-[4px] border border-[var(--app-line)] overflow-hidden flex" aria-hidden="true">
                    {card.map((c) => (
                      <span key={c} className="flex-1" style={{ background: c }} />
                    ))}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          <p className="px-1 mt-2 text-[13px] text-[var(--app-muted)]">Auto is white in Dark and black in Light.</p>

          <h2 className="app-label px-1 mt-6 mb-2">Background</h2>
        </div>
        <GroupedList>
          <ToggleRow label="Jaali pattern" detail="The lattice at the top of each screen" on={prefs.jaali} onChange={(jaali) => setAppPrefs({ jaali })} />
          <ToggleRow label="Mandala" detail="Behind your badge on Today" on={prefs.mandala} onChange={(mandala) => setAppPrefs({ mandala })} />
        </GroupedList>
      </div>
    </div>
  );
}
