"use client";

import * as React from "react";
import Image from "next/image";
import { Eye, ImagePlus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dismiss } from "@/components/ui/dismiss";
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
   목록 = 프리셋(지운 것 제외) + 내 사진(업로드). 사진을 고르면 scene-from-photo 가 조명으로 구워
   --bg-scene 에 넣는다. 사용자가 만지는 건 둘: 조명 양(면적 %)과 창밖 밝기.
   업로드 사진은 800px 로 줄여 localStorage 에 두므로 새로고침 뒤에도 남고 다시 구울 수 있다.
   사진마다 오른쪽 위 X 로 지운다. 다 지우면 조명을 빼고 안내 문구를 보인다.
   프리셋 사진은 임시(레퍼런스 스크린샷) — 확정 시 직접 찍은 사진/CC0 로 교체. */

const KEY_SCENE = "hctoast-scene";
const KEY_PHOTOS = "hctoast-scene-photos";
const KEY_REMOVED = "hctoast-scene-removed";
const UPLOAD_MAX_W = 800;

type Photo = { id: string; label: string; src: string; kind: "preset" | "upload" };

const PRESETS: Photo[] = [
  { id: "city-balcony", label: "발코니", src: "/scenes/city-balcony.jpg", kind: "preset" },
  { id: "city-rain-glass", label: "젖은 유리", src: "/scenes/city-rain-glass.jpg", kind: "preset" },
  { id: "city-pool", label: "수영장", src: "/scenes/city-pool.webp", kind: "preset" },
  { id: "honami-wisteria", label: "호나미 등나무", src: "/scenes/honami-wisteria.jpg", kind: "preset" },
  { id: "honami-tower", label: "호나미 타워", src: "/scenes/honami-tower.jpg", kind: "preset" },
];

const DETAILS: { id: SceneDetail; label: string }[] = [
  { id: "lights", label: "빛만" },
  { id: "silhouette", label: "실루엣" },
  { id: "shapes", label: "형체" },
];

type Saved = {
  source: string; // Photo.id
  detail: SceneDetail;
  coverage: number;
  glass: number | null; // null = 자동(바닥값 + 조금)
  baked: BakedScene;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback; // 손상된 저장값은 무시
  }
}

function writeJson(key: string, value: unknown | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // 용량 초과 등
  }
}

function applyScene(scene: string | null) {
  const root = document.documentElement;
  if (scene) root.style.setProperty("--bg-scene", scene);
  else root.style.removeProperty("--bg-scene");
}

