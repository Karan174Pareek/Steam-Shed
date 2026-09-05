/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'shed-base': '#E4DCCB',
        'shed-raised': '#EDE6D6',
        'base-raised': '#EDE6D6',
        'shadow-dark': '#A89A7C',
        'shadow-light': '#FFFDF6',
        'accent-iron': '#2D2824',
        'accent-iron-muted': '#524B43',
        'accent-brass': '#9C7A3C',
        'accent-brass-dark': '#7A5B22',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neu-raised': '6px 6px 14px #A89A7C, -6px -6px 14px #FFFDF6',
        'neu-raised-sm': '3px 3px 8px #A89A7C, -3px -3px 8px #FFFDF6',
        'neu-inset': 'inset 4px 4px 8px #A89A7C, inset -4px -4px 8px #FFFDF6',
        'neu-inset-sm': 'inset 2px 2px 5px #A89A7C, inset -2px -2px 5px #FFFDF6',
      }
    },
  },
  plugins: [],
}
