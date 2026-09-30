"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SliderField } from "@/components/ui/slider";

const THEMES = ["day", "night", "night-city", "night-lavender"] as const;
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = "hctoast-theme";
const WEATHER_KEY = "hctoast-weather";

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "night" || t === "night-city" || t === "night-lavender" ? t : "day";
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

/** DOM 의 data-theme 을 외부 스토어로 읽는다. layout 의 인라인 스크립트가 먼저 세팅한다. */
export function useTheme(): Theme {
  return React.useSyncExternalStore(subscribe, currentTheme, () => "day" as Theme);
}

/* 날씨 수정자(비) — <html data-weather="rain">. 테마와 직교 */
function currentRain() {
  return document.documentElement.dataset.weather === "rain";
}
function subscribeWeather(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-weather"] });
  return () => observer.disconnect();
}
export function useRain(): boolean {
  return React.useSyncExternalStore(subscribeWeather, currentRain, () => false);
}
function applyRain(on: boolean) {
  if (on) document.documentElement.dataset.weather = "rain";
  else delete document.documentElement.dataset.weather;
  try {
    if (on) localStorage.setItem(WEATHER_KEY, "rain");
    else localStorage.removeItem(WEATHER_KEY);
  } catch {
    // 저장 실패는 무시
  }
}

export function WeatherControl() {
  const rain = useRain();
  return (
    <Button
      size="sm"
      variant={rain ? "primary" : "secondary"}
      aria-pressed={rain}
      onClick={() => applyRain(!rain)}
    >
      비
    </Button>
  );
}

/* 비 표현 — <html data-rain-fx="streaks|glass">. night-city 에서만 의미 있다(유리 물방울은 사진 텍스처가 필요).
   실제로 캔버스가 돌 때는 RainGlass 가 data-rain-glass 를 따로 건다 */
const FX_KEY = "hctoast-rain-fx";
export type RainFx = "streaks" | "glass";
function currentFx(): RainFx {
  return document.documentElement.dataset.rainFx === "glass" ? "glass" : "streaks";
}
function subscribeFx(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rain-fx"] });
  return () => observer.disconnect();
}
export function useRainFx(): RainFx {
  return React.useSyncExternalStore(subscribeFx, currentFx, () => "streaks" as RainFx);
}
function applyFx(fx: RainFx) {
  if (fx === "glass") document.documentElement.dataset.rainFx = "glass";
  else delete document.documentElement.dataset.rainFx;
  try {
    if (fx === "glass") localStorage.setItem(FX_KEY, fx);
    else localStorage.removeItem(FX_KEY);
  } catch {
    // 저장 실패는 무시
  }
}
const FX_OPTIONS: { id: RainFx; label: string }[] = [
  { id: "streaks", label: "빗줄기" },
  { id: "glass", label: "유리 물방울" },
];
export function RainFxControl() {
  const fx = useRainFx();
  return (
    <div className="flex gap-2" role="group" aria-label="비 표현">
      {FX_OPTIONS.map((o) => (
        <Button
          key={o.id}
          size="sm"
          variant={fx === o.id ? "primary" : "secondary"}
          aria-pressed={fx === o.id}
          onClick={() => applyFx(o.id)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

/* 비 강도 — --rain-intensity 를 <html> 인라인으로. 비가 켜졌을 때만 보인다 */
const INTENSITY_KEY = "hctoast-rain-intensity";
function readIntensity() {
  if (typeof window === "undefined") return 0.6;
  const v = Number(localStorage.getItem(INTENSITY_KEY));
  return v > 0 && v <= 1 ? v : 0.6;
}
export function RainIntensity() {
  const rain = useRain();
  const [v, setV] = React.useState<number>(readIntensity);
  React.useEffect(() => {
    document.documentElement.style.setProperty("--rain-intensity", String(v));
    try {
      localStorage.setItem(INTENSITY_KEY, String(v));
    } catch {
      // 저장 실패는 무시
    }
  }, [v]);
  if (!rain) return null;
  return (
    <SliderField
      layout="inline"
      label="비 강도"
      format={(x) => `${x}%`}
      min={10}
      max={100}
      snap={5}
      value={[Math.round(v * 100)]}
      onValueChange={([x]) => setV(x / 100)}
      aria-label="비 강도"
      className="w-full"
    />
  );
}

/* 비가 켜졌을 때의 조절 줄: [빗줄기|유리 물방울] | 강도. 표현 전환은 night-city 에서만(다른 테마는 빗줄기뿐).
   버튼 모음과 슬라이더는 구분선으로 가른다 — 규칙 */
export function RainControls() {
  const rain = useRain();
  const theme = useTheme();
  const fx = useRainFx();
  const glass = theme === "night-city" && fx === "glass";
  if (!rain) return null;
  return (
    <div className="flex items-center gap-4">
      {theme === "night-city" && (
        <>
          <RainFxControl />
          <Separator orientation="vertical" className="h-8" />
        </>
      )}
      <RainIntensity />
      {glass && <FrameMeter />}
    </div>
  );
}

/* 유리 물방울이 도는 동안 프레임 간격 p90 — 16.7ms 근처면 60fps 유지, 33 을 넘으면 버벅임 (쇼케이스 판단용) */
function FrameMeter() {
  const [ms, setMs] = React.useState<number | null>(null);
  React.useEffect(() => {
    const onFrame = (e: Event) => setMs((e as CustomEvent<number>).detail);
    window.addEventListener("hctoast-rain-glass-frame", onFrame);
    return () => window.removeEventListener("hctoast-rain-glass-frame", onFrame);
  }, []);
  return (
    <span className="w-24 shrink-0 whitespace-nowrap text-right text-caption text-fg-subtle tabular-nums">
      {ms === null ? "프레임 —" : `프레임 ${ms.toFixed(0)}ms`}
    </span>
  );
}

export function ThemeControl() {
  const theme = useTheme();

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
