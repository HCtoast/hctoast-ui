"use client";

import * as React from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

/* "배경만 보기" — <html data-peek> 하나로 헤더·본문·푸터를 숨기고(globals.css) 지면·조명·비만 남긴다.
   예전엔 조명 사진 선택기 안의 상태였고 night-city 에서만 됐다. 지금은 "보기 설정" 패널에서 켜는데
   패널은 켜는 순간 닫히며 언마운트되므로, 상태는 DOM 속성에 두고 돌아오기 바(PeekBar)는 페이지에 늘 둔다.
   비·햇살·라벤더 하늘도 배경이라 모든 테마에서 쓴다. */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-peek"] });
  return () => observer.disconnect();
}
const isPeeking = () => document.documentElement.hasAttribute("data-peek");

export function enterPeek() {
  document.documentElement.dataset.peek = "";
}
function exitPeek() {
  delete document.documentElement.dataset.peek;
}

export function PeekBar() {
  const peek = React.useSyncExternalStore(subscribe, isPeeking, () => false);
  React.useEffect(() => {
    if (!peek) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitPeek();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peek]);
  if (!peek) return null;
  return (
    <div data-slot="peek-bar" className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <Button variant="secondary" onClick={exitPeek}>
        <Eye /> 카드 다시 보기 (Esc)
      </Button>
    </div>
  );
}
