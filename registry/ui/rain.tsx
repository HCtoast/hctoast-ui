"use client";

import * as React from "react";

/* 캔버스 빗줄기 — 선택 설치(레지스트리 항목 "rain"). 기본 설치(tokens)의 비는 theme.css 의 CSS 빗줄기 3층이다.

   왜 따로 있나: CSS 판은 층마다 무늬 한 장을 통째로 내린다. 그래서 같은 층 빗방울이 전부 같은 속도로 줄 맞춰
   움직이고, 세로 240·180·300px 마다 같은 배치가 되풀이된다 — "똑같은 게 반복된다"로 보인다
   (사용자 피드백 2026-11-25). 무늬를 더 복잡하게 해도 "층이 같이 움직이는 것"은 구조상 못 없앤다.
   여기선 빗방울 하나하나가 제 위치·속도·길이·밝기를 갖고, 바람(기울기)이 시간에 따라 흔들리고 가끔 돌풍이 분다.
   대신 치른 값: JS 가 매 프레임 돈다. 그래서 기본 설치엔 넣지 않고 원하는 프로젝트만 받는다(사용자 결정 2026-11-25).

   쓰는 법: 앱 루트(layout)에 <Rain /> 한 번. 비는 여전히 <html data-weather="rain"> 으로 켜고 끈다 —
   이 컴포넌트는 그 속성을 지켜보다 비가 오면 그린다. 색·강도는 theme.css 토큰(--rain-far/mid/near,
   --rain-intensity)을 읽으므로 테마별 빗줄기 색과 강도 조절이 그대로 따라온다.
   도는 동안 <html data-rain-canvas> 를 걸어 CSS 빗줄기 층을 끈다(theme.css). 그래서
   - prefers-reduced-motion · 2D 캔버스 없음 → 속성을 안 걸고, CSS 빗줄기(움직임 없는 판)가 그대로 남는다.
   - 다른 비 렌더러가 <html data-rain-glass> 를 걸면(쇼케이스의 유리 물방울) 물러난다 — 그쪽이 다 그린다.

   비용: 2D 캔버스. 1080p 폭우에서 선 ~1000개, 층(3) × 밝기 묶음(3) + 굵은 물방울 = 프레임당 stroke 10번,
   1ms 안쪽. DPR 상한 2. 탭이 숨으면 rAF 가 멈추고, 돌아올 때 한 프레임 시간을 50ms 로 잘라 순간이동을 막는다. */

type LayerKey = "far" | "mid" | "near";

