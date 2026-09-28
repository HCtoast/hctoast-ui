"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  bakeScene,
  composeScene,
  COVERAGE_DEFAULT,
  COVERAGE_RANGE,
  GLASS_MAX,
  loadImage,
  SCENE_DETAIL,
  type BakedScene,
  type SceneDetail,
} from "@/registry/lib/scene-from-photo";

import { useTheme } from "./theme-control";

/* night-city-c 전용 "조명 사진" 선택기 (실험).
   프리셋이나 내 사진을 고르면 scene-from-photo 가 사진을 조명으로 구워 --bg-scene 에 넣는다.
   사용자가 만지는 건 둘: 조명 양(면적 %)과 유리 두께. 유리 슬라이더의 왼쪽 끝은 사진마다
   계산된 바닥값(글자 대비를 지키는 최소)이라 그 아래로는 못 내린다.
   결과는 localStorage 에 남고, 테마를 벗어나면 인라인 값을 걷어 theme.css 기본으로 돌아간다.
   프리셋 사진은 임시(레퍼런스 스크린샷) — 확정 시 직접 찍은 사진/CC0 로 교체. */

const STORAGE_KEY = "hctoast-scene";

const PRESETS: { id: string; label: string; src: string }[] = [
  { id: "city-balcony", label: "발코니", src: "/scenes/city-balcony.jpg" },
  { id: "city-rain-glass", label: "젖은 유리", src: "/scenes/city-rain-glass.jpg" },
  { id: "city-pool", label: "수영장", src: "/scenes/city-pool.webp" },
  { id: "honami-wisteria", label: "호나미 등나무", src: "/scenes/honami-wisteria.jpg" },
  { id: "honami-tower", label: "호나미 타워", src: "/scenes/honami-tower.jpg" },
];

const DETAILS: { id: SceneDetail; label: string }[] = [
  { id: "lights", label: "빛만" },
  { id: "silhouette", label: "실루엣" },
  { id: "shapes", label: "형체" },
];

type Saved = {
  source: string; // 프리셋 id 또는 "upload"
  detail: SceneDetail;
  coverage: number;
  glass: number | null; // null = 자동(바닥값 + 조금)
  baked: BakedScene;
};

function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null; // 손상된 저장값은 무시
  }
}

function persist(s: Saved | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장 실패(용량 등)는 무시 — 세션 한정
  }
}

function applyScene(scene: string | null) {
  const root = document.documentElement;
  if (scene) root.style.setProperty("--bg-scene", scene);
  else root.style.removeProperty("--bg-scene");
}

