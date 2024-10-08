// override react-native types with react-native-web types
import "react-native";

declare module "react-native" {
  interface PressableStateCallbackType {
    hovered?: boolean;
    focused?: boolean;
  }
  interface ViewStyle {
    transitionProperty?: string;
    transitionDuration?: string;
    $$css?: boolean;
    className?: string;
  }
  interface TextProps {
    accessibilityComponentType?: never;
    accessibilityTraits?: never;
    accessibilityLevel?: number;
    href?: string;
    hrefAttrs?: {
      rel: "noreferrer";
      target?: "_blank";
    };
  }
  interface ViewProps {
    role?: string;
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  }
}
