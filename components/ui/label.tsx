import * as React from "react";

import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, ...props }, ref) => (
    <label
      ref={ref}
      aria-required={required || undefined}
      className={cn(
        "text-sm font-medium leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        required && "after:ml-1 after:text-red-500 after:content-['*']",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
