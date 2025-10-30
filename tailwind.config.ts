import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './demo/index.html',
    './demo/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0b0e14',
          secondary: '#0f1420',
          card: '#101725',
          hover: '#121b2b',
        },
        textc: {
          primary: '#e5e7eb',
          secondary: '#a8b3c7',
          muted: '#7b8aa3',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          soft: '#1a1431',
        },
        borderc: {
          light: '#1b2536',
          medium: '#2a3650',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#60a5fa',
      },
      boxShadow: {
        soft: '0 6px 14px rgba(0,0,0,0.35)',
        strong: '0 14px 28px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        xl2: '18px',
      },
    },
  },
  plugins: [],
} satisfies Config;
