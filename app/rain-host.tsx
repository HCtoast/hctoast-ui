"use client";

import { Rain } from "@/components/ui/rain";

import { useRainRender } from "./theme-control";

/* 쇼케이스: 보기 설정에서 "CSS" 를 고르면 <Rain /> 을 내려서 기본 설치판 빗줄기를 보여 준다.
   Rain 은 언마운트될 때 data-rain-canvas 를 떼므로 CSS 층이 바로 돌아온다 */
export function RainHost() {
  return useRainRender() === "css" ? null : <Rain />;
}
