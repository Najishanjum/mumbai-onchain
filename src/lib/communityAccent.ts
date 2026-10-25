// Community mode's own look: one teal-to-indigo gradient for every community,
// so it feels like a separate app from Mumbai Onchain's orange without
// depending on each logo. Lighter on dark, deeper on light, so text on it
// stays readable.

const DARK = { main: '#2DD4BF', deep: '#818CF8', on: '#04211E', soft: 'rgba(45, 212, 191, 0.16)' };
const LIGHT = { main: '#0F766E', deep: '#4F46E5', on: '#FFFFFF', soft: 'rgba(15, 118, 110, 0.12)' };

/** CSS variables that re-colour everything inside community mode: buttons, tabs, titles and the glow. */
export function communityVars(light: boolean): Record<string, string> {
  const c = light ? LIGHT : DARK;
  return {
    '--c-accent': c.main,
    '--c-accent-2': c.deep,
    '--app-primary': c.main,
    '--app-on-primary': c.on,
    '--app-primary-soft': c.soft,
    '--app-glow': `radial-gradient(120% 60% at 85% -10%, rgba(99, 102, 241, ${light ? 0.14 : 0.3}), transparent 60%), radial-gradient(90% 50% at 0% 0%, rgba(20, 184, 166, ${light ? 0.12 : 0.24}), transparent 60%)`,
  };
}