/** 업로드 파일을 800px 이하 JPEG data URL 로 줄인다 (저장용) */
async function shrinkForStorage(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, UPLOAD_MAX_W / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export function ScenePicker() {
  const theme = useTheme();
  const active = theme === "night-city-c";
  // 서버에선 active=false 라 null 을 그리고, 클라이언트 첫 렌더도 서버 스냅샷("day")을 쓰므로
  // 하이드레이션 불일치가 없다.
  const [saved, setSaved] = React.useState<Saved | null>(() => readJson<Saved | null>(KEY_SCENE, null));
  const [photos, setPhotos] = React.useState<Photo[]>(() => readJson<Photo[]>(KEY_PHOTOS, []));
  const [removed, setRemoved] = React.useState<string[]>(() => readJson<string[]>(KEY_REMOVED, []));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const dragDepth = React.useRef(0); // 자식 요소를 지날 때 enter/leave 가 번갈아 와서 깊이로 센다
  const inputRef = React.useRef<HTMLInputElement>(null);
  const bakeTimer = React.useRef<number | null>(null);

  const list = React.useMemo(
    () => [...PRESETS.filter((p) => !removed.includes(p.id)), ...photos],
    [photos, removed],
  );
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

  const saveScene = React.useCallback((s: Saved | null) => {
    setSaved(s);
    if (!writeJson(KEY_SCENE, s)) setError("브라우저 저장 공간이 부족해서 선택을 기억하지 못했어요.");
  }, []);

  const rebake = React.useCallback(
    async (next: Pick<Saved, "source" | "detail" | "coverage"> & { glass: number | null }, photo?: Photo) => {
      const target = photo ?? list.find((p) => p.id === next.source);
      if (!target) return;
      setBusy(true);
      setError(null);
      try {
        const img = await loadImage(target.src);
        const baked = await bakeScene(img, { width: SCENE_DETAIL[next.detail], coverage: next.coverage });
        saveScene({ ...next, baked });
      } catch (e) {
        setError(e instanceof Error ? e.message : "사진을 처리하지 못했어요.");
      } finally {
        setBusy(false);
      }
    },
    [list, saveScene],
  );

  const pick = (photo: Photo) =>
    rebake({ source: photo.id, detail, coverage, glass: saved?.glass ?? null }, photo);

  const addFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError("이미지 파일만 넣을 수 있어요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const added: Photo[] = [];
      for (const f of images) {
        const src = await shrinkForStorage(f);
        added.push({ id: `upload-${Date.now()}-${added.length}`, label: f.name.replace(/\.[^.]+$/, ""), src, kind: "upload" });
      }
      const next = [...photos, ...added];
      if (!writeJson(KEY_PHOTOS, next)) {
        setError("브라우저 저장 공간이 부족해서 사진을 목록에 남기지 못했어요. 이번 세션에서만 써요.");
      }
      setPhotos(next);
      const last = added[added.length - 1];
      if (last) await rebake({ source: last.id, detail, coverage, glass: saved?.glass ?? null }, last);
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진을 읽지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const remove = (photo: Photo) => {
    if (photo.kind === "upload") {
      const next = photos.filter((p) => p.id !== photo.id);
      setPhotos(next);
      writeJson(KEY_PHOTOS, next);
    } else {
      const next = [...removed, photo.id];
      setRemoved(next);
      writeJson(KEY_REMOVED, next);
    }
    // 지운 사진이 지금 조명이면 조명도 뺀다
    if (saved?.source === photo.id) saveScene(null);
  };

  const restorePresets = () => {
    setRemoved([]);
    writeJson(KEY_REMOVED, null);
  };

  const changeDetail = (d: SceneDetail) => saved && rebake({ ...saved, detail: d });

  // 조명 양은 다시 구워야 한다 — 드래그 중 연타를 막으려고 150ms 뒤에 한 번만
  const changeCoverage = (v: number) => {
    if (!saved) return;
    setSaved({ ...saved, coverage: v });
    if (bakeTimer.current) window.clearTimeout(bakeTimer.current);
    bakeTimer.current = window.setTimeout(() => void rebake({ ...saved, coverage: v }), 150);
  };

  // 유리는 다시 굽지 않는다 — 합성만 바뀌므로 즉시
  const changeGlass = (v: number) => saved && saveScene({ ...saved, glass: v });

  const reset = () => {
    setError(null);
    saveScene(null);
  };

  if (!active) return null;

  const stats = result?.stats;
  const floor = stats?.glassFloor ?? 0.6;
  const empty = list.length === 0;

  // 드래그 앤 드롭 — 카드 전체가 드롭 영역. 끌고 들어오면 테두리가 accent 로
  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (busy) return;
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
  };

  return (
    <section
      onDragEnter={onDragEnter}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-dragover={dragOver || undefined}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1 transition-base data-[dragover]:border-accent data-[dragover]:bg-accent/15"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-h3 text-fg">조명 사진 (night-city-c 실험)</h2>
        <p className="text-body-sm text-fg-muted">
          사진에서 가장 밝은 부분만 조명으로 남기고 빛번짐을 구워 유리 아래에 깐다. 어떤 사진이든
          &ldquo;그 사진의 밤&rdquo;이 된다. 조명 양과 창밖 밝기만 조절할 수 있고, 밝기는 글자가 읽히는
          최대치 위로 올라가지 않는다. 사진은 이 카드에 끌어다 놓아도 된다.
        </p>
      </div>

      {empty ? (
        <p className="text-body-sm text-fg-muted">조명을 모두 뺐어요. 목록에 사진을 먼저 추가해주세요.</p>
      ) : (
        <ul className="flex flex-wrap gap-4">
          {list.map((p) => {
            const selected = saved?.source === p.id;
            return (
              <li key={p.id} className="relative">
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={busy}
                  onClick={() => void pick(p)}
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
                    unoptimized={p.kind === "upload"}
                    className="h-16 w-28 rounded-sm object-cover"
                  />
                  <span className="max-w-28 truncate text-caption">{p.label}</span>
                </button>
                <Dismiss
                  aria-label={p.kind === "preset" ? `${p.label} 숨기기` : `${p.label} 지우기`}
                  disabled={busy}
                  onClick={() => remove(p)}
                  className="absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-fg-muted shadow-e1 transition-base hover:bg-hover hover:text-fg disabled:opacity-50 [&_svg]:icon-sm"
                >
                  <X />
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="ghost" disabled={busy || !saved} onClick={reset}>
          <RotateCcw /> 기본 조명
        </Button>
        {removed.length > 0 && (
          <Button size="sm" variant="link" disabled={busy} onClick={restorePresets}>
            지운 프리셋 되살리기
          </Button>
        )}
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
              snap={1}
              value={[Math.round(coverage * 100)]}
              onValueChange={([v]) => changeCoverage(v / 100)}
              disabled={busy}
              aria-label="조명 양"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scene-glass">창밖 밝기</Label>
              <span className="text-caption text-fg-muted">
                {Math.round((1 - (stats?.glass ?? floor)) * 100)}% · 최대 {Math.round((1 - floor) * 100)}%
              </span>
            </div>
            {/* 유리 불투명도의 반대. 오른쪽 끝 = 그 사진에서 글자가 읽히는 최대 밝기 */}
            <Slider
              id="scene-glass"
              min={Math.round((1 - GLASS_MAX) * 100)}
              max={Math.round((1 - floor) * 100)}
              snap={1}
              value={[Math.round((1 - (stats?.glass ?? floor)) * 100)]}
              onValueChange={([v]) => changeGlass(1 - v / 100)}
              aria-label="창밖 밝기"
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
