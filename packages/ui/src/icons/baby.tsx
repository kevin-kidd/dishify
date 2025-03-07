import { Svg, Path, Circle } from "react-native-svg";

export function Baby() {
  return (
    <Svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="8" r="4" />
      <Path d="M12 12v8" />
      <Path d="M8 16h8" />
      <Path d="M6 20h12" />
    </Svg>
  );
}
