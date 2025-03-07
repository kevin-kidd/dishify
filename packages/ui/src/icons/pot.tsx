import { Svg, Path } from "react-native-svg";

export function Pot() {
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
      <Path d="M8 4h8v16H8z" />
      <Path d="M4 8h16" />
      <Path d="M4 16h16" />
    </Svg>
  );
}
