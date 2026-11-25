"use client";

import * as React from "react";

import { SliderField } from "@/components/ui/slider";

/* 타이포 스케일의 Display 줄 — 40~100px 로 키워 보는 미리보기 (친구 제안 2026-11-25).
   고운바탕은 윤곽선 글꼴이라 크기 상한이 없다. 40px 은 글꼴 한계가 아니라 text-display 토큰의 값이다.
   그래서 토큰은 그대로 두고 여기서만 인라인 style 로 크기를 바꾼다 — 사용처에서 크기를 고르는 기능이
   아니라 "더 크면 어떻게 보이나"를 보는 쇼케이스 장치다. 행간은 토큰 비율(48/40 = 1.2)을 그대로 따라간다.
   크게 쓸 일이 생기면 그때 text-display-xl 같은 토큰을 따로 만든다(임의 크기 금지 규칙). */

const MIN = 40;
const MAX = 100;

export function DisplaySizeDemo() {
  const [size, setSize] = React.useState(MIN);
  return (
    <div className="flex flex-col gap-4">
      {/* stack 배치 — 값 글자 폭(40px ↔ 100px)이 바뀌어도 트랙 폭이 안 흔들린다 */}
      <SliderField
        label="Display 크기 (토큰은 40)"
        format={(v) => `${v}px`}
        min={MIN}
        max={MAX}
        snap={4}
        value={[size]}
        onValueChange={([v]) => setSize(v)}
        aria-label="Display 크기"
      />
      <p
        className="text-display text-fg"
        style={size === MIN ? undefined : { fontSize: `${size}px`, lineHeight: 1.2 }}
      >
        Display · {size}
      </p>
    </div>
  );
}
