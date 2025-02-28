import React from "react";
import { Path, Svg } from "react-native-svg";
import type { IconProps } from "../types";

export const Beef = ({ className, ...props }: IconProps) => {
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
      <Path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
      <Path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
      <Path d="M15 2v5h5" />
      <Path d="M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </Svg>
  );
};
