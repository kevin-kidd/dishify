import { Svg, Path, Circle } from "react-native-svg";

export function PiggyBank() {
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
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v12" />
      <Path d="M8 12h8" />
      <Path d="M12 8v8" />
    </Svg>
  );
}
