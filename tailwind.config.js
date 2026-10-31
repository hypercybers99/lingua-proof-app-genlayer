/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        notary: {
          bg: '#FBFBFA',
          paper: '#F5F5F0',
          ink: '#111827',
          muted: '#4B5563',
          line: '#E5E7EB',
          accent: '#0D6E6E',
          accentHover: '#0A5555',
          accentLight: '#E6F4F4',
          darkBg: '#0F1215',
          darkPaper: '#181C20',
          darkInk: '#F3F4F6',
          darkMuted: '#9CA3AF',
          darkLine: '#2D3339',
        }
      }
    },
  },
  plugins: [],
}
