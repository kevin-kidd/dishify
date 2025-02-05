import { forwardRef } from "react";
import { Svg, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";

export const Microsoft = forwardRef<Svg, SvgProps>(({ className, ...props }, ref) => (
  <Svg
    ref={ref}
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path d="M11.4 2H2V11.4H11.4V2Z" fill="#F25022" />
    <Path d="M11.4 12.6H2V22H11.4V12.6Z" fill="#00A4EF" />
    <Path d="M22 2H12.6V11.4H22V2Z" fill="#7FBA00" />
    <Path d="M22 12.6H12.6V22H22V12.6Z" fill="#FFB900" />
  </Svg>
));
