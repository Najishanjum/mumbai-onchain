import { useState } from 'react';
import { Check, ExternalLink, Globe, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { usePeopleStore } from '../lib/usePeopleStore';
import { SUPPORT_URL, supportMessage } from '../lib/support';
import { Sheet } from './ui';

/**
 * For people who made a profile on the website before the app: on iPhone
 * the app can't see Safari's storage, so the profile is claimed on the
 * website first (KeepProfileBanner), then picked up here.
 */
export function FindProfileSheet({ isOpen, onClose, onSignIn }: { isOpen: boolean; onClose: () => void; onSignIn: () => void }) {
  const { authUser, myProfile, accountReady, recheckAccount } = usePeopleStore();
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const email = authUser?.email ?? '';
  const site = window.location.origin;

  const checkAgain = () => {
    setChecked(true);
    recheckAccount();
  };

  const askNajish = async () => {
    try {
      await navigator.clipboard.writeText(supportMessage(email, myProfile ? `(I now have "${myProfile.name}" in the app)` : undefined));
      setCopied(true);
    } catch {
      // clipboard blocked; they can still write the message
    }
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  };

  const step = 'flex gap-3';
  const num =
    'w-7 h-7 shrink-0 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] app-mono text-[13px] font-semibold flex items-center justify-center';
  const button =
    'app-press h-11 px-4 rounded-full text-[15px] font-semibold inline-flex items-center justify-center gap-2';

  return (
    <Sheet open={isOpen} onClose={onClose} label="Find your website profile">
      <div className="px-6 pt-8 pb-2">
        <span className="w-14 h-14 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center">
          <Globe className="w-7 h-7" aria-hidden="true" />
        </span>
        <h2 className="app-title mt-5 text-[26px] leading-tight">Find your website profile</h2>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--app-muted)]">
          Made a profile on the Mumbai Onchain website before? It’s kept in the browser you used, so the app can’t see it yet. Two steps:
        </p>

        {!authUser ? (
          <div className="mt-6">
            <p className="text-[15px]">First, sign in here with the email you want to use.</p>
            <button type="button" onClick={onSignIn} className={`${button} mt-3 bg-[var(--app-primary)] text-[var(--app-on-primary)]`}>
              Sign in
            </button>
          </div>
        ) : (
          <ol className="mt-6 space-y-5">
            <li className={step}>
              <span className={num}>1</span>
              <div className="min-w-0">
                <p className="text-[15px] leading-relaxed">
                  Open the website in the browser where you made the profile (usually Safari), tap <b>Keep my profile</b> and sign in with{' '}
                  <b className="break-all">{email}</b>.
                </p>
                <a href={site} target="_blank" rel="noopener noreferrer" className={`${button} mt-3 bg-[var(--app-surface)] border border-[var(--app-line)]`}>
                  Open the website <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </li>
            <li className={step}>
              <span className={num}>2</span>
              <div className="min-w-0">
                <p className="text-[15px] leading-relaxed">Come back here and check again.</p>
                <button
                  type="button"
                  onClick={checkAgain}
                  disabled={checked && !accountReady}
                  className={`${button} mt-3 bg-[var(--app-primary)] text-[var(--app-on-primary)] disabled:opacity-60`}
                >
                  {checked && !accountReady ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  )}
                  Check again
                </button>
                {checked && accountReady && (
                  <p className="mt-2 text-[14px] inline-flex items-center gap-1.5 text-[var(--app-muted)]">
                    {myProfile ? (
                      <>
                        <Check className="w-4 h-4 text-[var(--app-primary)]" aria-hidden="true" /> Found: {myProfile.name}
                      </>
                    ) : (
                      'Nothing yet. Did step 1 say “Profile saved to your account”?'
                    )}
                  </p>
                )}
              </div>
            </li>
          </ol>
        )}

        {authUser && myProfile && !checked && (
          <p className="mt-5 text-[14px] text-[var(--app-muted)]">
            You already have a profile in the app, so the website one can’t be added on its own. Ask Najish to swap them.
          </p>
        )}

        <div className="mt-7 pt-5 border-t border-[var(--app-line)]">
          <p className="text-[14px] text-[var(--app-muted)]">Lost the browser, or still missing? Najish can move it for you.</p>
          <button type="button" onClick={askNajish} className={`${button} mt-3 bg-[var(--app-surface)] border border-[var(--app-line)]`}>
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> {copied ? 'Message copied, paste it to Najish' : 'Message Najish'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
