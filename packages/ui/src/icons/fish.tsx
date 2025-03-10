import { Svg, Path } from "react-native-svg";
import type { IconProps } from "../types";

export function Fish({ className, ...props }: IconProps) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M2 15c1.833-2.667 6.8-8 12-8 .923 0 1.754.105 2.5.287M2 9c1.833 2.667 6.8 8 12 8 .923 0 1.754-.105 2.5-.287m0 0C19.96 15.87 22 12 22 12s-2.04-3.87-5.5-4.713m0 9.426c-1-1.546-2.4-5.597 0-9.426M12 10.5c-.5.5-1.2 1.8 0 3m6-2.5h.001"
      />
    </Svg>
  );
}
