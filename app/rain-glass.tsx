"use client";

import * as React from "react";
import type RaindropFXClass from "raindrop-fx";

import {
  bakeScene,
  COVERAGE_DEFAULT,
  GLASS_MAX,
  loadImage,
  paintGlass,
  SCENE_DETAIL,
} from "@/registry/lib/scene-from-photo";

import { findPhoto, PRESETS, readSavedScene, subscribeScene, type Saved } from "./scene-store";
import { useRain, useRainFx, useTheme } from "./theme-control";

/* 유리 물방울 — 창문 안쪽에서 본 비 (시제품, 쇼케이스).
   엔진: raindrop-fx (MIT, WebGL2). 물방울이 배경 텍스처를 굴절시키므로 살아 있는 DOM 은 못 비추지만,
   night-city 의 배경은 어차피 구운 사진이라 그 사진(+유리)을 텍스처로 넘긴다. 캔버스가 조명·유리를
   통째로 그리므로 도는 동안 CSS 빗줄기 층은 끈다(<html data-rain-glass>).

   비용 설계 — 무거운 건 텍스처 해상도가 아니라 캔버스 픽셀 수:
   · 텍스처: 960px 로 굽는다. GPU 는 화면 픽셀당 한 번 샘플하므로 프레임 비용과 무관, VRAM ~2MB, 한 번만.
     theme.css 의 96px data URI 는 그대로 — 큰 이미지를 CSS 에 넣으면 첫 렌더가 막힌다.
   · 캔버스 내부 해상도: 폭 1280 상한, DPR 무시(항상 1x). 물방울은 원래 부드러워서 확대 티가 안 난다.
     1280×800 ≈ 1M 픽셀 → 제작자 측정치(1080p 2~3ms/프레임) 안쪽.
   · 라이브러리는 동적 import — 비 + night-city + 유리 모드일 때만 내려받는다.
   · WebGL2 없음 / prefers-reduced-motion / 초기화 실패 → 아무것도 안 걸고 CSS 빗줄기가 그대로 남는다.
   · 탭이 숨으면 멈춘다.

   밝기 설계:
   엔진은 배경도 물방울도 같은 블러 배경(backgroundBlurSteps)을 샘플한다 — 물방울이 "선명한 창밖"을 보여주는
   구조가 아니다. 물방울이 빛을 담는 원리는 굴절 오프셋이 커서(refractBase/Scale) 멀리 있는 조명 영역을
   끌어오는 것 + 가장자리 음영(diffuse) + 반짝임(specular). 그래서 텍스처는 화면(CSS)과 같은 유리로 덮되
   조명만 세게(lightRatio 9) 굽는다. 유리 바닥값은 같은 lightRatio 의 96px(CSS 조건) 굽기에서 재므로
   글자 대비(fg-muted 4.5:1)는 구조적으로 유지된다. 김 서림(mist)은 "더 블러된 배경 + 색"을 더하는 층이라
   어둡기 보충엔 못 쓴다 — 색 0 으로 두고 물방울이 지나간 자국(닦인 자리)에만 쓴다. */

type RaindropFX = InstanceType<typeof RaindropFXClass>;
type RaindropFXOptions = ConstructorParameters<typeof RaindropFXClass>[0];

const TEXTURE_W = 960;
const TEXTURE_BLUR = 0.15; // 물방울 안에 담기는 건 "선명한" 창밖. 배경 블러는 GPU 가 따로 한다
const TEXTURE_LIGHT_RATIO = 9; // 조명:바닥 비. 화면(6)보다 세게 — 물방울이 끌어오는 불빛이 또렷하도록
const MIST_ALPHA = 0.3; // 김 서림(닦인 자국) 세기. 색은 0 이라 밝기엔 영향 없음. 높으면 자국이 너무 남는다
const RENDER_MAX_W = 1280;
const GLASS_RGB: [number, number, number] = [4, 10, 20]; // night-city 지면 = 유리 색
const SCENE_DEBOUNCE = 300; // 선택기 슬라이더 드래그 중 재굽기 연타 방지
export const FRAME_EVENT = "hctoast-rain-glass-frame"; // detail: 프레임 간격 p90(ms). 쇼케이스 표시용

type Texture = { canvas: HTMLCanvasElement; glass: number };

