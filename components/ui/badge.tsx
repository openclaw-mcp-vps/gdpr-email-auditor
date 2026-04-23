import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-[#2f81f7]/40 bg-[#2f81f7]/10 text-[#6cb6ff]",
        success: "border-[#3fb950]/40 bg-[#3fb950]/10 text-[#3fb950]",
        warning: "border-[#d29922]/40 bg-[#d29922]/10 text-[#d29922]",
        danger: "border-[#f85149]/40 bg-[#f85149]/10 text-[#ff7b72]",
        neutral: "border-[#30363d] bg-[#0d1117] text-[#8b949e]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
