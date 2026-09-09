import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
