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
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          text: '#f1f5f9',
          dim: '#94a3b8',
          home: '#22c55e',
          draw: '#a855f7',
          away: '#ef4444',
          accent: '#3b82f6',
          gold: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
