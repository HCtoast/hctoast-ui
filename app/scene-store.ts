import type { BakedScene, SceneDetail } from "@/registry/lib/scene-from-photo";

/* night-city 조명 사진 선택 상태 (쇼케이스). 선택기가 쓰고 저장하며, 유리 물방울(RainGlass)이
   같은 사진·조명 양·유리로 텍스처를 구우려고 읽는다. 저장소는 localStorage, 변경 알림은 window 이벤트. */

export const KEY_SCENE = "hctoast-scene";
export const KEY_PHOTOS = "hctoast-scene-photos";
export const KEY_REMOVED = "hctoast-scene-removed";
const SCENE_EVENT = "hctoast-scene";

export type Photo = { id: string; label: string; src: string; kind: "preset" | "upload" };

/* 프리셋은 임시(레퍼런스 스크린샷) — 확정 시 직접 찍은 사진/CC0 로 교체 */
export const PRESETS: Photo[] = [
  { id: "city-balcony", label: "발코니", src: "/scenes/city-balcony.jpg", kind: "preset" },
  { id: "city-rain-glass", label: "젖은 유리", src: "/scenes/city-rain-glass.jpg", kind: "preset" },
  { id: "city-pool", label: "수영장", src: "/scenes/city-pool.webp", kind: "preset" },
  { id: "honami-wisteria", label: "호나미 등나무", src: "/scenes/honami-wisteria.jpg", kind: "preset" },
  { id: "honami-tower", label: "호나미 타워", src: "/scenes/honami-tower.jpg", kind: "preset" },
];

export type Saved = {
  source: string; // Photo.id
  detail: SceneDetail;
  coverage: number;
  glass: number | null; // null = 자동(바닥값 + 조금)
  baked: BakedScene;
};

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback; // 손상된 저장값은 무시
  }
}

export function writeJson(key: string, value: unknown | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // 용량 초과 등
  }
}

export function readSavedScene() {
  return readJson<Saved | null>(KEY_SCENE, null);
}

/** 프리셋 + 업로드에서 id 로 찾는다 (숨긴 프리셋도 포함 — 이미 고른 조명은 유지돼야 하므로) */
export function findPhoto(id: string): Photo | undefined {
  return PRESETS.find((p) => p.id === id) ?? readJson<Photo[]>(KEY_PHOTOS, []).find((p) => p.id === id);
}

export function notifySceneChange() {
  window.dispatchEvent(new Event(SCENE_EVENT));
}

export function subscribeScene(onChange: () => void) {
  window.addEventListener(SCENE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SCENE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
