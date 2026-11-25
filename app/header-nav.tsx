"use client";

import * as React from "react";

/* 헤더 목차. 넘치면 가로 스크롤이 되는데, 마우스 휠은 세로만 굴러서 Shift 를 모르면 옆으로 못 간다.
   그래서 목차 위에서 굴린 세로 휠을 가로로 바꿔 준다: 위 → 왼쪽, 아래 → 오른쪽 (친구 피드백 2026-11-25).

   - 이미 가로 성분이 더 큰 입력(트랙패드 옆 쓸기·Shift+휠)은 손대지 않는다 — 브라우저가 알아서 한다.
   - 끝에 닿으면 가로채지 않고 페이지로 넘긴다. 헤더가 sticky 라 마우스가 늘 목차 위에 있을 수 있는데,
     끝에서도 막으면 그 자리에선 페이지가 안 내려간다.
   - Ctrl+휠은 확대라 건드리지 않는다.
   - React 의 onWheel 은 passive 로 붙어 preventDefault 가 안 먹는다 — 그래서 직접 { passive: false } 로 붙인다.
   - 부드러운 스크롤(behavior: "smooth")은 쓰지 않는다: 휠을 연달아 굴리면 앞 애니메이션이 끊기며 거리가 줄어든다. */

function useWheelToHorizontal(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      // deltaMode 1 = 줄 단위(Firefox), 2 = 페이지 단위
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;
      if ((dy < 0 && atStart) || (dy > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + dy));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}

export function HeaderNav({ items }: { items: { id: string; label: string }[] }) {
  const ref = React.useRef<HTMLElement>(null);
  useWheelToHorizontal(ref);
  return (
    <nav ref={ref} aria-label="목차" className="mx-auto max-w-4xl overflow-x-auto px-6 pb-3">
      <ul className="flex gap-4">
        {items.map((n) => (
          <li key={n.id}>
            <a
              href={`#${n.id}`}
              className="whitespace-nowrap text-body-sm text-fg-muted transition-base hover:text-fg"
            >
              {n.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
