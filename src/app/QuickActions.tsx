import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Map as MapIcon, ScanLine, Sparkles } from 'lucide-react';
import { useBackToClose } from '../lib/useBackToClose';

// Shown until someone opens the menu once.
const HINT_KEY = 'mo_app_quick_seen';

function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return true;
  }
}

/**
 * The round logo in the middle of the tab bar. Tapping it fans out three
 * actions in an arc above it: Map, Ask and Scan.
 */
export function QuickActions({ onAsk, onMap, onScan }: { onAsk: () => void; onMap: () => void; onScan: () => void }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(() => !hintSeen());
  useBackToClose(open, () => setOpen(false));

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(false), 8000);
    return () => window.clearTimeout(t);
  }, [hint]);

  const toggle = () => {
    setOpen((o) => !o);
    if (hint) {
      setHint(false);
      try {
        localStorage.setItem(HINT_KEY, '1');
      } catch {
        // private mode: the hint shows again next launch
      }
    }
  };

  // Close and open in the same update: useBackToClose then hands the menu's
  // history entry over to the screen that opens, instead of stepping back.
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  // Arc above the logo, left to right; offsets in px from the logo's centre.
  const actions = [
    { label: 'Map', Icon: MapIcon, onClick: run(onMap), x: -104, y: -96 },
    { label: 'Ask AI', Icon: Sparkles, onClick: run(onAsk), x: 0, y: -156 },
    { label: 'Scan', Icon: ScanLine, onClick: run(onScan), x: 104, y: -96 },
  ];

  return (
    <div className="relative flex flex-col items-center justify-start">
      {/* The dim goes inside the app root (an isolated stacking context), so it
          sits under the tab bar (z-50) and the actions instead of over them. */}
      {open &&
        createPortal(
          <div className="app-backdrop fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />,
          document.querySelector('.app-root') ?? document.body
        )}

      <div className="absolute left-1/2 top-[10px] w-0 h-0" id="quick-actions">
        {actions.map(({ label, Icon, onClick, x, y }, i) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            tabIndex={open ? 0 : -1}
            aria-hidden={!open}
            className="quick-action absolute left-0 top-0 w-[68px] flex flex-col items-center gap-1.5"
            style={{
              transform: open ? `translate(${x - 34}px, ${y - 34}px) scale(1)` : 'translate(-34px, -34px) scale(0.4)',
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transitionDelay: open ? `${i * 40}ms` : '0ms',
            }}
          >
            <span className="w-[68px] h-[68px] rounded-full bg-white shadow-[0_0_0_3px_var(--app-primary),0_10px_28px_rgba(0,0,0,0.45)] flex items-center justify-center text-[#121419]">
              <Icon className="w-[30px] h-[30px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[14px] font-bold text-white whitespace-nowrap [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">{label}</span>
          </button>
        ))}
      </div>

      {hint && !open && (
        <span className="quick-hint absolute bottom-full mb-6 whitespace-nowrap h-8 px-3 rounded-full bg-[var(--app-ink)] text-[var(--app-bg)] text-[12px] font-bold inline-flex items-center">
          Tap for Map, Ask and Scan
        </span>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="quick-actions"
        aria-label={open ? 'Close quick actions' : 'Quick actions: Map, Ask and Scan'}
        className="app-press relative"
      >
        <span
          className={`quick-logo block -mt-5 w-[60px] h-[60px] rounded-full bg-[var(--app-bg)] p-[3px] shadow-[0_0_0_2px_var(--app-primary),0_6px_18px_color-mix(in_srgb,var(--app-primary)_40%,transparent)] ${open ? 'is-open' : ''}`}
        >
          <img src="/icons/icon-192.png" alt="" className="w-full h-full rounded-full" />
        </span>
      </button>
    </div>
  );
}
