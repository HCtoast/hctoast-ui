import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/* 동그란 X — 무언가를 없애는 작은 버튼.
   corner: 부모(relative) 오른쪽 위 모서리에 반쯤 걸친다. 썸네일·카드·업로드 항목에.
   inline: 흐름 안에 그냥 놓인다. 칩·태그·검색어 안에.
   레이블은 필수 — "지우기"가 아니라 무엇을 지우는지("발코니 지우기"). */

const dismissVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full text-fg-muted transition-base hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      position: {
        corner: "absolute -right-2 -top-2 border border-border-strong bg-surface-raised shadow-e1",
        inline: "",
      },
      size: {
        sm: "size-6 [&_svg]:icon-sm",
        md: "size-8 [&_svg]:icon-md",
      },
    },
    defaultVariants: { position: "corner", size: "sm" },
  },
);

type DismissProps = Omit<React.ComponentProps<"button">, "aria-label" | "children"> &
  VariantProps<typeof dismissVariants> & {
    /** 무엇을 없애는지. 예: "발코니 지우기", "필터 해제" */
    "aria-label": string;
  };

function Dismiss({ className, position, size, type = "button", ...props }: DismissProps) {
  return (
    <button
      type={type}
      data-slot="dismiss"
      className={cn(dismissVariants({ position, size }), className)}
      {...props}
    >
      <X />
    </button>
  );
}

export { Dismiss, dismissVariants };
export type { DismissProps };
