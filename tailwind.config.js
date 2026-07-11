/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          hover:     'rgb(var(--brand-hover-rgb) / <alpha-value>)',
          secondary: '#D9B382',
        },
        app: {
          bg:      'rgb(var(--app-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--app-surface-rgb) / <alpha-value>)',
          border:  'rgb(var(--app-border-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          muted:   'rgb(var(--ink-muted-rgb) / <alpha-value>)',
        },
        positive:  '#6D9E7F',
        caution:   '#D9A441',
        danger:    '#C8645B',
        accent:    '#7B9CBF',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
};
