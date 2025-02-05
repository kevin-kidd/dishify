"use client";

import React, {
  type ComponentType,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type PropsWithoutRef,
} from "react";
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
  baseClassName?: string,
): ComponentType<P & React.ComponentProps<T>> {
  const WithWebTag = React.forwardRef<HTMLElement, P & React.ComponentProps<T>>(
    ({ onPress, children, className, onClick, ...restProps }, ref) => {
      const combinedClassName = cn(baseClassName, className);

      if (Platform.OS === "web") {
        const combinedProps = {
          ...restProps,
          onClick: onClick || onPress,
          className: combinedClassName,
          ref,
        };
        return React.createElement(tagName, combinedProps, children);
      }

      const nativeProps: unknown = {
        ...restProps,
        onPress,
        children,
        className: combinedClassName,
        ref,
      };
      return <Component {...(nativeProps as P)}>{children}</Component>;
    },
  );

  WithWebTag.displayName = `WithWebTag(${Component.displayName || Component.name || "Component"})`;
  return WithWebTag as ComponentType<P & React.ComponentProps<T>>;
}
