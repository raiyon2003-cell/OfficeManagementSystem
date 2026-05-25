import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "border-border text-foreground",
        success:
          "border-transparent bg-[#588157]/15 text-[#344e41] dark:bg-[#588157]/25 dark:text-[#a8d4a6]",
        warning:
          "border-transparent bg-[#b8860b]/15 text-[#7a5c08] dark:bg-[#d69e2e]/20 dark:text-[#f6e05e]",
        info:
          "border-transparent bg-[#28666e]/15 text-[#28666e] dark:bg-[#28666e]/25 dark:text-[#8ec8d4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
