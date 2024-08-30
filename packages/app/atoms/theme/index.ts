import { atomWithMMKV } from "app/provider/kv"
import { ColorSchemeVariant, ThemeVariant } from "app/utils/theme"

export const appThemeKey = "appTheme"

export const appThemeAtom = atomWithMMKV<ThemeVariant>(appThemeKey, "default")

export const appColorSchemeKey = "appColorScheme"

export const appColorSchemeAtom = atomWithMMKV<ColorSchemeVariant>(appColorSchemeKey, "system")
