import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Festival stage variants
        mainstage: "border-transparent bg-orange-500/20 text-orange-300 border-orange-500/30",
        altar: "border-transparent bg-purple-500/20 text-purple-300 border-purple-500/30",
        temple: "border-transparent bg-blue-500/20 text-blue-300 border-blue-500/30",
        valley: "border-transparent bg-green-500/20 text-green-300 border-green-500/30",
        warzone: "border-transparent bg-red-500/20 text-red-300 border-red-500/30",
        fire: "border-transparent bg-gradient-fire text-primary-foreground shadow-fire",
        gold: "border-transparent bg-accent/20 text-accent border-accent/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
