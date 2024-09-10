import { TextLink as SolitoTextLink, type TextLinkProps } from "solito/link";
import { Text } from "./text";
import {
  H1 as ExpoH1,
  P as ExpoP,
  H2 as ExpoH2,
  H3 as ExpoH3,
  H4 as ExpoH4,
  Span as ExpoSpan,
  Strong as ExpoStrong,
  BlockQuote as ExpoBlockQuote,
  Code as ExpoCode,
} from "@expo/html-elements";
import { cn } from "../utils";
import type { TextProps } from "@expo/html-elements/build/primitives/Text";
import type { BlockQuoteProps } from "@expo/html-elements/build/elements/Text.types";

export const P = ({ className, children, ...rest }: TextProps) => (
  <ExpoP className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...rest}>
    {children}
  </ExpoP>
);

export const H1 = ({ className, children, ...rest }: TextProps) => (
  <ExpoH1
    className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}
    {...rest}
  >
    {children}
  </ExpoH1>
);

export const H2 = ({ className, children, ...rest }: TextProps) => (
  <ExpoH2
    className={cn(
      "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      className
    )}
    {...rest}
  >
    {children}
  </ExpoH2>
);

export const H3 = ({ className, children, ...rest }: TextProps) => (
  <ExpoH3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)} {...rest}>
    {children}
  </ExpoH3>
);

export const H4 = ({ className, children, ...rest }: TextProps) => (
  <ExpoH4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)} {...rest}>
    {children}
  </ExpoH4>
);

export const Span = ({ className, children, ...rest }: TextProps) => (
  <ExpoSpan className={cn("text-foreground", className)} {...rest}>
    {children}
  </ExpoSpan>
);

export const Strong = ({ className, children, ...rest }: TextProps) => (
  <ExpoStrong className={cn("font-bold text-foreground", className)} {...rest}>
    {children}
  </ExpoStrong>
);

export const BlockQuote = ({ className, children, ...rest }: BlockQuoteProps) => (
  <ExpoBlockQuote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...rest}>
    {children}
  </ExpoBlockQuote>
);

export const MutedText = ({ className, children, ...rest }: TextProps) => (
  <ExpoP className={cn("text-sm text-muted-foreground", className)} {...rest}>
    {children}
  </ExpoP>
);

export const InlineCode = ({ className, children, ...rest }: TextProps) => (
  <ExpoCode
    className={cn(
      "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      className
    )}
    {...rest}
  >
    {children}
  </ExpoCode>
);

/**
 * Solito's TextLink doesn't work directly since it has a textProps prop
 * By wrapping it in a function, we can forward style down properly.
 */

export const TextLink = ({
  className,
  children,
  ...rest
}: TextLinkProps & { className?: string }) => (
  <SolitoTextLink {...rest}>
    <Text className={className}>{children}</Text>
  </SolitoTextLink>
);
