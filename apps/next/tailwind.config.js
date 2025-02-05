const { theme } = require("@dishify/ui/src/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "../../packages/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  important: "html",
  theme: {
    ...theme,
  },
  animations: {
    pulse: "pulse 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
  },
  plugins: [require("tailwindcss-animate")],
};
