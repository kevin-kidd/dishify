import { cn } from "../utils";
import { Div } from "./layout";

function Skeleton({ className, ...props }: React.ComponentPropsWithoutRef<typeof Div>) {
  return <Div className={cn("animate-pulse bg-secondary rounded-md", className)} {...props} />;
}

export { Skeleton };
