/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#9e2a2b',
          600: '#7f1d1d',
          700: '#651515',
          800: '#4c1010',
          900: '#330a0a',
        },
        gold: {
          50: '#fcfaf2',
          100: '#f8f4df',
          200: '#efe5ba',
          300: '#e4d391',
          400: '#d8be65',
          500: '#c5a038',
          600: '#a6802a',
          700: '#846022',
        }
      },
    },
  },
  plugins: [],
}
