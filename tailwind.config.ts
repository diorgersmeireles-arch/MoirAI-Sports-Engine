import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sport: {
          bg: '#000000',
          surface: '#111111',
          border: '#1f1f1f',
          text: '#f5f0e8',
          dim: '#888888',
          home: '#22c55e',
          draw: '#a855f7',
          away: '#ef4444',
          accent: '#d4af37',
          gold: '#d4af37',
          'gold-light': '#f0d060',
          'gold-dark': '#b8860b',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
