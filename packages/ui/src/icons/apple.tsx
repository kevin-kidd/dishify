import { Svg, Path } from "react-native-svg";

export function Apple() {
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
      <Path d="M12 2C7.5 2 4 5.5 4 10c0 4.5 3.5 8 8 8s8-3.5 8-8c0-4.5-3.5-8-8-8z" />
      <Path d="M12 6v4" />
      <Path d="M12 14h.01" />
    </Svg>
  );
}
