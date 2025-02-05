import { Platform } from "react-native";
import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

/**
 * Hook for responsive design breakpoints across web and mobile platforms
 * @returns Media query breakpoints based on screen width and platform
 */
export const useMedia = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  // For mobile devices, we want to use physical breakpoints
  // For web, we use standard responsive breakpoints
  return useMemo(
    () => ({
      xxs: isWeb ? width < 480 : width < 360,
      sm: isWeb ? width < 640 : width < 390,
      md: isWeb ? width < 768 : width < 430,
      lg: isWeb ? width < 1024 : width < 480,
      xl: isWeb ? width < 1280 : width < 540,
      xxl: isWeb ? width >= 1280 : width >= 540,
    }),
    [width, isWeb],
  );
};
