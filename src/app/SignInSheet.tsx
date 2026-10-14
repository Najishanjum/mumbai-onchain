import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { isValidEmail, sendCode, verifyCode } from '../lib/auth';
import { Sheet } from './ui';

interface SignInSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Why we're asking, e.g. "to create your pass". */
  reason?: string;
}

const CODE_LENGTH = 8;
const RESEND_SECONDS = 30;
const LAST_EMAIL_KEY = 'mo_last_email';

function SignInBody({ onClose, reason }: Omit<SignInSheetProps, 'isOpen'>) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  async function requestCode() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    const err = await sendCode(email);
    setBusy(false);
    if (err) return setError(err);
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
    } catch {
      // fine without it
    }
    setCode('');
    setStep('code');
    setResendIn(RESEND_SECONDS);
  }

  async function submitCode(value: string) {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    const err = await verifyCode(email, value);
    setBusy(false);
    if (err) {
      setError(err);
      setCode('');
      codeRef.current?.focus();
      return;
    }
    // Signed in. The sheet disappears on its own once the account listener
    // sees the session; closing it here would cancel the pending next step.
  }

  function onCodeChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    // Auto-submit once complete, including iPhone's code auto-fill from Mail.
    if (digits.length === CODE_LENGTH) submitCode(digits);
  }

  return (
    <Sheet open onClose={onClose} label="Sign in" dismissible={!busy}>
      <div className="px-6 pt-8 pb-2">
        {step === 'code' && (
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setError(null);
            }}
            className="mb-4 -ml-1 h-9 inline-flex items-center gap-1 text-[15px] text-[var(--app-primary)]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Different email
          </button>
        )}

        <span className="w-14 h-14 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center">
          <Mail className="w-7 h-7" aria-hidden="true" />
        </span>

        {step === 'email' ? (
          <>
            <h2 className="app-title mt-5 text-[26px] font-bold leading-tight">Sign in</h2>
            <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--app-muted)]">
              {reason ? `Sign in ${reason}. ` : ''}We’ll email you an 8-digit code. New here? This creates your account.
            </p>
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                requestCode();
              }}
            >
              <label htmlFor="signin-email" className="sr-only">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(error)}
                className="w-full h-14 px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[17px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]"
              />
              {error && <p className="mt-2 text-[14px] text-[var(--app-live)]">{error}</p>}
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="app-press mt-4 w-full h-13 py-3.5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[16px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {busy ? 'Sending code' : 'Email me a code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="app-title mt-5 text-[26px] font-bold leading-tight">Check your email</h2>
            <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--app-muted)]">
              Enter the 8-digit code we sent to <span className="font-semibold text-[var(--app-ink)] break-all">{email.trim()}</span>.
            </p>

            {/* One real input (so paste and iPhone auto-fill work) under six display boxes. */}
            <label htmlFor="signin-code" className="sr-only">
              8-digit code
            </label>
            <div className="relative mt-6" onClick={() => codeRef.current?.focus()}>
              <input
                id="signin-code"
                ref={codeRef}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={CODE_LENGTH}
                disabled={busy}
                aria-invalid={Boolean(error)}
                className="absolute inset-0 w-full h-full opacity-0 text-[16px]"
              />
              <div className="grid grid-cols-8 gap-1.5" aria-hidden="true">
                {Array.from({ length: CODE_LENGTH }, (_, i) => {
                  const filled = i < code.length;
                  const active = i === code.length && !busy;
                  return (
                    <div
                      key={i}
                      className={`h-14 rounded-xl border flex items-center justify-center text-[22px] font-semibold tabular-nums bg-[var(--app-surface)] ${
                        error
                          ? 'border-[var(--app-live)]'
                          : active
                            ? 'border-[var(--app-primary)] ring-2 ring-[var(--app-primary)]/30'
                            : 'border-[var(--app-line)]'
                      }`}
                    >
                      {filled ? code[i] : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 min-h-[22px] text-[14px]">
              {busy ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--app-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Checking
                </span>
              ) : error ? (
                <span className="text-[var(--app-live)]">{error}</span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={requestCode}
              disabled={resendIn > 0 || busy}
              className="mt-3 h-10 text-[15px] font-medium text-[var(--app-primary)] disabled:text-[var(--app-faint)]"
            >
              {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
            </button>
            <p className="mt-1 text-[13px] text-[var(--app-muted)]">Can’t find it? Check spam or promotions.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

export const SignInSheet: React.FC<SignInSheetProps> = ({ isOpen, ...rest }) => (isOpen ? <SignInBody {...rest} /> : null);
