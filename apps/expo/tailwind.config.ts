// @ts-expect-error - no types
import nativewind from "nativewind/preset";
import type { Config } from "tailwindcss";
import { theme } from "@dishify/ui/src/theme";

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  presets: [nativewind],
  content: ["../../packages/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    ...theme,
  },
} satisfies Config;
