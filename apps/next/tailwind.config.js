const { theme } = require("@dishify/ui/src/theme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx,ts,tsx}", "../../packages/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  important: "html",
  theme: {
    ...theme,
  },
}
