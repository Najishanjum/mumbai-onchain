import { useEffect, useState, type CSSProperties } from 'react';

/** What's left of the screen while the on-screen keyboard is up. */
export interface KeyboardViewport {
  /** Where the visible area starts, in the page's fixed-position coordinates. */
  top: number;
  height: number;
  /** How much the keyboard covers. */
  keyboard: number;
}

/**
 * iPhone's keyboard doesn't resize the page: it covers it and slides the
 * visible area up. A full-screen `fixed inset-0` layer stays page-sized, so
 * its header slid out of view and the app behind showed around the keyboard.
 * This tracks the visible area (the visual viewport) while the keyboard is up,
 * and null when it isn't.
 */
export function useKeyboardViewport(active = true): KeyboardViewport | null {
  const [vp, setVp] = useState<KeyboardViewport | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) {
      setVp(null);
      return;
    }
    const update = () => {
      const keyboard = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      // Under ~80px it's a toolbar or rounding, not a keyboard.
      setVp(keyboard > 80 ? { top: Math.round(vv.offsetTop), height: Math.round(vv.height), keyboard } : null);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);
  return vp;
}

/**
 * Paints `fill` all around a layer, far past the screen edges. While the
 * keyboard slides in, iPhone scrolls the page before the visible area has
 * been measured, and without this the screen behind showed above and below.
 */
export const coverAround = (fill: string): CSSProperties => ({ boxShadow: `0 0 0 200vmax ${fill}` });

/**
 * Style for a full-screen layer: fit it to the visible area while the keyboard
 * is up, and paint `fill` around it, so what shows through the translucent
 * keyboard is this layer and not the screen behind.
 */
export function keyboardFit(vp: KeyboardViewport | null, fill: string): CSSProperties | undefined {
  if (!vp) return undefined;
  return { top: vp.top, height: vp.height, bottom: 'auto', ...coverAround(fill) };
}
