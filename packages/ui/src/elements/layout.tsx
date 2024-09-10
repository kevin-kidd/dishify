import { View } from "react-native";
import { withWebTag } from "../utils/web-tag";
import { UL as ExpoUL, LI as ExpoLI } from "@expo/html-elements";
import type { ViewProps } from "@expo/html-elements/build/primitives/View";
import { cn } from "../utils";
import {
  Section as ExpoSection,
  Main as ExpoMain,
  Div as ExpoDiv,
  Header as ExpoHeader,
  Footer as ExpoFooter,
  Nav as ExpoNav,
} from "@expo/html-elements";

/* Lists */
export const UL = ({ className, children, ...rest }: ViewProps) => (
  <ExpoUL className={cn("list-disc list-inside", className)} {...rest}>
    {children}
  </ExpoUL>
);
export const LI = ExpoLI;
export const OL = withWebTag(View, "ol", "list-decimal list-inside");

/* Sections */
export const Section = ({ className, children, ...rest }: ViewProps) => (
  <ExpoSection className={cn("flex flex-col gap-6", className)} {...rest}>
    {children}
  </ExpoSection>
);
export const Main = ({ className, children, ...rest }: ViewProps) => (
  <ExpoMain className={cn("flex flex-col gap-6", className)} {...rest}>
    {children}
  </ExpoMain>
);
export const Header = ({ className, children, ...rest }: ViewProps) => (
  <ExpoHeader className={cn("flex flex-col gap-6", className)} {...rest}>
    {children}
  </ExpoHeader>
);
export const Footer = ({ className, children, ...rest }: ViewProps) => (
  <ExpoFooter className={cn("flex flex-col gap-6", className)} {...rest}>
    {children}
  </ExpoFooter>
);
export const Nav = ({ className, children, ...rest }: ViewProps) => (
  <ExpoNav className={cn("flex flex-col gap-6", className)} {...rest}>
    {children}
  </ExpoNav>
);

/* Containers */
export const Div = ({ children, ...rest }: ViewProps) => <ExpoDiv {...rest}>{children}</ExpoDiv>;
