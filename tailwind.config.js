/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'kiwali-coral': '#FF6B81',
        'kiwali-cream': '#FFFFFF',
        'kiwali-bg': '#FFFFFF',
        'kiwali-card': '#FFFFFF',
        'kiwali-ink': '#1C1917',
        'kiwali-muted': '#78716C',
        'kiwali-soft-pink': '#FFE4E8',
        'kiwali-soft-yellow': '#FEF3C7',
        'kiwali-soft-blue': '#E0F2FE',
        'kiwali-soft-purple': '#F3E8FF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        fredoka: ['"Fredoka"', 'cursive', 'sans-serif'],
        gaegu: ['"Gaegu"', 'cursive', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'float': 'float 3.6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
