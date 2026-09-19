/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#050505',
          surface: '#0A0A0A',
          card: '#101010',
          hover: '#181818',
        },
        border: {
          DEFAULT: '#202020',
          subtle: '#1A1A1A',
          highlight: '#333333',
        },
        primary: {
          DEFAULT: '#F5F5F5',
          muted: '#8A8A8A',
          dark: '#555555',
        },
        eth: {
          DEFAULT: '#627EEA',
          light: '#8299F0',
          glow: 'rgba(98, 126, 234, 0.15)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.15)',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'glow-eth': '0 0 25px rgba(98, 126, 234, 0.25)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.25)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { opacity: '0.4', filter: 'blur(20px)' },
          '100%': { opacity: '0.8', filter: 'blur(30px)' },
        }
      }
    },
  },
  plugins: [],
}
