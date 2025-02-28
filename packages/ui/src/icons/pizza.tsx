import React from "react";
import { Path, Svg } from "react-native-svg";
import type { IconProps } from "../types";

export const Pizza = ({ className, ...props }: IconProps) => {
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
      <Path d="M15 11h.01" />
      <Path d="M11 15h.01" />
      <Path d="M16 16h.01" />
      <Path d="m2 16 20 6-6-20c-3.36.9-6.42 2.61-8.88 5.07A19.99 19.99 0 0 0 2 16z" />
      <Path d="M17 6c-6.29 1.47-11.36 6.54-12.82 12.83" />
    </Svg>
  );
};