/* 텍스처 캐시 — 같은 사진·조명 양·유리면 다시 굽지 않는다 (세션 메모리) */
const textureCache = new Map<string, Promise<Texture>>();

function sceneKeyOf(saved: Saved | null) {
  const source = saved?.source ?? PRESETS[0].id;
  const coverage = saved?.coverage ?? COVERAGE_DEFAULT;
  const glass = saved?.glass ?? null;
  return `${source}|${coverage}|${glass ?? "auto"}`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

async function buildTexture(source: string, coverage: number, glass: number | null): Promise<Texture> {
  const photo = findPhoto(source) ?? PRESETS[0];
  const img = await loadImage(photo.src);
  const [sharp, soft] = await Promise.all([
    bakeScene(img, { width: TEXTURE_W, coverage, blur: TEXTURE_BLUR, lightRatio: TEXTURE_LIGHT_RATIO }),
    // 바닥값은 화면(CSS)과 같은 96px·기본 블러 조건에서 — 선명한 텍스처로 재면 조명이 덜 퍼져 낮게 나온다
    bakeScene(img, { width: SCENE_DETAIL.lights, coverage, lightRatio: TEXTURE_LIGHT_RATIO }),
  ]);
  // 유리 = 선택기와 같은 규칙 (지정값 또는 바닥값 + 0.06), 바닥값 아래로는 못 내려간다
  const screenGlass = clamp(glass ?? soft.stats.glassFloor + 0.06, soft.stats.glassFloor, GLASS_MAX);
  const sharpImg = await loadImage(sharp.uri);
  const canvas = paintGlass(sharpImg, Math.min(0.94, screenGlass + 0.12), screenGlass, GLASS_RGB);
  return { canvas, glass: screenGlass };
}

function textureFor(key: string) {
  let p = textureCache.get(key);
  if (!p) {
    const [source, coverageStr, glassStr] = key.split("|");
    p = buildTexture(source, Number(coverageStr), glassStr === "auto" ? null : Number(glassStr));
    textureCache.set(key, p);
    p.catch(() => textureCache.delete(key));
  }
  return p;
}

/* 프레임 간격 p90 을 1초마다 이벤트로 — 실제 GPU 에서 "사이트가 버벅이는지" 판단용 (쇼케이스) */
function startFrameMeter() {
  let handle = 0;
  let last = performance.now();
  let samples: number[] = [];
  const tick = (t: number) => {
    samples.push(t - last);
    last = t;
    if (samples.length >= 60) {
      const sorted = [...samples].sort((a, b) => a - b);
      const p90 = sorted[Math.floor(sorted.length * 0.9)];
      window.dispatchEvent(new CustomEvent(FRAME_EVENT, { detail: p90 }));
      samples = [];
    }
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(handle);
}

function supportsWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

function readIntensity() {
  const v = Number(getComputedStyle(document.documentElement).getPropertyValue("--rain-intensity"));
  return v > 0 && v <= 1 ? v : 0.6;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* 시뮬레이션 물리 — 한 곳에서. s = 캔버스 내부 해상도 배율(길이·속도 단위 px 옵션에 곱한다), intensity = 비 강도 0.1~1.

   엔진의 움직임 원리: 방울마다 motionInterval 주기로 저항을 무작위로 다시 뽑는다.
   저항 문턱 ≈ lerp(spawnSize, 1 − slipRate)² × 4 × rand, 질량 = 크기². 질량이 문턱을 넘는 동안만 중력으로
   가속하고, 못 넘으면 감속해 멈춘다. 방울끼리 닿으면 합쳐져 질량이 커진다.
   → "작게 맺혀 오래 버티다가, 합쳐져 무거워지면 흐르기 시작하고 점점 빨라진다"는 이 값들로 나온다:
     spawnSize 작게(혼자선 문턱을 잘 못 넘음) · slipRate 낮게(문턱 높음) · gravity 낮게(천천히 가속) ·
     motionInterval 길게(저항이 자주 안 바뀌어 멈칫거림 없이 흐름).
   대각선 자국: 흐르는 방울이 trailDistance 마다 작은 자국 방울을 남기고, xShifting 만큼 좌우로 흔들려 사선이
   된다. 간격을 넓히고 흔들림을 거의 없애면 자국이 성기고 수직에 가깝다. */
function tune(fx: RaindropFX, intensity: number, s: number) {
  const t = Math.min(1, Math.max(0, (intensity - 0.1) / 0.9));
  const o = fx.options;
  // 흐름 (기본값: gravity 2400 · motionInterval 0.1~0.4 · xShifting 0~0.1)
  o.gravity = 1500 * s;
  o.motionInterval = [0.4, 1.4];
  o.xShifting = [0, 0.15]; // 방울마다 주기마다 새로 뽑는 좌우 비율 — 0.15 면 최대 8.5° 사선. 곧게만 떨어지면 어색
  // 자국 (기본값: trailDistance 20~30 · trailDropSize 0.3~0.5 · trailDropDensity 0.2)
  o.trailDistance = [45 * s, 80 * s];
  o.trailDropSize = [0.18, 0.32];
  o.trailDropDensity = 0.3; // 높을수록 자국 방울이 빨리 줄어든다
  o.dropletSize = [6 * s, 16 * s];
  // 강도. 이슬비: 드문 작은 방울이 오래 맺힘. 폭우: 큰 방울이 자주 떨어져 흘러내림
  o.spawnInterval = [lerp(0.9, 0.06, t), lerp(1.5, 0.12, t)];
  o.spawnSize = [lerp(32, 48, t) * s, lerp(64, 92, t) * s];
  o.dropletsPerSeconds = lerp(20, 250, t); // 미세 물방울 — 많으면 먼지·눈처럼 보인다
  o.evaporate = lerp(12, 6, t);
  o.slipRate = lerp(0, 0.15, t);
  // 충돌 격자 칸 크기가 spawnSize 에서 나온다 — 크기를 줄이면 칸이 늘어나므로 격자를 다시 잡는다
  fx.simulator.resize();
}

function scaleOf() {
  return Math.min(1, RENDER_MAX_W / window.innerWidth);
}

/* 엔진·캔버스는 페이지 수명 동안 하나 — 렌더러가 전역 GL 상태를 쓰므로 두 번 만들면 첫 컨텍스트의
   객체를 재사용하다 깨진다(INVALID_OPERATION: object does not belong to this context).
   끌 땐 stop + 숨김, 사진이 바뀌면 setBackground 로 갈아끼운다 */
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedEngine: RaindropFX | null = null;
let engineStarted = false; // resize 는 배경이 올라간 뒤에만 안전하다
let engineRunning = false; // start 를 겹쳐 부르면 rAF 루프가 둘이 된다

function getSharedCanvas() {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCanvas.setAttribute("aria-hidden", "true");
    sharedCanvas.className = "pointer-events-none fixed inset-0 -z-10 h-full w-full";
  }
  return sharedCanvas;
}

async function getEngine(canvas: HTMLCanvasElement, init: Omit<RaindropFXOptions, "canvas">) {
  if (sharedEngine) return sharedEngine;
  const mod = await import("raindrop-fx");
  // CommonJS(module.exports = class) — 번들러에 따라 default 로 감싸인다
  const Ctor = ((mod as unknown as { default?: typeof RaindropFXClass }).default ??
    (mod as unknown as typeof RaindropFXClass)) as new (o: RaindropFXOptions) => RaindropFX;
  if (sharedEngine) return sharedEngine; // 동시 호출 경합
  sharedEngine = new Ctor({ canvas, ...init });
  return sharedEngine;
}

async function runEngine(engine: RaindropFX) {
  if (engineRunning) return;
  engineRunning = true;
  await engine.start(); // loadAssets → 배경(텍스처)·기본 스프라이트 업로드
  applyDropSprite(engine); // start 마다 기본 스프라이트로 돌아가므로 매번 덮어쓴다
  engineStarted = true;
}

/* 물방울 스프라이트 — 엔진 내장 스프라이트는 상하 대칭 돔이다. 실제 유리 위 물방울은 중력에 아래가
   두툼하고 위가 얇으므로(표면장력이 버티는 만큼만 매달림) 달걀형 노멀맵을 만들어 바꿔치기한다.
   내장 스프라이트를 샘플링해 맞춘 규약:
   · 256px. R/G = 128 + 127·노멀 XY (위가 +Y). B = 0.
   · 알파 = 중심 반지름 20px 까지 255, 110px 까지 코사인 감쇠. 셰이더 mask 가 알파 0.96~0.99 를 윤곽으로
     쓰므로 보이는 몸통은 반지름 ~24px 이고, 바깥 감쇠는 이웃 방울과 알파가 합쳐져 이어지는 "메타볼" 몫.
   · 노멀 크기는 작게(보이는 가장자리에서 0.2~0.3). 굴절 오프셋이 노멀에 비례해 크면 수백 px 로 튄다.
   달걀: 아래 반폭 1.3, 위 0.7. 아래쪽은 노멀을 1.5배까지 키워 두툼한 렌즈처럼 굴절·음영이 세다. */
const SPRITE_SIZE = 256;
let dropSprite: HTMLCanvasElement | null = null;

function makeDropSprite() {
  if (dropSprite) return dropSprite;
  const n = SPRITE_SIZE;
  const c = document.createElement("canvas");
  c.width = n; c.height = n;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(n, n);
  const d = img.data;
  const R = 40;   // 달걀 기준 반지름(px). 알파 프로파일의 20~110 이 이 위에서 정의된다
  const RH = 60;  // 노멀(높이장) 반지름 — 몸통보다 넓어야 몸통 안 노멀이 완만하다
  const half = n / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = x + 0.5 - half;
      const v = half - (y + 0.5); // 위가 +
      const t = Math.max(-1, Math.min(1, v / R));
      const w = 1 - 0.3 * t; // 반폭 배율: 아래(t=-1) 1.3, 위(t=1) 0.7
      const ue = u / w;
      const e = Math.sqrt(ue * ue + v * v); // 달걀 좌표계의 반지름
      // 알파
      const k = Math.max(0, Math.min(1, (e - 20) / 90));
      const alpha = 0.5 * (1 + Math.cos(Math.PI * k));
      // 노멀 ∝ e² 의 기울기 (u/w², v), 크기는 e/RH·0.6, 아래쪽 강화
      const bottom = 1 + 0.5 * Math.max(0, -t);
      const gain = (0.6 * Math.min(e, RH)) / RH / Math.max(e, 1e-3) * bottom;
      const nx = Math.max(-1, Math.min(1, (ue / w) * gain));
      const ny = Math.max(-1, Math.min(1, v * gain));
      const i = (y * n + x) * 4;
      d[i] = Math.round(128 + 127 * nx);
      d[i + 1] = Math.round(128 + 127 * ny);
      d[i + 2] = 0;
      d[i + 3] = Math.round(255 * alpha);
    }
  }
  ctx.putImageData(img, 0, 0);
  dropSprite = c;
  return c;
}

