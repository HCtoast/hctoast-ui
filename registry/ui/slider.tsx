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

/* 정렬 기하. Radix 는 손잡이를 루트 안에 가두려고 양 끝에서 반 폭만큼 민다. 그래서
   (1) 트랙을 반 폭만큼 들여야 채움 끝과 손잡이 중심이 겹치고,
   (2) 루트를 같은 만큼 음수 마진으로 내밀어야 트랙이 옆 글자 열과 같은 폭이 된다.
   결과: 트랙 = 글자 열, 손잡이만 양 끝에서 반 폭 튀어나온다 (네이티브 슬라이더와 같다).
   (8의 배수 규칙 예외 — 요소 사이 간격이 아니라 손잡이 기하에 종속된 값) */
const rootVariants = cva(
  // width 는 auto 로 둔다 — 블록 박스는 음수 마진만큼 저절로 넓어진다 (임의값 calc 불필요)
  "relative flex touch-none select-none items-center data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      thumb: {
        dot: "-mx-2.5",
        pill: "-mx-1.5",
        ring: "-mx-2.5",
        bar: "-mx-0.5",
        knob: "-mx-2",
      },
    },
    defaultVariants: { thumb: "dot" },
  },
);
/* inline 배치에서 슬라이더 칸의 안쪽 여백 = 손잡이 반 폭. 루트의 음수 마진을 상쇄해 손잡이가
   칸 밖으로 못 나가게 한다 → 양 끝에서도 옆 라벨·값과의 gap-4 가 온전히 남는다. */
const inlineCellPad: Record<NonNullable<VariantProps<typeof thumbVariants>["thumb"]>, string> = {
  dot: "px-2.5",
  pill: "px-1.5",
  ring: "px-2.5",
  bar: "px-0.5",
  knob: "px-2",
};

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
        rootVariants({ thumb }),
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

/* 라벨·값·슬라이더를 한 덩어리로. 사용처가 줄을 손으로 짜면 트랙과 글자 열이 어긋날 수 있어서,
   슬라이더는 이걸로 쓴다.
   - stack(기본): 라벨 줄(라벨 왼쪽, 값 오른쪽) 위, 트랙 아래. 트랙 = 라벨 줄과 같은 열.
   - inline: 라벨 · 트랙 · 값이 한 줄. 라벨은 내용 폭, 트랙이 남는 폭을 다 쓴다.
   라벨도 값도 없으면 윗줄 자체를 그리지 않는다 — 빈 줄·빈 간격이 남지 않는다.
   값 표시는 format 으로, 보조 문구(최대값 등)는 hint 로, 끄려면 showValueText={false}. */
type SliderFieldProps = SliderProps & {
  label?: React.ReactNode;
  /** 값 → 표시 문자열. 기본 그대로 */
  format?: (value: number) => string;
  /** 값 옆 보조 문구. 예: "최대 40%" */
  hint?: React.ReactNode;
  /** 값 텍스트 표시 여부. 기본 true */
  showValueText?: boolean;
  /** 라벨 아래 설명 */
  description?: React.ReactNode;
  /** stack(기본) | inline(라벨 왼쪽, 값 오른쪽, 한 줄) */
  layout?: "stack" | "inline";
  id?: string;
};

function SliderField({
  label,
  format,
  hint,
  showValueText = true,
  description,
  layout = "stack",
  id,
  className,
  value,
  defaultValue,
  ...props
}: SliderFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const shown = (value ?? defaultValue ?? [props.min ?? 0])[0];
  const valueText = showValueText ? (
    <span className="shrink-0 text-caption text-fg-muted">
      {format ? format(shown) : shown}
      {hint && <> · {hint}</>}
    </span>
  ) : null;
  const labelEl = label ? (
    <label htmlFor={fieldId} className="shrink-0 text-label text-fg">
      {label}
    </label>
  ) : null;
  const slider = <Slider id={fieldId} value={value} defaultValue={defaultValue} {...props} />;

  if (layout === "inline") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-4">
          {labelEl}
          {/* min-w-0 — flex 자식이 트랙 최소 폭 때문에 줄을 밀어내지 않게.
              안쪽 여백은 손잡이 반 폭 — 손잡이가 라벨·값 쪽으로 침범하지 않는다 */}
          <div className={cn("min-w-0 flex-1", inlineCellPad[props.thumb ?? "dot"])}>{slider}</div>
          {valueText}
        </div>
        {description && <p className="text-body-sm text-fg-muted">{description}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(labelEl || valueText) && (
        <div className={cn("flex items-center gap-4", labelEl ? "justify-between" : "justify-end")}>
          {labelEl}
          {valueText}
        </div>
      )}
      {slider}
      {description && <p className="text-body-sm text-fg-muted">{description}</p>}
    </div>
  );
}

export { Slider, SliderField, thumbVariants, trackVariants };
export type { SliderProps, SliderFieldProps };
