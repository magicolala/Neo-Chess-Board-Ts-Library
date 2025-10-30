const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, './demo/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
