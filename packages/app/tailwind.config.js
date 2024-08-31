// This is a dummy tailwind config file used to provide intellisense.
// To configure your global tailwind settings, modify the imported theme object.
const { theme } = require("@dishify/ui/src/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,jsx,ts,tsx}"],
  theme: {
    ...theme,
  },
};
