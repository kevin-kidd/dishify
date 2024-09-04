import React, { type ComponentType } from "react";
import { Platform } from "react-native";
import { cn } from ".";

type AnyProps = Record<string, any>;

// Define the higher-order component that can wrap any React Native component
// and map it to an HTML tag with the correct props for that tag.
export function withWebTag<
  P extends AnyProps, // Props type for the React Native component
  T extends keyof JSX.IntrinsicElements, // The tag name for the web component
>(
  Component: ComponentType<P>,
  tagName: T,
  baseClassName?: string
): ComponentType<P & React.ComponentProps<T>> {
  return ({ onPress, children, className, ...restProps }: P & React.ComponentProps<T>) => {
    const combinedClassName = cn(baseClassName, className);
    const handleClick = onPress
      ? () => {
          // Call the onPress event with the native event if needed.
          onPress();
        }
      : undefined;
    if (Platform.OS === "web") {
      const combinedProps = {
        ...restProps,
        onClick: handleClick,
        className: combinedClassName,
      };
      // Create an element with the appropriate tag name for the web.
      return React.createElement(tagName, combinedProps, children);
    }
    // For native, just spread the props and render the component.
    const nativeProps: unknown = {
      ...restProps,
      onPress,
      children,
      className: combinedClassName,
    };
    return <Component {...(nativeProps as P)}>{children}</Component>;
  };
}
