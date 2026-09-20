import React from 'react';

export const HeroArtwork: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      
      {/* Bottom Left: Gateway of India Arch + Indian Paisley Lotus + Ethereum Diamonds */}
      <div className="absolute -bottom-10 -left-12 sm:-left-6 w-64 sm:w-84 md:w-96 opacity-90 transition-transform duration-700 hover:scale-105">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-md">
          {/* Radial Mandala Ring */}
          <circle cx="120" cy="320" r="140" stroke="#050505" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6" />
          <circle cx="120" cy="320" r="110" stroke="#E5E5E5" strokeWidth="1.5" />
          <circle cx="120" cy="320" r="80" stroke="#F97316" strokeWidth="2" opacity="0.8" />
          
          {/* Lotus Petals / Indian Visual Motifs */}
          <path d="M120 180 C90 230 70 270 120 320 C170 270 150 230 120 180Z" fill="#F97316" stroke="#050505" strokeWidth="2.5" />
          <path d="M60 220 C40 260 50 290 120 320 C110 260 80 230 60 220Z" fill="#627EEA" stroke="#050505" strokeWidth="2" />
          <path d="M180 220 C200 260 190 290 120 320 C130 260 160 230 180 220Z" fill="#8B5CF6" stroke="#050505" strokeWidth="2" />
          <path d="M120 230 C105 265 95 290 120 320 C145 290 135 265 120 230Z" fill="#FDE047" stroke="#050505" strokeWidth="1.5" />

          {/* Gateway Arch Silhouette */}
          <path d="M190 380 V280 C190 250 240 250 240 280 V380" stroke="#050505" strokeWidth="3.5" fill="#FAFAFA" />
          <path d="M200 380 V290 C200 270 230 270 230 290 V380" stroke="#050505" strokeWidth="2" fill="#F97316" fillOpacity="0.2" />
          <path d="M180 280 H250 V260 C250 245 180 245 180 260 Z" fill="#050505" />

          {/* Ethereum Diamond Node Motif */}
          <g transform="translate(190, 160) scale(0.9)">
            <polygon points="40,10 70,55 40,70 10,55" fill="#627EEA" stroke="#050505" strokeWidth="2.5" />
            <polygon points="40,10 70,55 40,42" fill="#8299F0" stroke="#050505" strokeWidth="1.5" />
            <polygon points="40,75 70,60 40,100 10,60" fill="#4B68D1" stroke="#050505" strokeWidth="2.5" />
            <polygon points="40,75 70,60 40,88" fill="#627EEA" stroke="#050505" strokeWidth="1.5" />
          </g>

          {/* Hand-drawn blockchain blocks / nodes */}
          <rect x="30" y="320" width="28" height="28" fill="#10B981" stroke="#050505" strokeWidth="2" transform="rotate(12 30 320)" />
          <rect x="75" y="350" width="24" height="24" fill="#EC4899" stroke="#050505" strokeWidth="2" transform="rotate(-8 75 350)" />
          <line x1="45" y1="330" x2="85" y2="360" stroke="#050505" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Bottom Right: Mumbai Maritime / Marine Drive Waves + Floral Loom + Ethereum Glyph */}
      <div className="absolute -bottom-12 -right-12 sm:-right-6 w-68 sm:w-88 md:w-104 opacity-90 transition-transform duration-700 hover:scale-105">
        <svg viewBox="0 0 420 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-md">
          {/* Concentric Loom Radiance */}
          <circle cx="300" cy="310" r="140" stroke="#D8D8D8" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="300" cy="310" r="105" stroke="#050505" strokeWidth="2" />
          <circle cx="300" cy="310" r="70" stroke="#627EEA" strokeWidth="2" strokeDasharray="3 3" />

          {/* Indian Floral Petals / Loom Weave */}
          <path d="M300 170 C270 220 260 260 300 310 C340 260 330 220 300 170Z" fill="#3B82F6" stroke="#050505" strokeWidth="2.5" />
          <path d="M240 210 C220 250 235 280 300 310 C290 250 265 220 240 210Z" fill="#EC4899" stroke="#050505" strokeWidth="2" />
          <path d="M360 210 C380 250 365 280 300 310 C310 250 335 220 360 210Z" fill="#F59E0B" stroke="#050505" strokeWidth="2" />
          <path d="M300 225 C285 260 280 280 300 310 C320 280 315 260 300 225Z" fill="#10B981" stroke="#050505" strokeWidth="1.5" />

          {/* Abstract Ethereum Diamond & Cryptographic Nodes */}
          <g transform="translate(130, 200) scale(0.85)">
            <polygon points="50,15 85,65 50,82 15,65" fill="#8B5CF6" stroke="#050505" strokeWidth="2.5" />
            <polygon points="50,15 85,65 50,50" fill="#A78BFA" stroke="#050505" strokeWidth="1.5" />
            <polygon points="50,88 85,72 50,118 15,72" fill="#6D28D9" stroke="#050505" strokeWidth="2.5" />
          </g>

          {/* Network constellation lines */}
          <circle cx="170" cy="180" r="7" fill="#F97316" stroke="#050505" strokeWidth="2" />
          <circle cx="210" cy="140" r="5" fill="#050505" />
          <line x1="170" y1="180" x2="210" y2="140" stroke="#050505" strokeWidth="2" />
          <line x1="170" y1="180" x2="172" y2="215" stroke="#050505" strokeWidth="2" strokeDasharray="3 3" />

          {/* Mumbai Local Train & Railway Network Lines */}
          <path d="M220 370 C250 340 310 330 380 350" stroke="#050505" strokeWidth="3" fill="none" />
          <path d="M230 385 C260 355 320 345 390 365" stroke="#050505" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          
          {/* Hand-drawn geometric stamps */}
          <rect x="230" y="300" width="22" height="22" fill="#FBBF24" stroke="#050505" strokeWidth="2" transform="rotate(45 230 300)" />
          <polygon points="360,290 380,315 350,320" fill="#627EEA" stroke="#050505" strokeWidth="2" />
        </svg>
      </div>

      {/* Subtle Side Floating Micro-Motifs */}
      <div className="hidden lg:block absolute top-1/2 left-3 -translate-y-1/2 opacity-70">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <circle cx="24" cy="20" r="8" fill="#F97316" stroke="#050505" strokeWidth="2" />
          <line x1="24" y1="28" x2="24" y2="60" stroke="#050505" strokeWidth="2" strokeDasharray="2 2" />
          <rect x="14" y="60" width="20" height="20" fill="#FFFFFF" stroke="#050505" strokeWidth="2" transform="rotate(15 24 70)" />
          <line x1="24" y1="80" x2="24" y2="105" stroke="#050505" strokeWidth="2" strokeDasharray="2 2" />
          <polygon points="24,105 32,118 16,118" fill="#627EEA" stroke="#050505" strokeWidth="2" />
        </svg>
      </div>

      <div className="hidden lg:block absolute top-1/3 right-3 opacity-70">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <polygon points="24,10 36,30 24,38 12,30" fill="#8B5CF6" stroke="#050505" strokeWidth="2" />
          <polygon points="24,42 36,34 24,54 12,34" fill="#6D28D9" stroke="#050505" strokeWidth="2" />
          <line x1="24" y1="56" x2="24" y2="88" stroke="#050505" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="24" cy="98" r="9" fill="#F59E0B" stroke="#050505" strokeWidth="2" />
        </svg>
      </div>

    </div>
  );
};
