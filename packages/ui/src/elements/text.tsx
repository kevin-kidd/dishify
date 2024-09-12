import * as React from "react";
import { cn } from "../utils";
import type { Text as RNText } from "react-native";
import { Span } from "./typography";

const TextClassContext = React.createContext<string | undefined>(undefined);

type TextProps = React.ComponentProps<typeof RNText> &
  React.HTMLAttributes<HTMLSpanElement> & {
    className?: string;
  };

const Text = ({ className, ...props }: TextProps) => {
  const textClass = React.useContext(TextClassContext);
  const combinedClassName = cn("text-base text-foreground web:select-text", textClass, className);
  return <Span {...props} className={combinedClassName} />;
};

Text.displayName = "Text";

export { Text, TextClassContext };
export type { TextProps };
