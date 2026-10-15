import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { detectPlatform, rememberDismissed, useInstallState, wasDismissedRecently } from '../lib/pwa';

interface InstallBannerProps {
  onOpen: () => void;
}

// In-flow strip under the navbar rather than a floating bar: the bottom of the
// screen already has the mobile nav, the Ask Mumbai button and match toasts.
export const InstallBanner: React.FC<InstallBannerProps> = ({ onOpen }) => {
  const { installed } = useInstallState();
  const [hidden, setHidden] = useState(() => wasDismissedRecently());

  if (installed || hidden) return null;

  const isDesktop = detectPlatform() === 'desktop';

  function dismiss() {
    rememberDismissed();
    setHidden(true);
  }

  return (
    <div className="bg-[#000000] text-[#FFFFFF] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-[13px] leading-snug">
          {isDesktop ? 'Take Mumbai Onchain with you during Devcon week.' : 'Add Mumbai Onchain to your home screen.'}
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 bg-[#FFFFFF] text-[#000000] px-3 py-1.5 font-mono text-xs font-bold"
        >
          {isDesktop ? 'GET THE APP' : 'INSTALL'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="shrink-0 p-1.5 -mr-1.5 text-[#BBBBBB] hover:text-[#FFFFFF]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
