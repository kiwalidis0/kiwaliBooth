/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      colors: {
        'theme-primary': 'rgb(var(--theme-primary-rgb, 255 107 129) / <alpha-value>)',
        'theme-hover': 'var(--theme-primary-hover, #FF526C)',
        'theme-soft': 'rgb(var(--theme-soft-rgb, 255 228 232) / <alpha-value>)',
        'theme-border': 'var(--theme-primary-border, rgba(255, 107, 129, 0.4))',
        'kiwali-coral': 'rgb(var(--theme-primary-rgb, 255 107 129) / <alpha-value>)',
        'kiwali-soft-pink': 'rgb(var(--theme-soft-rgb, 255 228 232) / <alpha-value>)',
        'kiwali-cream': '#FFFFFF',
        'kiwali-bg': '#FFFFFF',
        'kiwali-card': '#FFFFFF',
        'kiwali-ink': '#000000',
        'kiwali-muted': '#52525B',
        'kiwali-soft-yellow': '#FEF3C7',
        'kiwali-soft-blue': '#E0F2FE',
        'kiwali-soft-purple': '#F3E8FF',
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
        fredoka: ['"Fredoka"', 'cursive', 'sans-serif'],
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
