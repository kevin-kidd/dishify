import { forwardRef } from "react";
import { Pressable } from "react-native";
import { cn } from "../utils";
import { cva, type VariantProps } from "class-variance-authority";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 w-10",
        sm: "h-9 w-9",
        lg: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface IconButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean;
}

const IconButton = forwardRef<React.ElementRef<typeof Pressable>, IconButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <Pressable
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
