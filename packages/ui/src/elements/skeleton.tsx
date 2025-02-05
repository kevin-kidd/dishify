import { cn } from "../utils";

function Skeleton({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("animate-pulse bg-secondary rounded-md", className)} {...props} />;
}

export { Skeleton };
