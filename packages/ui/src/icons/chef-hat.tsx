import React from "react";
import { Path, Svg } from "react-native-svg";
import type { IconProps } from "../types";

export const ChefHat = ({ className, ...props }: IconProps) => {
  return (
    <Svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <Path d="M6 17h12" />
    </Svg>
  );
};
