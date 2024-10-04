import * as React from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TextClassContext } from "./text";
import * as PopoverPrimitive from "@rn-primitives/popover";
import type { PositionedContentProps } from "@rn-primitives/types";
import type { ViewProps } from "react-native";
import { cn } from "../utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

type AdditionalContentProps = {
  portalHost?: string;
  container?: string;
  animationDuration?: number;
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

type PopoverContentProps = ViewProps &
  PositionedContentProps &
  AdditionalContentProps & {
    asChild?: boolean;
    onOpenAutoFocus?: (event: Event) => void;
  };

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      portalHost,
      container = "theme-provider",
      animationDuration = 200,
      ...props
    },
    ref,
  ) => {
    return (
      <PopoverPrimitive.Portal hostName={portalHost} container={document.getElementById(container)}>
        <PopoverPrimitive.Overlay
          style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}
        >
          <Animated.View entering={FadeIn.duration(animationDuration)} exiting={FadeOut}>
            <TextClassContext.Provider value="text-popover-foreground">
              <PopoverPrimitive.Content
                ref={ref}
                align={align}
                sideOffset={sideOffset}
                style={{
                  $$css: true,
                  className: cn(
                    "z-50 w-72 rounded-md web:cursor-auto border border-border bg-popover p-4 shadow-md shadow-foreground/5 web:outline-none web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2 web:animate-in web:zoom-in-95 web:fade-in-0",
                    className,
                  ),
                }}
                {...props}
              />
            </TextClassContext.Provider>
          </Animated.View>
        </PopoverPrimitive.Overlay>
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
