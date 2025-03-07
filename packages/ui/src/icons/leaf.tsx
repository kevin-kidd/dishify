import { Svg, Path } from "react-native-svg";

export function Leaf() {
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
      <Path d="M12 2C7 2 4 6 4 10c0 4 3 8 8 8s8-4 8-8c0-4-3-8-8-8z" />
      <Path d="M12 6v8" />
      <Path d="M8 10h8" />
      <Path d="M8 14h8" />
    </Svg>
  );
}
