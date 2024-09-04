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
    <View className="flex-1" style={theme}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <Button
          onPress={toggleColorScheme}
          className={cn(
            "bg-foreground rounded-md py-1 px-2 right-4 bottom-4 z-50",
            isWeb ? "fixed" : "absolute"
          )}
        >
          <Text className="text-xl">{appColorScheme === "dark" ? "🌙" : "🌞"}</Text>
        </Button>
      )}
    </View>
  );
};
