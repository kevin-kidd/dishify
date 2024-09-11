"use client";

import type React from "react";
import { useEffect } from "react";
import { View, Appearance, Text } from "react-native";
import { themes } from "@dishify/ui/src/theme/themes";
import useHasMounted from "app/utils/hooks/useHasMounted";
import { useAtom, useAtomValue } from "jotai";
import { appColorSchemeAtom, appThemeAtom } from "app/atoms/theme";
import { Button, cn } from "@dishify/ui";
import type { ColorSchemeVariant } from "app/utils/theme";
import { isWeb } from "@tamagui/constants";

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode => {
  const appTheme = useAtomValue(appThemeAtom);
  const [appColorScheme, setAppColorScheme] = useAtom(appColorSchemeAtom);
  const hasMounted = useHasMounted();
  function toggleColorScheme() {
    setAppColorScheme((prev) => (prev === "dark" ? "light" : "dark"));
  }
  useEffect(() => {
    const systemThemeChangeListener = Appearance.addChangeListener(() => {
      setAppColorScheme(Appearance.getColorScheme() as ColorSchemeVariant);
    });
    return () => {
      systemThemeChangeListener.remove();
    };
  }, [setAppColorScheme]);
  useEffect(() => {
    if (hasMounted && appColorScheme === "system") {
      setAppColorScheme(Appearance.getColorScheme() as ColorSchemeVariant);
    }
  }, [appColorScheme, hasMounted, setAppColorScheme]);
  const theme = themes[appTheme][appColorScheme === "system" ? "light" : appColorScheme];
  if (!hasMounted) return null; // Prevents flash of unstyled content
  return (
    <View className="flex-1" style={theme} id="theme-provider">
      {children}
      {process.env.NODE_ENV === "development" && (
        <Button
          onPress={toggleColorScheme}
          variant="default"
          size="icon"
          className={cn(
            "right-4 bottom-4 z-50 bg-primary web:hover:bg-primary/80 border border-border",
            isWeb ? "fixed" : "absolute"
          )}
        >
          <Text className="text-xl select-none">{appColorScheme === "dark" ? "🌙" : "🌞"}</Text>
        </Button>
      )}
    </View>
  );
};
