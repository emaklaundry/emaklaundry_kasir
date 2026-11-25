/** @type {import('tailwindcss').Config} */
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const palette = (token) =>
  Object.fromEntries(
    shades.map((shade) => [shade, `rgb(var(--${token}-${shade}) / <alpha-value>)`]),
  );

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-blue': palette('color-accent'),
        blue: palette('color-action'),
        primary: palette('color-action'),
      },
    },
  },
  plugins: [],
};
