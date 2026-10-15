import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, WifiOff } from 'lucide-react';

const UPDATE_CHECK_MS = 30 * 60 * 1000;

// Registers the service worker and shows its state: a new version waiting,
// or the device being offline.
export const PwaStatus: React.FC = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  // "Later" only hides the toast; the waiting update still applies in the background.
  const [toastHidden, setToastHidden] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed apps can stay open for days during the event; poll for new
      // deploys instead of waiting for a full relaunch.
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => {});
      }, UPDATE_CHECK_MS);
    },
  });

  // If the user ignores the toast, apply the update while the app is in the
  // background so it's current next time they open it, without interrupting.
  useEffect(() => {
    if (!needRefresh) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') updateServiceWorker(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return (
    <>
      {!online && (
        <div
          role="status"
          className="relative z-50 bg-[#FEF3C7] border-b border-[#000000] text-[#000000] text-[13px] px-4 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          You're offline. The schedule still works; people and snaps update when you reconnect.
        </div>
      )}

      {needRefresh && !toastHidden && (
        <div
          role="status"
          className="fixed z-[55] left-1/2 -translate-x-1/2 top-[calc(4.5rem+env(safe-area-inset-top))] w-[calc(100vw-2rem)] max-w-sm bg-[#000000] text-[#FFFFFF] border-2 border-[#000000] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] px-4 py-3 flex items-center gap-3"
        >
          <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-sm">A new version is ready.</span>
          <button
            type="button"
            onClick={() => setToastHidden(true)}
            className="font-mono text-xs text-[#BBBBBB] hover:text-[#FFFFFF] px-1"
          >
            LATER
          </button>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="bg-[#FFFFFF] text-[#000000] px-3 py-1.5 font-mono text-xs font-bold"
          >
            RELOAD
          </button>
        </div>
      )}
    </>
  );
};
