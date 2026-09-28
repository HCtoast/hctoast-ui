"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/* Radix Slider 래퍼.
   - 트랙 bg-bg-inset, 채워진 구간 action. 포커스 링은 전역 :focus-visible.
   - 스냅: 드래그 중엔 손잡이가 마우스를 부드럽게 따라오고(내부 step 은 잘게), 놓는 순간
     가장 가까운 `snap` 눈금으로 달라붙는다. 붙는 움직임만 transition-snap(left 120ms).
     키보드 화살표는 눈금 단위로 움직인다.
   - thumb 변형 5종. 값·범위는 사용처에서 controlled 로. */

/* 손잡이. 호버는 배경이 아니라 테두리/채움 색으로 — bg-hover 는 반투명이라 손잡이 바탕을
   덮어 비쳐 보인다. 불투명 바탕(surface-raised)은 항상 유지. */
const thumbVariants = cva("block transition-base", {
  variants: {
    thumb: {
      // 원형 노브 (기본)
      dot: "size-5 rounded-full border border-border-strong bg-surface-raised shadow-e1 hover:border-action",
      // 세로 알약 — macOS 스타일
      pill: "h-6 w-3 rounded-full border border-border-strong bg-surface-raised shadow-e1 hover:border-action",
      // 링 — 가운데는 지면색(불투명). 트랙이 비치지 않는다
      ring: "size-5 rounded-full border-2 border-action bg-bg hover:border-action-hover",
      // 얇은 세로 바 — Material 3 스타일. 트랙보다 위로 튀어나온다
      bar: "h-7 w-1 rounded-full bg-action shadow-e1 hover:bg-action-hover",
      // 페이더 노브 — 사각에 가운데 선
      knob: "relative h-6 w-4 rounded-sm border border-border-strong bg-surface-raised shadow-e1 hover:border-action",
    },
  },
  defaultVariants: { thumb: "dot" },
});

/* 트랙 좌우 안쪽 여백 = 손잡이 반 폭. Radix 는 손잡이를 트랙 안에 가두려고 양 끝에서 반 폭만큼
   밀기 때문에, 트랙을 같은 만큼 들여야 채워진 구간의 끝과 손잡이 중심이 정확히 겹친다.
   (8의 배수 규칙 예외 — 요소 사이 간격이 아니라 손잡이 기하에 종속된 값) */
const trackVariants = cva(
  "relative h-2 grow overflow-hidden rounded-full bg-bg-inset data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2",
  {
    variants: {
      thumb: {
        dot: "mx-2.5",
        pill: "mx-1.5",
        ring: "mx-2.5",
        bar: "mx-0.5",
        knob: "mx-2",
      },
    },
    defaultVariants: { thumb: "dot" },
  },
);

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> &
  VariantProps<typeof thumbVariants> & {
    /** 놓을 때 달라붙는 눈금. 기본 = step 또는 1 */
    snap?: number;
    /** 드래그·포커스 중 손잡이 위에 값을 띄운다 */
    showValue?: boolean | ((value: number) => string);
  };

function roundTo(v: number, unit: number, min: number) {
  return Math.round((v - min) / unit) * unit + min;
}

function Slider({
  className,
  thumb,
  snap,
  showValue,
  step,
  min = 0,
  max = 100,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  onKeyDown,
  ...props
}: SliderProps) {
  const unit = snap ?? step ?? 1;
  // 드래그 중엔 잘게, 스냅은 우리가 한다. 눈금이 1 이하면 그 1/20.
  const fineStep = Math.min(unit / 100, 0.01); // 픽셀보다 잘게 — 손잡이가 포인터에 붙어 움직인다
  const [dragging, setDragging] = React.useState(false);
  const [inner, setInner] = React.useState<number[]>(defaultValue ?? [min]);
  // 드래그 중 원시값. 부모가 controlled 로 반올림한 값을 돌려줘도 손잡이는 이걸 그린다.
  const [live, setLive] = React.useState<number[] | null>(null);
  const current = live ?? value ?? inner;
  const count = current.length;

  const emit = (v: number[]) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-dragging={dragging || undefined}
      min={min}
      max={max}
      step={fineStep}
      value={current}
      onValueChange={(v) => {
        if (dragging) setLive(v);
        emit(v);
      }}
      onValueCommit={(v) => {
        const snapped = v.map((x) => Math.min(max, Math.max(min, roundTo(x, unit, min))));
        setDragging(false);
        setLive(null);
        emit(snapped);
        onValueCommit?.(snapped);
      }}
      onPointerDown={() => setDragging(true)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        // 화살표는 눈금 단위. Radix 의 잘게 나눈 step 대신 우리가 움직인다.
        const dir =
          e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const idx = Number((e.target as HTMLElement).getAttribute("data-index") ?? 0);
        const big = e.shiftKey ? 10 : 1;
        const next = [...current];
        next[idx] = Math.min(max, Math.max(min, roundTo(next[idx] + dir * unit * big, unit, min)));
        emit(next);
        onValueCommit?.(next);
      }}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // 스냅 애니메이션: 드래그가 아닐 때만 손잡이 위치(left)를 잠깐 트랜지션
        "[&:not([data-dragging])_span:has(>[data-slot=slider-thumb])]:transition-snap",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={trackVariants({ thumb })}>
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-action data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: count }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          data-index={i}
          className={cn(thumbVariants({ thumb }), "group/thumb")}
        >
          {thumb === "knob" && (
            <span aria-hidden className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-fg-subtle" />
          )}
          {showValue && (
            <span
              data-slot="slider-value"
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-fg px-2 py-1 text-caption text-bg opacity-0 transition-base",
                "group-focus-visible/thumb:opacity-100",
                dragging && "opacity-100",
              )}
            >
              {typeof showValue === "function" ? showValue(current[i]) : current[i]}
            </span>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider, thumbVariants, trackVariants };
export type { SliderProps };
