import * as React from "react";

import { cn } from "@/lib/cn";

/* 여러 문구 중 하나를 보여주되, 상자는 항상 가장 긴 문구의 크기를 차지한다.
   "비 켜짐" ↔ "비 꺼짐", "저장" ↔ "저장 중…" 처럼 상태에 따라 글자가 바뀌는 자리에 쓴다.
   후보를 전부 같은 그리드 칸에 겹쳐 두고 현재 것만 보이게 한다 — 그래서 상태가 바뀌어도
   옆 요소가 밀리거나 특정 폭에서 줄바꿈이 튀지 않는다.
   토글·스위치와 문구를 한 세트로 다룰 때, 문구 쪽을 이걸로 감싼다.
   짧은 문구가 나올 때 빈 공간이 어디로 갈지는 align 으로 정한다: 고정된 쪽(토글)에 글자를 붙이고
   빈 공간은 유연한 쪽(라벨과의 사이)으로 보낸다. 토글이 오른쪽이면 align="end". */

type FixedLabelProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** 지금 보여줄 문구. options 에 있어야 한다 */
  value: string;
  /** 나올 수 있는 문구 전부. 가장 긴 것이 상자 크기를 정한다 */
  options: readonly string[];
  /** 짧은 문구를 상자 안 어느 쪽에 붙일지. 토글이 오른쪽에 있으면 "end" — 빈 공간이 라벨 쪽으로 간다. 기본 start */
  align?: "start" | "end";
};

function FixedLabel({ value, options, align = "start", className, ...props }: FixedLabelProps) {
  return (
    <span data-slot="fixed-label" className={cn("inline-grid", className)} {...props}>
      {options.map((o) => (
        <span
          key={o}
          aria-hidden={o !== value || undefined}
          className={cn(
            "col-start-1 row-start-1 whitespace-nowrap",
            align === "end" ? "text-right" : "text-left",
            o !== value && "invisible",
          )}
        >
          {o}
        </span>
      ))}
    </span>
  );
}

export { FixedLabel };
export type { FixedLabelProps };
