import React from "react";
import { Path, Svg, Circle } from "react-native-svg";
import type { IconProps } from "../types";

export const Salad = ({ className, ...props }: IconProps) => {
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
      <Path d="M7 21h10" />
      <Path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
      <Path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" />
      <Path d="m13 12 4-4" />
      <Path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" />
    </Svg>
  );
};
