/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f0f3ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#1e3a5f', 600: '#1a3352', 700: '#152b45', 800: '#0f2138', 900: '#0a1628' },
        brand: { red: '#dc2626', navy: '#1e3a5f', light: '#f8fafc' }
      }
    }
  },
  plugins: []
};
