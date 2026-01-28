/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // 70% - Base
          paper: '#F4F5F2',
          
          // 30% - Surface (Structure)
          iron: {
            DEFAULT: '#1B2A27',
            hover: '#2D3D3A',
            active: '#3E4E4B'
          },
          
          // 10% - Primary Action
          clay: {
            DEFAULT: '#E65D2E',
            hover: '#CC4D20',
            active: '#B3401A'
          },

          // Code/Technical Background
          sage: '#E8EDEA',
          
          // Semantic Colors (OWASP Mapped)
          critical: '#D32F2F', // Deep Red
          warning: '#FF9500',  // Safety Orange
          info: '#316263',    // Deep Teal
          success: '#416D5A', // Muted Moss
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        },
        boxShadow: {
          'hard': '2px 2px 0px 0px rgba(0,0,0,0.15)',
          'hard-sm': '1px 1px 0px 0px rgba(0,0,0,0.15)',
        },
        borderRadius: {
          'DEFAULT': '0.25rem', // sm/md
          'md': '0.375rem',
          'lg': '0.5rem',
        }
      },
    },
    plugins: [],
  }
