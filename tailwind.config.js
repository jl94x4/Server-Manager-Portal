/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117', // Very dark slate/navy
        card: '#161b22',       // Slightly lighter card background
        border: '#30363d',     // Subtle border color
        plex: 'rgb(var(--color-plex) / <alpha-value>)',       // Orange accent
        'plex-hover': 'rgb(var(--color-plex-hover) / <alpha-value>)',
        text: '#c9d1d9',       // Primary text
        muted: '#8b949e',      // Secondary/muted text
        status: {
          active: '#238636',
          expiring: '#d29922',
          expired: '#da3633',
          revoked: '#484f58'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
