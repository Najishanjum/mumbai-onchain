import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, X } from 'lucide-react';
import { usePeopleStore } from '../lib/usePeopleStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { SUPPORT_URL, supportMessage } from '../lib/support';

// Profiles made on the website before accounts existed belong to the browser
// that made it. On iPhone the installed app doesn't share Safari's storage,
// so the app can't find that profile. Signing in here, in the browser that
// made it, attaches it to the account; the app then loads it on sign-in.

const TARGET_KEY = 'mo_claim_target';
const DONE_KEY = 'mo_keep_banner_done';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // banner may show again; harmless
  }
};

export function KeepProfileBanner({ onSignIn, onInstall }: { onSignIn: () => void; onInstall: () => void }) {
  const { myProfile, authUser, authReady, accountReady } = usePeopleStore();
  const [done, setDone] = useState(() => read(DONE_KEY) === '1');
  const [target, setTarget] = useState(() => read(TARGET_KEY));
  const [copied, setCopied] = useState(false);

  // Remember which profile this browser is claiming before sign-in replaces it.
  useEffect(() => {
    if (!authUser && myProfile && !target) {
      write(TARGET_KEY, myProfile.id);
      setTarget(myProfile.id);
    }
  }, [authUser, myProfile, target]);

  if (!isSupabaseConfigured() || !authReady || done) return null;

  let state: 'claim' | 'saving' | 'saved' | 'conflict' | null = null;
  if (!authUser) state = myProfile ? 'claim' : null;
  else if (!target) state = null;
  else if (!accountReady) state = 'saving';
  else state = myProfile?.id === target ? 'saved' : 'conflict';
  if (!state) return null;

  const close = () => {
    write(DONE_KEY, '1');
    setDone(true);
  };

  const copyAndAsk = async () => {
    try {
      await navigator.clipboard.writeText(supportMessage(authUser?.email ?? '', target ?? ''));
      setCopied(true);
    } catch {
      // clipboard blocked; the message is still on screen
    }
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-4"
    >
      <div className="relative border-2 border-[#000000] bg-[#FFFFFF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 pr-8">
          {state === 'claim' && (
            <>
              <p className="font-heading font-black text-base uppercase tracking-tight">Keep your profile</p>
              <p className="mt-1 text-sm text-[#333333]">
                You made a profile in this browser{myProfile?.name ? ` as ${myProfile.name}` : ''}. Sign in with your email to keep it, then sign in to the
                app with the same email and it’s there.
              </p>
            </>
          )}
          {state === 'saving' && (
            <p className="font-mono text-sm inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Saving your profile to your account…
            </p>
          )}
          {state === 'saved' && (
            <>
              <p className="font-heading font-black text-base uppercase tracking-tight inline-flex items-center gap-2">
                <Check className="w-5 h-5 text-[#22C55E]" aria-hidden="true" /> Profile saved to your account
              </p>
              <p className="mt-1 text-sm text-[#333333]">
                Now install the app and sign in with <b>{authUser?.email}</b>. Your profile, photo and badge will be there.
              </p>
            </>
          )}
          {state === 'conflict' && (
            <>
              <p className="font-heading font-black text-base uppercase tracking-tight">This email already has a profile</p>
              <p className="mt-1 text-sm text-[#333333]">
                <b>{authUser?.email}</b> already has a profile made in the app, so the one from this browser couldn’t be added. To keep this older one
                instead, message Nimsara to have it moved.
              </p>
            </>
          )}
        </div>

        {state === 'claim' && (
          <button
            type="button"
            onClick={onSignIn}
            className="shrink-0 px-4 py-2.5 bg-[#000000] hover:bg-[#222222] text-white font-heading font-black text-xs uppercase inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            Keep my profile <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {state === 'saved' && (
          <button
            type="button"
            onClick={onInstall}
            className="shrink-0 px-4 py-2.5 bg-[#000000] hover:bg-[#222222] text-white font-heading font-black text-xs uppercase inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            Install the app <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {state === 'conflict' && (
          <button
            type="button"
            onClick={copyAndAsk}
            className="shrink-0 px-4 py-2.5 bg-[#000000] hover:bg-[#222222] text-white font-heading font-black text-xs uppercase inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? 'Message copied' : 'Message Nimsara'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {state !== 'saving' && (
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss"
            className="absolute top-2 right-2 p-2 text-[#000000] hover:bg-[#F2F2F2] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
