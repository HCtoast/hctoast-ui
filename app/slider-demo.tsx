"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

/* 쇼케이스용 Slider 데모 — 손잡이 변형 5종 + 스냅 동작 */

const THUMBS = [
  { id: "dot", label: "dot · 원형 노브 (기본)" },
  { id: "pill", label: "pill · 세로 알약" },
  { id: "ring", label: "ring · 링" },
  { id: "bar", label: "bar · 얇은 바" },
  { id: "knob", label: "knob · 페이더" },
] as const;

export function SliderDemo() {
  const [values, setValues] = React.useState<Record<string, number>>({ dot: 30, pill: 45, ring: 60, bar: 70, knob: 55 });
  const [snap, setSnap] = React.useState(50);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {THUMBS.map((t) => (
          <div key={t.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`slider-${t.id}`}>{t.label}</Label>
              <span className="text-caption text-fg-muted">{values[t.id]}</span>
            </div>
            <Slider
              id={`slider-${t.id}`}
              thumb={t.id}
              value={[values[t.id]]}
              onValueChange={([v]) => setValues((s) => ({ ...s, [t.id]: v }))}
              aria-label={t.label}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="slider-snap">스냅 10 단위 · 값 표시</Label>
          <span className="text-caption text-fg-muted">{snap}</span>
        </div>
        <Slider
          id="slider-snap"
          snap={10}
          showValue
          value={[snap]}
          onValueChange={([v]) => setSnap(v)}
          aria-label="스냅 데모"
        />
        <p className="text-body-sm text-fg-muted">
          드래그 중엔 마우스를 그대로 따라오고, 놓으면 가까운 10 단위에 달라붙는다. 화살표는 10씩, Shift+화살표는 100씩.
        </p>
      </div>
    </div>
  );
}
