// override react-native types with react-native-web types
import "react-native"

declare module "react-native" {
  interface PressableStateCallbackType {
    hovered?: boolean
    focused?: boolean
  }
  interface ViewStyle {
    transitionProperty?: string
    transitionDuration?: string
  }
  interface TextProps {
    accessibilityComponentType?: never
    accessibilityTraits?: never
    accessibilityLevel?: number
  }
  interface ViewProps {
    role?: string
    href?: string
    hrefAttrs?: {
      rel: "noreferrer"
      target?: "_blank"
    }
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
  }
}