function applyDropSprite(engine: RaindropFX) {
  // raindropTex 는 렌더러의 private 필드 — 타입엔 없지만 런타임엔 있다. 큰 방울·미세 방울 재질이 같은 텍스처를 참조한다
  const renderer = engine.renderer as unknown as { raindropTex?: { setData(pixels: TexImageSource): void } };
  renderer.raindropTex?.setData(makeDropSprite());
}

function haltEngine(engine: RaindropFX) {
  if (!engineRunning) return;
  engine.stop();
  engineRunning = false;
}

export function RainGlass() {
  const theme = useTheme();
  const rain = useRain();
  const fx = useRainFx();
  const active = theme === "night-city" && rain && fx === "glass";
  const hostRef = React.useRef<HTMLDivElement>(null);
  const fxRef = React.useRef<RaindropFX | null>(null);
  const scaleRef = React.useRef(1);
  const [sceneKey, setSceneKey] = React.useState(() => sceneKeyOf(readSavedScene()));

  // 공유 캔버스를 호스트에 붙인다 (React 가 만들지 않으므로 리렌더에 안 흔들린다)
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = getSharedCanvas();
    host.appendChild(canvas);
    return () => {
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, []);

  // 선택기가 사진·조명 양·유리를 바꾸면 텍스처도 따라간다 (드래그 연타는 300ms 로 모음)
  React.useEffect(() => {
    let timer: number | null = null;
    const unsubscribe = subscribeScene(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setSceneKey(sceneKeyOf(readSavedScene())), SCENE_DEBOUNCE);
    });
    return () => {
      unsubscribe();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // 켜짐/텍스처 변경: 엔진은 재사용하고 배경만 갈아끼운다
  React.useEffect(() => {
    const canvas = getSharedCanvas();
    canvas.hidden = !active;
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!supportsWebGL2()) return;

    let cancelled = false;
    let engine: RaindropFX | null = null;
    let stopMeter: (() => void) | null = null;

    const sizeOf = () => {
      const s = scaleOf();
      return { s, w: Math.round(window.innerWidth * s), h: Math.round(window.innerHeight * s) };
    };

    (async () => {
      const texture = await textureFor(sceneKey);
      if (cancelled) return;
      const { s, w, h } = sizeOf();
      scaleRef.current = s;
      const mistColor: [number, number, number, number] = [0, 0, 0, MIST_ALPHA];
      const fresh = !sharedEngine;
      if (fresh) {
        canvas.width = w;
        canvas.height = h;
      }
      engine = await getEngine(canvas, {
        background: texture.canvas,
        // 물리 옵션은 전부 tune() 에서 (start 전에 한 번, 강도·크기 변경 때마다)
        backgroundBlurSteps: 3,
        // 김 서림 — 물방울이 닦고 지나간 자국. 12초에 걸쳐 다시 서린다 (3초는 흔적이 금방 사라졌음)
        mist: true,
        mistBlurStep: 4,
        mistTime: 12,
        mistColor,
        // 밤 배경에선 굴절만으로 물방울이 안 보인다. 물처럼 보이는 조합 = 어두운 몸통(그림자 비율 높게)
        // + 얇고 밝은 테두리(확산광 약하게) + 작은 글린트(정반사 세고 좁게). 확산광을 올리면 눈송이처럼 뿌예진다
        raindropLightPos: [-1, 1, 2, 0],
        // 소프트웨어 GL 로 본 범위: diffuse 0.22/offset 0.45 는 눈송이, 0.14/0.7 은 안 보임. 실제 GPU 에서 재조정
        raindropDiffuseLight: [0.18, 0.21, 0.26],
        raindropShadowOffset: 0.55,
        raindropSpecularLight: [0.5, 0.58, 0.7],
        raindropSpecularShininess: 120,
        raindropLightBump: 0.8, // 낮을수록 곡면 — 테두리 음영이 살아난다
      });
      if (cancelled) return;
      if (!fresh) {
        // 재사용: 배경·김 서림·크기를 현재 값으로
        engine.options.mistColor = mistColor;
        if (engineStarted) {
          if (engine.options.width !== w || engine.options.height !== h) engine.resize(w, h);
          await engine.setBackground(texture.canvas);
          if (cancelled) return;
        } else {
          engine.options.background = texture.canvas;
        }
      }
      tune(engine, readIntensity(), s);
      await runEngine(engine);
      if (cancelled) return;
      fxRef.current = engine;
      document.documentElement.dataset.rainGlass = "";
      stopMeter = startFrameMeter();
    })().catch((e: unknown) => {
      console.warn("RainGlass: 시작 실패, 빗줄기로 둡니다", e);
    });

    const onResize = () => {
      if (!engine || !engineStarted) return;
      const { s, w, h } = sizeOf();
      scaleRef.current = s;
      engine.resize(w, h);
      tune(engine, readIntensity(), s);
    };
    const onVisibility = () => {
      if (!engine || !fxRef.current) return;
      if (document.hidden) haltEngine(engine);
      else void runEngine(engine);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (engine) haltEngine(engine);
      stopMeter?.();
      fxRef.current = null;
      delete document.documentElement.dataset.rainGlass;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, sceneKey]);

  // 비 강도 슬라이더(--rain-intensity 인라인) → 시뮬레이션 옵션. 엔진을 다시 만들지 않는다
  React.useEffect(() => {
    if (!active) return;
    const observer = new MutationObserver(() => {
      if (fxRef.current) tune(fxRef.current, readIntensity(), scaleRef.current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [active]);

  // 호스트는 항상 그린다(서버·클라이언트 동일). 공유 캔버스는 effect 가 붙이고, 꺼지면 hidden
  return <div ref={hostRef} data-slot="rain-glass" />;
}
