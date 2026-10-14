import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share, SquarePlus, EllipsisVertical, Copy, Check, Compass } from 'lucide-react';
import { detectInAppBrowser, detectPlatform, promptInstall, useInstallState } from '../lib/pwa';

interface InstallSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin + '/?source=qr' : '';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 border border-[#000000] bg-[#FFFFFF] p-3.5">
      <span className="flex w-7 h-7 shrink-0 items-center justify-center bg-[#000000] text-[#FFFFFF] font-mono text-xs font-bold">
        {n}
      </span>
      <span className="flex-1 text-[15px] leading-snug">{children}</span>
    </li>
  );
}

const inline = 'inline w-4 h-4 align-[-3px] mx-0.5';

function InAppBrowserSteps({ app }: { app: 'x' | 'telegram' | 'instagram' }) {
  const [copied, setCopied] = useState(false);
  const name = app === 'x' ? 'X' : app === 'telegram' ? 'Telegram' : 'Instagram';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the URL is shown on screen to copy by hand
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-[#333333]">
        You opened this inside {name}, which can't install apps. Open it in Safari or Chrome first.
      </p>
      <ol className="space-y-2.5">
        <Step n={1}>
          Tap <EllipsisVertical className={inline} /> or <b>•••</b> in the corner
        </Step>
        <Step n={2}>
          Choose <Compass className={inline} /> <b>Open in browser</b>
        </Step>
        <Step n={3}>Come back to this screen to install</Step>
      </ol>
      <button
        type="button"
        onClick={copyLink}
        className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#000000] py-3 font-mono text-sm font-bold"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Link copied' : 'Copy link instead'}
      </button>
    </div>
  );
}

function IosSteps() {
  return (
    <ol className="space-y-2.5">
      <Step n={1}>
        Tap <Share className={inline} /> <b>Share</b> (in Safari's toolbar or its <b>•••</b> menu)
      </Step>
      <Step n={2}>
        Choose <SquarePlus className={inline} /> <b>Add to Home Screen</b>
      </Step>
      <Step n={3}>Open Mumbai Onchain from your home screen</Step>
    </ol>
  );
}

function AndroidSteps({ canPrompt, onInstall, installing }: { canPrompt: boolean; onInstall: () => void; installing: boolean }) {
  return (
    <div className="space-y-4">
      {canPrompt && (
        <button
          type="button"
          onClick={onInstall}
          disabled={installing}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#000000] text-[#FFFFFF] py-3.5 font-heading font-bold text-base disabled:opacity-60"
        >
          <Download className="w-5 h-5" />
          {installing ? 'Installing…' : 'Install app'}
        </button>
      )}
      <ol className="space-y-2.5">
        <Step n={1}>
          {canPrompt ? 'Or open' : 'Open'} your browser menu <EllipsisVertical className={inline} />
        </Step>
        <Step n={2}>
          Choose <b>Install app</b> or <b>Add to Home screen</b>
        </Step>
      </ol>
    </div>
  );
}

function DesktopQr({ canPrompt, onInstall }: { canPrompt: boolean; onInstall: () => void }) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(APP_URL, { margin: 1, width: 360, color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 border border-[#000000] p-5">
        {qr ? (
          <img src={qr} alt={`QR code linking to ${window.location.host}`} className="w-44 h-44" />
        ) : (
          <div className="w-44 h-44 bg-[#F2F2F2]" />
        )}
        <p className="text-center text-sm text-[#444444] max-w-[30ch]">
          Scan with your phone's camera, then add it to your home screen.
        </p>
      </div>
      {canPrompt && (
        <button
          type="button"
          onClick={onInstall}
          className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#000000] py-3 font-mono text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Install on this computer
        </button>
      )}
    </div>
  );
}

export const InstallSheet: React.FC<InstallSheetProps> = ({ isOpen, onClose }) => {
  const { deferred, installed } = useInstallState();
  const [installing, setInstalling] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const platform = typeof window !== 'undefined' ? detectPlatform() : 'desktop';
  const inApp = typeof window !== 'undefined' ? detectInAppBrowser() : null;

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Close once the native dialog reports a successful install.
  useEffect(() => {
    if (isOpen && installed) onClose();
  }, [isOpen, installed, onClose]);

  if (!isOpen) return null;

  async function install() {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  }

  const title = inApp ? 'Open in your browser' : platform === 'desktop' ? 'Get it on your phone' : 'Install Mumbai Onchain';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#FFFFFF] border-t-2 sm:border-2 border-[#000000] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-4">
          <img src="/brand/logo.webp" alt="Mumbai Onchain" className="w-20 h-20 -ml-1" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-2 text-[#000000] hover:bg-[#F2F2F2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 id="install-sheet-title" className="mt-3 font-heading font-black text-2xl tracking-tight">
          {title}
        </h2>
        {!inApp && (
          <p className="mt-1.5 mb-5 text-[15px] leading-relaxed text-[#444444]">
            Full screen, one tap from your home screen, and the schedule still works when the venue Wi-Fi doesn't.
          </p>
        )}
        <div className={inApp ? 'mt-3' : ''}>
          {inApp ? (
            <InAppBrowserSteps app={inApp} />
          ) : platform === 'ios' ? (
            <IosSteps />
          ) : platform === 'android' ? (
            <AndroidSteps canPrompt={Boolean(deferred)} onInstall={install} installing={installing} />
          ) : platform === 'other-mobile' ? (
            <ol className="space-y-2.5">
              <Step n={1}>Open your browser menu</Step>
              <Step n={2}>
                Look for <b>Add to Home Screen</b> or <b>Install app</b>
              </Step>
            </ol>
          ) : (
            <DesktopQr canPrompt={Boolean(deferred)} onInstall={install} />
          )}
        </div>
      </div>
    </div>
  );
};
