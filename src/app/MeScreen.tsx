import React from 'react';
import { QrCode, ScanLine, Camera, Pencil, Share2, Bookmark, UserPlus, Send, Moon, Sun, SunMoon } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { setThemePref, useAppTheme, type ThemePref } from '../lib/useAppTheme';
import { GroupedList, RowLink } from './ui';

const THEME_OPTIONS: { id: ThemePref; label: string; Icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'system', label: 'System', Icon: SunMoon },
];

interface MeScreenProps {
  myProfile: PersonProfile | null;
  savedCount: number;
  onEditProfile: () => void;
  onShowPass: () => void;
  onScan: () => void;
  onAddSnap: () => void;
  onOpenPlan: () => void;
}

async function shareApp() {
  const data = {
    title: 'Mumbai Onchain',
    text: 'Devcon 8, IBW, ETHGlobal Mumbai and every side event, in one app.',
    url: window.location.origin,
  };
  try {
    if (navigator.share) await navigator.share(data);
    else await navigator.clipboard.writeText(data.url);
  } catch {
    // user closed the share sheet
  }
}

export const MeScreen: React.FC<MeScreenProps> = ({
  myProfile,
  savedCount,
  onEditProfile,
  onShowPass,
  onScan,
  onAddSnap,
  onOpenPlan,
}) => {
  const icon = 'w-[18px] h-[18px]';
  // App already applies the theme; this only reads the current choice.
  const { pref: themePref } = useAppTheme(false);
  return (
    <div className="pb-6">
      <header className="px-5 pt-3 pb-4">
        <h1 className="app-title text-[30px] font-bold">Me</h1>
      </header>

      {myProfile ? (
        <section className="mx-4 mb-6 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-5">
          <div className="flex items-center gap-4">
            <PersonAvatar
              name={myProfile.name}
              avatarUrl={myProfile.avatar}
              size="xl"
              className="rounded-full! border-0! w-20! h-20!"
            />
            <div className="min-w-0 flex-1">
              <h2 className="app-title text-[22px] font-bold leading-tight truncate">{myProfile.name}</h2>
              <p className="text-[15px] text-[var(--app-muted)]">
                {myProfile.category}
                {myProfile.city ? ` · ${myProfile.city}` : ''}
              </p>
              {myProfile.xHandle && (
                <p className="text-[15px] text-[var(--app-saved)] truncate">@{myProfile.xHandle.replace(/^@/, '')}</p>
              )}
            </div>
          </div>
          {myProfile.bio && <p className="mt-4 text-[15px] leading-relaxed line-clamp-3">{myProfile.bio}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onShowPass}
              className="app-press h-11 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" aria-hidden="true" /> My pass
            </button>
            <button
              type="button"
              onClick={onEditProfile}
              className="app-press h-11 rounded-full bg-[var(--app-bg)] text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" /> Edit
            </button>
          </div>
        </section>
      ) : (
        <section className="mx-4 mb-6 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-6 text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-[var(--app-saved-soft)] flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-[var(--app-saved)]" aria-hidden="true" />
          </span>
          <h2 className="app-title mt-3 text-[22px] font-bold">Make your pass</h2>
          <p className="mt-1 text-[15px] text-[var(--app-muted)] max-w-[30ch] mx-auto">
            A profile with a QR code. Show it when you meet someone and they can add you in one scan.
          </p>
          <button
            type="button"
            onClick={onEditProfile}
            className="app-press mt-4 h-11 px-6 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold"
          >
            Create profile
          </button>
        </section>
      )}

      <div className="space-y-6">
        <GroupedList>
          <RowLink icon={<Bookmark className={icon} />} label="My plan" detail={String(savedCount)} onClick={onOpenPlan} />
          <RowLink icon={<ScanLine className={icon} />} label="Scan someone's pass" onClick={onScan} />
          <RowLink icon={<Camera className={icon} />} label="Add a snap" onClick={onAddSnap} />
        </GroupedList>

        <section aria-labelledby="appearance-title" className="mx-4">
          <h2 id="appearance-title" className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
            Appearance
          </h2>
          <div role="radiogroup" aria-labelledby="appearance-title" className="grid grid-cols-3 gap-2">
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
                    on
                      ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)] border-[var(--app-primary)]'
                      : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="px-1 mt-2 text-[13px] text-[var(--app-muted)]">System follows your phone’s light or dark setting.</p>
        </section>

        <GroupedList>
          <RowLink icon={<Share2 className={icon} />} label="Share the app" onClick={shareApp} />
          <RowLink
            icon={<span className="text-[15px] font-bold leading-none" aria-hidden="true">𝕏</span>}
            label="Follow on X"
            detail="@Mumbai_onchain"
            onClick={() => window.open('https://x.com/Mumbai_onchain', '_blank', 'noopener,noreferrer')}
          />
          <RowLink
            icon={<Send className={`${icon} text-[#0088CC]`} />}
            label="Join the Telegram"
            onClick={() => window.open('https://t.me/+Yi25K6W8KMo0MDZl', '_blank', 'noopener,noreferrer')}
          />
        </GroupedList>
      </div>

      <footer className="mt-8 px-5 text-center text-[13px] text-[var(--app-muted)] space-y-1">
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 mx-auto rounded-xl" />
        <p className="font-semibold text-[var(--app-ink)]">Mumbai Onchain</p>
        <p>
          By{' '}
          <a href="https://x.com/najish_anjum" target="_blank" rel="noopener noreferrer" className="underline">
            Najish
          </a>{' '}
          · App built by{' '}
          <a href="https://x.com/nimsaraonline" target="_blank" rel="noopener noreferrer" className="underline">
            @nimsaraonline
          </a>
        </p>
      </footer>
    </div>
  );
};