export function ScenePicker() {
  const theme = useTheme();
  const active = theme === "night-city-c";
  // 서버에선 active=false 라 null 을 그리고, 클라이언트 첫 렌더도 서버 스냅샷("day")을 쓰므로
  // 하이드레이션 불일치가 없다.
  const [saved, setSaved] = React.useState<Saved | null>(readSaved);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const uploadRef = React.useRef<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const bakeTimer = React.useRef<number | null>(null);

  const detail = saved?.detail ?? "lights";
  const coverage = saved?.coverage ?? COVERAGE_DEFAULT;
  const result = React.useMemo(
    () => (saved ? composeScene(saved.baked, saved.glass ?? undefined) : null),
    [saved],
  );

  React.useEffect(() => {
    applyScene(active && result ? result.scene : null);
    return () => applyScene(null);
  }, [active, result]);

  const loadSource = React.useCallback(async (source: string): Promise<HTMLImageElement | null> => {
    if (source === "upload") {
      if (!uploadRef.current) {
        setError("사진을 다시 올려주세요. 업로드 원본은 저장하지 않아서, 조명 양·디테일을 바꾸려면 원본이 필요해요.");
        return null;
      }
      return loadImage(uploadRef.current);
    }
    const p = PRESETS.find((x) => x.id === source);
    return p ? loadImage(p.src) : null;
  }, []);

  const rebake = React.useCallback(
    async (next: Pick<Saved, "source" | "detail" | "coverage"> & { glass: number | null }) => {
      setBusy(true);
      setError(null);
      try {
        const img = await loadSource(next.source);
        if (!img) return;
        const baked = await bakeScene(img, { width: SCENE_DETAIL[next.detail], coverage: next.coverage });
        const s: Saved = { ...next, baked };
        setSaved(s);
        persist(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사진을 처리하지 못했어요.");
      } finally {
        setBusy(false);
      }
    },
    [loadSource],
  );

  const pickPreset = (id: string) => rebake({ source: id, detail, coverage, glass: saved?.glass ?? null });

  const pickFile = (file: File) => {
    uploadRef.current = file;
    return rebake({ source: "upload", detail, coverage, glass: saved?.glass ?? null });
  };

  const changeDetail = (d: SceneDetail) => {
    if (!saved) return;
    return rebake({ ...saved, detail: d });
  };

  // 조명 양은 다시 구워야 한다 — 드래그 중 연타를 막으려고 150ms 뒤에 한 번만
  const changeCoverage = (v: number) => {
    if (!saved) return;
    setSaved({ ...saved, coverage: v });
    if (bakeTimer.current) window.clearTimeout(bakeTimer.current);
    bakeTimer.current = window.setTimeout(() => void rebake({ ...saved, coverage: v }), 150);
  };

  // 유리는 다시 굽지 않는다 — 합성만 바뀌므로 즉시
  const changeGlass = (v: number) => {
    if (!saved) return;
    const s = { ...saved, glass: v };
    setSaved(s);
    persist(s);
  };

  const reset = () => {
    uploadRef.current = null;
    setSaved(null);
    setError(null);
    persist(null);
  };

  if (!active) return null;

  const stats = result?.stats;
  const floor = stats?.glassFloor ?? 0.6;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
      <div className="flex flex-col gap-2">
        <h2 className="text-h3 text-fg">조명 사진 (night-city-c 실험)</h2>
        <p className="text-body-sm text-fg-muted">
          사진에서 가장 밝은 부분만 조명으로 남기고 빛번짐을 구워 유리 아래에 깐다. 어떤 사진이든
          &ldquo;그 사진의 밤&rdquo;이 된다. 조명 양과 유리 두께만 조절할 수 있고, 유리는 글자가 읽히는
          최소 두께 아래로 내려가지 않는다.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {PRESETS.map((p) => {
          const selected = saved?.source === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              disabled={busy}
              onClick={() => void pickPreset(p.id)}
              className={
                selected
                  ? "flex flex-col gap-2 rounded-md border border-accent p-2 text-fg transition-base disabled:opacity-50"
                  : "flex flex-col gap-2 rounded-md border border-border p-2 text-fg-muted transition-base hover:bg-hover disabled:opacity-50"
              }
            >
              <Image src={p.src} alt={p.label} width={120} height={68} className="h-16 w-28 rounded-sm object-cover" />
              <span className="text-caption">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2" role="group" aria-label="디테일">
          {DETAILS.map((d) => (
            <Button
              key={d.id}
              size="sm"
              variant={detail === d.id ? "primary" : "secondary"}
              aria-pressed={detail === d.id}
              disabled={busy || !saved}
              onClick={() => void changeDetail(d.id)}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus /> 내 사진
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pickFile(f);
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="ghost" disabled={busy || !saved} onClick={reset}>
          <RotateCcw /> 기본 조명
        </Button>
        {busy && <span className="text-body-sm text-fg-subtle">굽는 중…</span>}
      </div>

      {saved && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scene-coverage">조명 양</Label>
              <span className="text-caption text-fg-muted">{Math.round(coverage * 100)}%</span>
            </div>
            <Slider
              id="scene-coverage"
              min={COVERAGE_RANGE[0] * 100}
              max={COVERAGE_RANGE[1] * 100}
              step={1}
              value={[Math.round(coverage * 100)]}
              onValueChange={([v]) => changeCoverage(v / 100)}
              disabled={busy}
              aria-label="조명 양"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scene-glass">유리 두께</Label>
              <span className="text-caption text-fg-muted">
                {Math.round((stats?.glass ?? floor) * 100)}% · 최소 {Math.round(floor * 100)}%
              </span>
            </div>
            <Slider
              id="scene-glass"
              min={Math.round(floor * 100)}
              max={Math.round(GLASS_MAX * 100)}
              step={1}
              value={[Math.round((stats?.glass ?? floor) * 100)]}
              onValueChange={([v]) => changeGlass(v / 100)}
              aria-label="유리 두께"
            />
          </div>
        </div>
      )}

      {error && <p className="text-body-sm text-danger">{error}</p>}
      {result && result.warnings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {result.warnings.map((w) => (
            <li key={w} className="text-body-sm text-warning">{w}</li>
          ))}
        </ul>
      )}
      {stats && (
        <p className="text-caption text-fg-subtle">
          평균 밝기 {stats.meanLuma.toFixed(2)} · 조명:바닥 {stats.lightRatio.toFixed(1)}:1 · 지배 색상{" "}
          {stats.dominantHue === null ? "없음" : `${stats.dominantHue}°`} · {(stats.bytes / 1024).toFixed(1)}KB
        </p>
      )}
    </section>
  );
}
