/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          industrial: {
            base: '#F4F5F2',      // Background
            surface: '#1B2A27',   // Sidebar/Nav
            'surface-hover': '#2D3D3A',
            action: '#E65D2E',    // Primary Buttons
            'action-hover': '#CF4A1D',
            border: '#D1D5DB',
            card: '#FFFFFF',
            code: '#E8EDEA',      // Spec viewer background
          },
          severity: {
            critical: '#D32F2F', // Deep Red
            high: '#FF9500',     // Safety Orange
            medium: '#316263',   // Deep Teal
            low: '#5E8079',      // Moss
            success: '#416D5A',  // Forest
          }
        },
        borderRadius: {
          'industrial': '2px', // Sharper corners for enterprise feel
        }
      },
    },
    plugins: [],
  }
