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
          primary: '#0a0d12',
          secondary: '#0f1419',
          tertiary: '#151b24',
          card: '#1a2129',
          cardHover: '#1f2833',
          elevated: '#232d3a',
        },
        accent: {
          primary: '#10b981',
          primaryHover: '#059669',
          primaryMuted: 'rgba(16, 185, 129, 0.15)',
          secondary: '#14b8a6',
        },
        severity: {
          critical: '#ef4444',
          criticalBg: 'rgba(239, 68, 68, 0.15)',
          high: '#f97316',
          highBg: 'rgba(249, 115, 22, 0.15)',
          medium: '#eab308',
          mediumBg: 'rgba(234, 179, 8, 0.15)',
          low: '#3b82f6',
          lowBg: 'rgba(59, 130, 246, 0.15)',
          info: '#6b7280',
          infoBg: 'rgba(107, 114, 128, 0.15)',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        border: {
          primary: '#2a3441',
          secondary: '#1e2733',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
