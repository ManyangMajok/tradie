/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#171219',
        surface: '#231e25',
        primary: '#AC5FDB',
        primaryLight: '#e5b4ff',
        secondary: '#f2affc',
        tertiary: '#dac84e',
        error: '#ffb4ab',
      },
    },
  },
  plugins: [],
};
