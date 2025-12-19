/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 👈 REQUIRED FOR DARK MODE
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
