"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildSceneFromImage,
  loadImage,
  SCENE_DETAIL,
  type SceneDetail,
  type SceneResult,
} from "@/registry/lib/scene-from-photo";

import { useTheme } from "./theme-control";

/* night-city-c 전용 "조명 사진" 선택기 (실험).
   프리셋이나 내 사진을 고르면 scene-from-photo 가 사진을 조명으로 구워 --bg-scene 에 넣는다.
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
  result: SceneResult;
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

function applyScene(scene: string | null) {
  const root = document.documentElement;
  if (scene) root.style.setProperty("--bg-scene", scene);
  else root.style.removeProperty("--bg-scene");
}

export function ScenePicker() {
  const theme = useTheme();
  const active = theme === "night-city-c";
  // 저장된 선택 복원. 서버에선 어차피 active=false 라 null 을 그리고, 클라이언트 첫 렌더도
  // useSyncExternalStore 의 서버 스냅샷("day")을 쓰므로 하이드레이션 불일치가 없다.
  const [saved, setSaved] = React.useState<Saved | null>(readSaved);
  const [detail, setDetail] = React.useState<SceneDetail>(() => readSaved()?.detail ?? "lights");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const uploadRef = React.useRef<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 테마가 night-city-c 일 때만 인라인 값을 건다
  React.useEffect(() => {
    applyScene(active && saved ? saved.result.scene : null);
    return () => applyScene(null);
  }, [active, saved]);

  const build = React.useCallback(
    async (source: string, img: HTMLImageElement, d: SceneDetail) => {
      setBusy(true);
      setError(null);
      try {
        const result = await buildSceneFromImage(img, { width: SCENE_DETAIL[d] });
        const next: Saved = { source, detail: d, result };
        setSaved(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // 저장 실패(용량 등)는 무시 — 세션 한정
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "사진을 처리하지 못했어요.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const pickPreset = async (id: string, d = detail) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    uploadRef.current = null;
    await build(id, await loadImage(p.src), d);
  };

  const pickFile = async (file: File, d = detail) => {
    uploadRef.current = file;
    await build("upload", await loadImage(file), d);
  };

  const changeDetail = async (d: SceneDetail) => {
    setDetail(d);
    if (!saved) return;
    if (saved.source === "upload") {
      if (uploadRef.current) await pickFile(uploadRef.current, d);
      else setError("디테일을 바꾸려면 사진을 다시 올려주세요. 업로드 원본은 저장하지 않아요.");
    } else {
      await pickPreset(saved.source, d);
    }
  };

  const reset = () => {
    uploadRef.current = null;
    setSaved(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  };

  if (!active) return null;

  const stats = saved?.result.stats;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
      <div className="flex flex-col gap-2">
        <h2 className="text-h3 text-fg">조명 사진 (night-city-c 실험)</h2>
        <p className="text-body-sm text-fg-muted">
          사진에서 밝고 색 있는 부분만 조명으로 남기고 빛번짐을 구워 유리 아래에 깐다. 글자 대비가
          지켜지도록 유리 어둡기는 자동으로 정해진다.
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
              onClick={() => pickPreset(p.id)}
              className={
                selected
                  ? "flex flex-col gap-2 rounded-md border border-accent p-2 text-fg transition-base disabled:opacity-50"
                  : "flex flex-col gap-2 rounded-md border border-border p-2 text-fg-muted transition-base hover:bg-hover disabled:opacity-50"
              }
            >
              <Image
                src={p.src}
                alt={p.label}
                width={120}
                height={68}
                className="h-16 w-28 rounded-sm object-cover"
              />
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
              disabled={busy}
              onClick={() => changeDetail(d.id)}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
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

      {error && <p className="text-body-sm text-danger">{error}</p>}
      {saved && saved.result.warnings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {saved.result.warnings.map((w) => (
            <li key={w} className="text-body-sm text-warning">
              {w}
            </li>
          ))}
        </ul>
      )}
      {stats && (
        <p className="text-caption text-fg-subtle">
          평균 밝기 {stats.meanLuma.toFixed(2)} · 조명 비율 {(stats.coverage * 100).toFixed(0)}% ·
          지배 색상 {stats.dominantHue === null ? "없음" : `${stats.dominantHue}°`} · 유리{" "}
          {Math.round(stats.overlay[0] * 100)}→{Math.round(stats.overlay[1] * 100)}% ·{" "}
          {(stats.bytes / 1024).toFixed(1)}KB
        </p>
      )}
    </section>
  );
}
