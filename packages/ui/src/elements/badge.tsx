"use client";

import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import { Text } from "./text";
import { cn } from "../utils";

export interface BadgeProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export function Badge({ children, className, variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";

  const variantStyles = {
    default: "bg-sage-100 text-sage-800 hover:bg-sage-200",
    outline: "border border-sage-200 text-sage-800 hover:bg-sage-100",
    secondary: "bg-sage-700 text-white hover:bg-sage-800",
  };

  return (
    <Pressable className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      <Text className="text-xs font-medium">{children}</Text>
    </Pressable>
  );
}
