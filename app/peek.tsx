"use client";

import * as React from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

/* "배경만 보기" — <html data-peek> 하나로 헤더·본문·푸터를 숨기고(globals.css) 지면·조명·비만 남긴다.
   켜고 끄는 건 보기 설정 창의 토글. 창은 본문 밖(body 포털)이라 배경만 보기 중에도 떠 있어서, 배경을 보며
   바로 조절할 수 있다(사용자 요청 2026-11-25). 창을 닫았다면 PeekBar 가 돌아오기 버튼을 띄운다.
   비·햇살·라벤더 하늘도 배경이라 모든 테마에서 쓴다. */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-peek"] });
  return () => observer.disconnect();
}
export const isPeeking = () => document.documentElement.hasAttribute("data-peek");

export function usePeek() {
  return React.useSyncExternalStore(subscribe, isPeeking, () => false);
}
export function exitPeek() {
  delete document.documentElement.dataset.peek;
}
export function togglePeek() {
  if (isPeeking()) exitPeek();
  else document.documentElement.dataset.peek = "";
}

/** 배경만 보기 중인데 보기 설정 창이 닫혀 있을 때의 돌아오기 버튼. Esc 로도 돌아온다 */
export function PeekBar() {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitPeek();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div data-slot="peek-bar" className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <Button variant="secondary" onClick={exitPeek}>
        <Eye /> 카드 다시 보기 (Esc)
      </Button>
    </div>
  );
}
