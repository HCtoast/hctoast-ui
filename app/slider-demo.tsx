"use client";

import * as React from "react";

import { SliderField } from "@/components/ui/slider";

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
  const [inline, setInline] = React.useState(40);
  const [bare, setBare] = React.useState(25);

  return (
    <div className="flex flex-col gap-6">
      {/* 슬라이더를 가로로 나란히 둘 땐 열 사이 26px 이상(손잡이 돌출 10 + 간격 16). 척도에서는 gap-10 */}
      <div className="grid gap-10 sm:grid-cols-2">
        {THUMBS.map((t) => (
          <SliderField
            key={t.id}
            id={`slider-${t.id}`}
            label={t.label}
            thumb={t.id}
            value={[values[t.id]]}
            onValueChange={([v]) => setValues((s) => ({ ...s, [t.id]: v }))}
            aria-label={t.label}
          />
        ))}
      </div>
      <SliderField
        id="slider-snap"
        label="스냅 10 단위 · 값 표시"
        snap={10}
        showValue
        value={[snap]}
        onValueChange={([v]) => setSnap(v)}
        aria-label="스냅 데모"
        description="드래그 중엔 마우스를 그대로 따라오고, 놓으면 가까운 10 단위에 달라붙는다. 화살표는 10씩, Shift+화살표는 100씩. 라벨·값·트랙은 SliderField 가 한 열로 맞춘다."
      />
      <SliderField
        id="slider-inline"
        layout="inline"
        label="inline · 라벨 왼쪽"
        format={(v) => `${v}%`}
        value={[inline]}
        onValueChange={([v]) => setInline(v)}
        aria-label="인라인 데모"
      />
      <SliderField
        id="slider-bare"
        showValueText={false}
        value={[bare]}
        onValueChange={([v]) => setBare(v)}
        aria-label="라벨·값 없는 슬라이더"
        description="라벨도 값도 없으면 윗줄을 그리지 않는다 — 트랙 위에 빈 간격이 없다."
      />
    </div>
  );
}
