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

const thumbVariants = cva("block transition-base hover:bg-hover", {
  variants: {
    thumb: {
      // 원형 노브 (기본)
      dot: "size-5 rounded-full border border-border-strong bg-surface-raised shadow-e1",
      // 세로 알약 — macOS 스타일
      pill: "h-6 w-3 rounded-full border border-border-strong bg-surface-raised shadow-e1",
      // 링 — 가운데가 비어 트랙 색이 비친다
      ring: "size-5 rounded-full border-2 border-action bg-bg",
      // 얇은 세로 바 — Material 3 스타일. 트랙보다 위로 튀어나온다
      bar: "h-7 w-1 rounded-full bg-action shadow-e1",
      // 페이더 노브 — 사각에 가운데 선
      knob: "relative h-6 w-4 rounded-sm border border-border-strong bg-surface-raised shadow-e1",
    },
  },
  defaultVariants: { thumb: "dot" },
});

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
  const fineStep = Math.min(unit / 20, 0.05);
  const [dragging, setDragging] = React.useState(false);
  const [inner, setInner] = React.useState<number[]>(defaultValue ?? [min]);
  const current = value ?? inner;
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
      onValueChange={emit}
      onValueCommit={(v) => {
        const snapped = v.map((x) => Math.min(max, Math.max(min, roundTo(x, unit, min))));
        setDragging(false);
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
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-bg-inset data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
      >
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

export { Slider, thumbVariants };
export type { SliderProps };
