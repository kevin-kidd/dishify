import React from "react";
import { Path, Svg } from "react-native-svg";
import type { IconProps } from "../types";

export const Knife = ({ className, ...props }: IconProps) => {
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
      <Path d="M2 22v-9c0-1.2.8-2.5 2.3-2.9L20 5c1-.3 2 .1 2.6.9.7.9.7 2 0 2.9l-7.4 9.2c-.3.4-.7.7-1.1.8L2 22" />
      <Path d="M5 22v-3" />
      <Path d="M10 22v-3" />
    </Svg>
  );
};
