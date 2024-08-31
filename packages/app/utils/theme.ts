import { themes } from "@dishify/ui/src/theme/themes";

export const ColorSchemeVariant = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

export type ColorSchemeVariant = keyof typeof ColorSchemeVariant;

export type ThemeVariant = keyof typeof themes;
