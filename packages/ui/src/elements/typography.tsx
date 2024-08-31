import { TextLink as SolitoTextLink, TextLinkProps } from "solito/link";
import { withWebTag } from "../utils/web-tag";
import { Text } from "./text";

export const P = withWebTag(Text, "p", "break-words text-foreground");

export const H1 = withWebTag(Text, "h1", "text-3xl font-extrabold text-foreground");

export const H2 = withWebTag(Text, "h2", "text-2xl font-bold text-foreground");

export const H3 = withWebTag(Text, "h3", "text-xl font-bold text-foreground");

export const H4 = withWebTag(Text, "h4", "text-lg font-bold text-foreground");

export const H5 = withWebTag(Text, "h5", "text-base font-bold text-foreground");

export const H6 = withWebTag(Text, "h6", "text-sm font-bold text-foreground");

export const Span = withWebTag(Text, "span", "text-foreground");

export const Strong = withWebTag(Text, "strong", "font-bold text-foreground");

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
