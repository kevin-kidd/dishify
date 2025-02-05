"use client";

import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Platform } from "react-native";
import { useMedia } from "../../../utils/hooks/use-media";
import { useMemo } from "react";

export const Gauge = ({
  value,
  size = "small",
  changeColors = false,
}: {
  value: number;
  size: "small" | "medium" | "large";
  changeColors: boolean;
}) => {
  const media = useMedia();
  const isWeb = Platform.OS === "web";

  // Memoize the color calculation
  const color = useMemo(() => {
    if (!changeColors) return "#cc3333";
    if (value === 100) return "#45a557";
    if (value >= 50) return "#e3d53b";
    return "#cc3333";
  }, [value, changeColors]);

  // Memoize the sizes object to prevent unnecessary recalculations
  const sizes = useMemo(
    () => ({
      small: {
        size: isWeb ? (media.xxs ? 30 : media.sm ? 35 : 45) : media.xxs ? 25 : media.sm ? 30 : 35,
        width: isWeb
          ? media.xxs
            ? 3.75
            : media.sm
              ? 4.375
              : 5.625
          : media.xxs
            ? 3.125
            : media.sm
              ? 3.75
              : 4.375,
      },
      medium: {
        size: isWeb ? (media.xxs ? 50 : media.sm ? 60 : 70) : media.xxs ? 40 : media.sm ? 50 : 60,
        width: isWeb
          ? media.xxs
            ? 6.25
            : media.sm
              ? 7.25
              : 10
          : media.xxs
            ? 5
            : media.sm
              ? 6.25
              : 7.5,
      },
      large: {
        size: isWeb
          ? media.xxs
            ? 90
            : media.sm
              ? 120
              : 150
          : media.xxs
            ? 70
            : media.sm
              ? 90
              : 110,
        width: isWeb
          ? media.xxs
            ? 11.25
            : media.sm
              ? 15
              : 18.75
          : media.xxs
            ? 8.75
            : media.sm
              ? 11.25
              : 13.75,
      },
    }),
    [media.xxs, media.sm, isWeb],
  );

  return (
    <AnimatedCircularProgress
      size={sizes[size].size}
      width={sizes[size].width}
      fill={value}
      tintColor={color}
      backgroundColor="#acacac"
    />
  );
};
