import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
