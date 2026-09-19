import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all duration-300 active:scale-95 ${
        isDark
          ? 'bg-[#181818] border-[#333] text-zinc-300 hover:bg-[#222] hover:text-white'
          : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
      }`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">LIGHT</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">DARK</span>
        </>
      )}
    </button>
  );
};
