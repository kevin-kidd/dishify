import type { ColorSchemeVariant, ThemeVariant } from "app/utils/theme";
import { atomWithStorage } from "jotai/utils";

export const appThemeKey = "appTheme";

export const appThemeAtom = atomWithStorage<ThemeVariant>(appThemeKey, "default");

export const appColorSchemeKey = "appColorScheme";

export const appColorSchemeAtom = atomWithStorage<ColorSchemeVariant>(appColorSchemeKey, "system");
