/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",  // make sure Tailwind scans your React files
    ],
    theme: {
      extend: {
        colors: {
          'primary': {
            DEFAULT: '#618264',
            'dark': '#618264',
            'medium': '#79AC78',
            'light': '#B0D9B1',
            'subtle': '#D0E7D2',
          }
        }
      },
    },
    plugins: [],
  }