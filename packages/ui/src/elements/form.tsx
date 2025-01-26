import { Text, View } from "react-native";
import { withWebTag } from "../utils/web-tag";
import { cn } from "../utils";
import React from "react";
import type { ViewRef } from "@rn-primitives/types";

export const Form = withWebTag(View, "form");

export const Label = withWebTag(Text, "label", "text-sm font-semibold text-primary 2xl:text-base");

export const ErrorLabel = withWebTag(Text, "label", "text-xs text-red-500 2xl:text-sm");

export interface FormInputProps extends React.ComponentPropsWithoutRef<typeof View> {
  label?: string;
  optional?: boolean;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormInput = React.forwardRef<ViewRef, FormInputProps>(
  ({ label, optional, error, id, children, className, ...props }, ref) => {
    return (
      <View ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
        {label && (
          <Text
            nativeID={id ? `${id}-label` : undefined}
            className="text-sm native:text-base font-medium text-foreground"
          >
            {label}
            {optional && <Text className="text-muted-foreground"> (optional)</Text>}
          </Text>
        )}
        {children}
        {error && (
          <Text
            nativeID={id ? `${id}-error` : undefined}
            className="text-sm native:text-base text-destructive"
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

FormInput.displayName = "FormInput";
