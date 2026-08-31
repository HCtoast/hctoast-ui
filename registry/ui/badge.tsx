import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex h-5 items-center gap-2 whitespace-nowrap rounded-sm px-2 text-caption",
  {
    variants: {
      variant: {
        // soft — bg-inset / action-soft 위에 색 텍스트
        neutral: "bg-bg-inset text-fg-muted",
        action: "bg-action-soft text-action",
        success: "bg-bg-inset text-success",
        warning: "bg-bg-inset text-warning",
        danger: "bg-bg-inset text-danger",
        info: "bg-bg-inset text-info",
        // solid — 채도 높은 채움 위에 fg-on-solid
        "neutral-solid": "bg-fg text-bg",
        "action-solid": "bg-action text-fg-on-solid",
        "success-solid": "bg-success text-fg-on-solid",
        "warning-solid": "bg-warning text-fg-on-solid",
        "danger-solid": "bg-danger text-fg-on-solid",
        "info-solid": "bg-info text-fg-on-solid",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