type LayerSpec = {
  key: LayerKey;
  /** 강도 1 일 때 화면 100만 px² 당 빗방울 수 */
  density: number;
  /** 떨어지는 속도 px/s (강도·빗방울마다 흔들린다) */
  speed: number;
  /** 빗줄기 길이 px — 빠른 빗방울일수록 길다(움직임 번짐) */
  length: number;
  width: number;
  /** 바람에 얼마나 기우나. 먼 층일수록 덜 — 원근 */
  tilt: number;
  /** 강도 → 이 층이 보이는 비율. CSS 판과 같은 식이라 이슬비(0.3 아래)엔 near 가 없다 */
  presence: (i: number) => number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const LAYERS: LayerSpec[] = [
  { key: "far", density: 300, speed: 380, length: 12, width: 1, tilt: 0.6, presence: (i) => clamp01(i * 1.4) },
  { key: "mid", density: 140, speed: 700, length: 22, width: 1.25, tilt: 1, presence: (i) => clamp01((i - 0.15) / 0.6) },
  { key: "near", density: 45, speed: 1250, length: 46, width: 2, tilt: 1.4, presence: (i) => clamp01((i - 0.3) / 0.7) },
];

/* 같은 색 안에서 밝기를 세 갈래로 — 빗방울마다 alpha 를 따로 주면 stroke 를 하나씩 해야 해서 묶는다 */
const ALPHA_BUCKETS = [0.55, 0.8, 1];
/* near 층의 일부는 짧고 굵은 물방울(처마에서 뭉쳐 떨어지는) — CSS 판의 2.5×5 물방울과 같은 역할 */
const FAT_SHARE = 0.12;
const DPR_MAX = 2;
const DT_MAX = 0.05;

type Drop = { x: number; y: number; v: number; l: number; a: number; fat: boolean };
type Pool = { spec: LayerSpec; drops: Drop[]; color: string };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeDrop(w: number, h: number, spec: LayerSpec, anywhere: boolean): Drop {
  const v = rand(0.8, 1.2);
  return {
    // 바람이 왼쪽으로 밀어서 오른쪽 바깥에서도 태어나야 화면 오른쪽이 비지 않는다
    x: rand(0, w + h * 0.15),
    y: anywhere ? rand(-spec.length, h) : rand(-h * 0.25, -spec.length),
    v,
    l: v * rand(0.85, 1.15),
    a: Math.floor(Math.random() * ALPHA_BUCKETS.length),
    fat: spec.key === "near" && Math.random() < FAT_SHARE,
  };
}

/** 바람 기울기(도). 느린 흔들림 둘 + 가끔 부는 돌풍. 기준 2.5° 는 CSS 판 mid 층 기울기 */
function windDeg(t: number) {
  const sway = 1.4 * Math.sin(t * 0.37) + 0.7 * Math.sin(t * 1.13 + 1.7);
  const gust = 3 * Math.max(0, Math.sin(t * 0.21 - 0.8)) ** 8;
  return 2.5 + sway + gust;
}

function readTokens(root: HTMLElement) {
  const cs = getComputedStyle(root);
  const intensity = Number.parseFloat(cs.getPropertyValue("--rain-intensity"));
  return {
    intensity: Number.isFinite(intensity) ? clamp01(intensity) : 0.6,
    colors: {
      far: cs.getPropertyValue("--rain-far").trim(),
      mid: cs.getPropertyValue("--rain-mid").trim(),
      near: cs.getPropertyValue("--rain-near").trim(),
    } as Record<LayerKey, string>,
  };
}

function Rain() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return; // 2D 캔버스가 없으면 CSS 빗줄기가 그대로 남는다
    const root = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let pools: Pool[] = [];
    let intensity = 0.6;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      // 넓이가 바뀌면 빗방울 수가 달라진다. 강도는 "앞에서 몇 개를 그리나"로만 조절해 다시 만들지 않는다
      const area = (w * h) / 1_000_000;
      pools = LAYERS.map((spec) => {
        const prev = pools.find((p) => p.spec.key === spec.key);
        const n = Math.ceil(spec.density * area);
        const drops = Array.from({ length: n }, (_, k) => prev?.drops[k] ?? makeDrop(w, h, spec, true));
        return { spec, drops, color: prev?.color ?? "" };
      });
    };

    const refreshTokens = () => {
      const t = readTokens(root);
      intensity = t.intensity;
      for (const p of pools) p.color = t.colors[p.spec.key];
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(DT_MAX, last ? (now - last) / 1000 : 0);
      last = now;
      const wind = Math.tan((windDeg(now / 1000) * Math.PI) / 180);
      const pace = 0.75 + 0.35 * intensity; // 폭우일수록 조금 빨리
      ctx.clearRect(0, 0, w, h);

      for (const p of pools) {
        const { spec } = p;
        const count = Math.round(p.drops.length * spec.presence(intensity));
        if (count === 0 || !p.color) continue;
        const slope = wind * spec.tilt;
        // 움직이고, 화면을 벗어나면 위에서 다시 태어난다
        for (let k = 0; k < count; k++) {
          const d = p.drops[k];
          const dy = spec.speed * pace * d.v * dt;
          d.y += dy;
          d.x -= slope * dy;
          if (d.y - spec.length * d.l > h || d.x < -spec.length) p.drops[k] = makeDrop(w, h, spec, false);
        }
        ctx.strokeStyle = p.color;
        for (let b = 0; b < ALPHA_BUCKETS.length; b++) {
          ctx.globalAlpha = ALPHA_BUCKETS[b];
          ctx.lineWidth = spec.width;
          ctx.beginPath();
          for (let k = 0; k < count; k++) {
            const d = p.drops[k];
            if (d.a !== b || d.fat) continue;
            const len = spec.length * d.l;
            // 꼬리는 온 쪽(오른쪽 위)으로
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x + slope * len, d.y - len);
          }
          ctx.stroke();
        }
        if (spec.key === "near") {
          ctx.globalAlpha = 1;
          ctx.lineWidth = spec.width * 1.6;
          ctx.beginPath();
          for (let k = 0; k < count; k++) {
            const d = p.drops[k];
            if (!d.fat) continue;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x + slope * 8, d.y - 8);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (running) return;
      running = true;
      resize();
      refreshTokens();
      last = 0;
      canvas.hidden = false;
      root.dataset.rainCanvas = "";
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      canvas.hidden = true;
      delete root.dataset.rainCanvas;
    };
    const sync = () => {
      const want =
        root.dataset.weather === "rain" && !("rainGlass" in root.dataset) && !motion.matches;
      if (want) start();
      else stop();
      if (running) refreshTokens(); // 테마·강도(인라인 --rain-intensity)가 바뀌었을 수 있다
    };

    canvas.hidden = true;
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-weather", "data-rain-glass", "data-theme", "style", "class"],
    });
    motion.addEventListener("change", sync);
    const onResize = () => {
      if (running) resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      observer.disconnect();
      motion.removeEventListener("change", sync);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // 지면(body 배경) 위·콘텐츠 아래 — CSS 빗줄기 층과 같은 자리(z-index -1)
  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="rain"
      className="pointer-events-none fixed inset-0 -z-1 size-full"
    />
  );
}

export { Rain };
