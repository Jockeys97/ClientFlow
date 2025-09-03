/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        reply: {
          50: '#EFFCF4',
          100: '#D6F7E5',
          200: '#ADEFD0',
          300: '#7EE4B6',
          400: '#4CD699',
          500: '#00A651', // Brand primary
          600: '#008F46',
          700: '#00753B',
          800: '#005C30',
          900: '#004D2A',
          DEFAULT: '#00A651',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '1.5rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2.5rem',
        },
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};


