
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#f29100',
          600: '#d98200',
        }
      }
    },
  },
  plugins: [],
}
