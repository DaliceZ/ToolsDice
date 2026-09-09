import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-40 w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-sm leading-6 outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 sm:min-h-48 sm:p-4",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
