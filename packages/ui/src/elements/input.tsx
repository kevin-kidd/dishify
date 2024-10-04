import * as React from "react";
import { TextInput as RNTextInput } from "react-native";
import { cn } from "../utils";
import { isWeb } from "@tamagui/constants";

const TextInput = React.forwardRef<
  React.ElementRef<typeof RNTextInput>,
  React.ComponentPropsWithoutRef<typeof RNTextInput> & { onChange: (text: string) => void }
>(({ className, placeholderClassName, onChange, ...props }, ref) => {
  const changeTextProp = isWeb
    ? { onChange: (e: any) => onChange(e.target.value) }
    : { onChangeText: (text: string) => onChange(text) };
  return (
    <RNTextInput
      ref={ref}
      {...changeTextProp}
      className={cn(
        "web:flex h-10 native:h-12 web:w-full rounded-md border border-input bg-background px-3 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
        props.editable === false && "opacity-50 web:cursor-not-allowed",
        className,
      )}
      placeholderClassName={cn("text-muted-foreground", placeholderClassName)}
      {...props}
    />
  );
});

TextInput.displayName = "TextInput";

export { TextInput };
