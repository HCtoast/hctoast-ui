"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

const THEMES = ["day", "night", "night-city", "night-city-b", "night-city-c", "night-lavender"] as const; // night-city-b/c 는 임시 후보
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = "hctoast-theme";

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "night" || t === "night-city" || t === "night-city-b" || t === "night-city-c" || t === "night-lavender" ? t : "day";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 저장 실패는 무시 — 세션 한정으로 동작
  }
}

export function ThemeControl() {
  // DOM 의 data-theme 을 외부 스토어로 읽는다. layout 의 인라인 스크립트가 먼저 세팅한다.
  const theme = React.useSyncExternalStore(
    subscribe,
    currentTheme,
    () => "day" as Theme,
  );

  return (
    <div className="flex gap-2" role="group" aria-label="테마 선택">
      {THEMES.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={t === theme ? "primary" : "secondary"}
          aria-pressed={t === theme}
          onClick={() => applyTheme(t)}
        >
          {t}
        </Button>
      ))}
    </div>
  );
}
