import { useEffect, useRef } from 'react';

// Full-screen pages and sheets in the app open on top of a tab without a URL
// of their own. iPhone's edge swipe (and Android's back) is the browser's
// back, so without an entry of their own it skipped past them to the previous
// tab while they stayed open. Each open overlay adds one history entry,
// tagged in history.state; going back closes the topmost one.

const KEY = '__overlays';

function openOverlays(): string[] {
  const s = window.history.state as Record<string, unknown> | null;
  return Array.isArray(s?.[KEY]) ? (s![KEY] as string[]) : [];
}

let counter = 0;

/** Close `onClose` when the user goes back while `open`; clean up the entry when closed in-app. */
export function useBackToClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const marker = `o${++counter}`;
    window.history.pushState({ ...(window.history.state ?? {}), [KEY]: [...openOverlays(), marker] }, '');
    let closedByBack = false;

    const onPop = () => {
      // Only close if going back took this overlay's entry away.
      if (!openOverlays().includes(marker)) {
        closedByBack = true;
        closeRef.current();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (closedByBack) return;
      // Closed in the app (back button, X, swipe down): drop our entry so the
      // next back goes where the user expects. Wait a tick: another overlay
      // may be opening in the same moment (scan → person), and stepping back
      // then would close it instead.
      window.setTimeout(() => {
        const stack = openOverlays();
        if (stack[stack.length - 1] === marker) window.history.back();
        else if (stack.includes(marker)) {
          window.history.replaceState({ ...(window.history.state ?? {}), [KEY]: stack.filter((m) => m !== marker) }, '');
        }
      }, 0);
    };
  }, [open]);
}
