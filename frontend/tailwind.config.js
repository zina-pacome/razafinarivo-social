/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c0cfff',
          300: '#93adff',
          400: '#6085ff',
          500: '#3a5fff',
          600: '#2440f5',
          700: '#1c30e0',
          800: '#1e2cb5',
          900: '#1e298f',
        },
        family: {
          gold: '#C9A84C',
          dark: '#1a1a2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}