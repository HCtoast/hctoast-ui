/**
 * 사진 → 조명(scene) 변환.
 *
 * night-city 의 "사진 + 유리" 방식을 어떤 사진에나 적용한다. 결과는 `--bg-scene` 에
 * 그대로 넣을 수 있는 CSS 문자열 하나. 이미지 파일은 남지 않는다(축소 WebP 를 data URI 로 굽는다).
 *
 * 원칙: 입력 사진에 맞춘 상수가 아니라 "출력이 만족해야 할 조건"을 정하고, 사진마다 그
 * 조건을 맞추도록 파라미터를 역산한다. 그래서 낮 사진이든 야경이든 "그 사진의 밤 버전"이 된다.
 *
 * 출력 조건
 *  1. 조명 면적   — 빛으로 읽히는 픽셀이 화면의 coverage(기본 6%). 사용자가 2~15% 로 조절.
 *                   면적이 이 값이 되는 밝기 문턱을 사진마다 역산한다.
 *  2. 밝기 비     — 조명 중앙값 : 바닥 중앙값 ≥ lightRatio(6). gain 을 역산.
 *  3. 밤 유지     — 바닥(조명 아닌 영역)의 합성 후 평균 밝기 ≤ 지면 토큰 밝기. 바닥 어둡기를 역산.
 *  4. 글자 대비   — 넓은 영역(p85)은 fg-muted 4.5:1. 이걸 지키는 최소 유리 불투명도가 glassFloor.
 *                   아주 밝은 점(p99)은 유리를 두껍게 하지 않고 톤 매핑으로 깎는다.
 *  5. 조명 채도   — 조명 픽셀 채도를 0.4~0.7 띠로 정규화. 네온과 파스텔이 같은 강도로 나온다.
 *
 * 기계적으로 못 하는 것은 경고로만: 조명 색이 동작색(라임)·danger(산호)와 겹침, 조명이 없음
 * (밝기 범위가 좁아 상위 몇 %가 나머지보다 밝지 않음).
 *
 * 기준값 출처: 프리셋 "발코니"·"젖은 유리"(reference/night-city)에서 마음에 든 결과의 통계를
 * 재서 잡았다. 취향이 바뀌면 기준 사진을 바꾸고 다시 재면 된다.
 */

/** 선택기에서 고르는 디테일 단계 → 축소 폭. 블러 반경은 폭에 비례하므로 "번짐 정도"는 같고
 *  디테일만 달라진다. 크기: 96≈1.5KB, 192≈2.5KB, 320≈4KB */
export const SCENE_DETAIL = { lights: 96, silhouette: 192, shapes: 320 } as const;
export type SceneDetail = keyof typeof SCENE_DETAIL;

export const COVERAGE_RANGE: [number, number] = [0.02, 0.15];
export const COVERAGE_DEFAULT = 0.06;
export const GLASS_MAX = 0.92;

/** 기본값 — 전부 SceneOptions 로 덮어쓸 수 있다. 출처: 프리셋 발코니·젖은 유리에서 잰 값 */
export const SCENE_DEFAULTS = {
  lightRatio: 6,              // 조명 : 바닥 밝기 비 목표
  lightSat: [0.4, 0.7] as [number, number], // 조명 채도 띠
  bloom: 0.5,                 // 넓은 블러의 세기 0~1 (빛번짐 크기)
} as const;
const GLASS_DEFAULT: [number, number, number] = [4, 10, 20]; // night-city 지면
const TEXT_LUMA_DEFAULT = 0.4; // fg-muted #93adc0
const BG_LUMA_DEFAULT = 0.0034; // 지면 #040a14 — "밤 유지" 상한

export type SceneStats = {
  meanLuma: number;        // 원본 평균 밝기 0~1
  coverage: number;        // 조명으로 잡힌 픽셀 비율 (목표값)
  lightRatio: number;      // 달성한 조명:바닥 밝기 비
  dominantHue: number | null;
  glassFloor: number;      // 글자 대비를 지키는 최소 유리 불투명도
  glass: number;           // 실제 쓴 유리(아래쪽) 불투명도
  bytes: number;
};

export type BakedScene = {
  /** 구운 조명 이미지 (data URI) */
  uri: string;
  stats: Omit<SceneStats, "glass">;
  warnings: string[];
};

export type SceneResult = {
  /** `--bg-scene` 에 넣을 값 */
  scene: string;
  stats: SceneStats;
  warnings: string[];
};

export type SceneOptions = {
  /** 축소 폭. 기본 96 */
  width?: number;
  /** 조명 면적 목표 0.02~0.15. 기본 0.06 */
  coverage?: number;
  /** 유리 색(지면색) RGB. 기본 night-city 지면 */
  glassColor?: [number, number, number];
  /** 지면 위 보조 글자(fg-muted)의 상대 밝기. 기본 steel-200 */
  textLuma?: number;
  /** 지면 토큰의 상대 밝기 — 바닥이 이보다 밝아지지 않게. 기본 #040a14 */
  bgLuma?: number;
  /** 조명 : 바닥 밝기 비 목표. 기본 6 */
  lightRatio?: number;
  /** 조명 채도 띠 [min, max]. 기본 [0.4, 0.7] */
  lightSat?: [number, number];
  /** 빛번짐 세기 0~1. 기본 0.5 */
  bloom?: number;
};

function srgbToLinear(c: number) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luma(r: number, g: number, b: number) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function sortedCopy(a: Float32Array) { return Float32Array.from(a).sort(); }
function percentile(sorted: Float32Array, p: number) {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}
function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

/** 사진을 조명 이미지로 굽는다. 유리는 아직 안 덮는다 — composeScene 에서. */
export async function bakeScene(
  source: HTMLImageElement | ImageBitmap,
  options: SceneOptions = {},
): Promise<BakedScene> {
  const W = options.width ?? SCENE_DETAIL.lights;
  const coverage = clamp(options.coverage ?? COVERAGE_DEFAULT, COVERAGE_RANGE[0], COVERAGE_RANGE[1]);
  const glassColor = options.glassColor ?? GLASS_DEFAULT;
  const textLuma = options.textLuma ?? TEXT_LUMA_DEFAULT;
  const bgLuma = options.bgLuma ?? BG_LUMA_DEFAULT;
  const lightRatioTarget = options.lightRatio ?? SCENE_DEFAULTS.lightRatio;
  const lightSat = options.lightSat ?? SCENE_DEFAULTS.lightSat;
  const bloom = clamp(options.bloom ?? SCENE_DEFAULTS.bloom, 0, 1);
  const warnings: string[] = [];

  const H = Math.max(8, Math.round((W * source.height) / source.width));
  const base = document.createElement("canvas");
  base.width = W; base.height = H;
  const bctx = base.getContext("2d", { willReadFrequently: true })!;
  bctx.drawImage(source, 0, 0, W, H);
  const img = bctx.getImageData(0, 0, W, H);
  const px = img.data;
  const n = W * H;

  // 측정
  const L = new Float32Array(n), S = new Float32Array(n), Hh = new Float32Array(n), rank = new Float32Array(n);
  let sumL = 0;
  for (let i = 0; i < n; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const l = luma(r, g, b); L[i] = l; sumL += l;
    const [h, s] = rgbToHsl(r, g, b); S[i] = s; Hh[i] = h;
    rank[i] = l * (0.6 + 0.4 * s); // "빛"의 정의: 밝고, 색이 있으면 더
  }
  const meanLuma = sumL / n;

  // 1. 조명 면적 — 목표 면적이 되는 문턱을 역산
  const thr = percentile(sortedCopy(rank), 1 - coverage);
  const isLight = new Uint8Array(n);
  const lightL: number[] = [], groundL: number[] = [];
  const hueBins = new Float32Array(36);
  for (let i = 0; i < n; i++) {
    if (rank[i] >= thr && thr > 0) { isLight[i] = 1; lightL.push(L[i]); hueBins[Math.floor(Hh[i] / 10) % 36] += 0.3 + S[i]; }
    else groundL.push(L[i]);
  }
  const lightMed = median(lightL), groundMed = median(groundL);

  // 조명 없음 판정: 상위 coverage 가 나머지보다 충분히 밝지 않다 (밝기 범위 좁음)
  const hasLights = lightL.length > 0 && lightMed > Math.max(0.02, groundMed * 1.5);
  if (!hasLights) warnings.push("밝기 차이가 작아서 조명을 못 잡았어요. 유리 아래가 그냥 어두운 밤이 돼요.");

  // 3. 밤 유지 — 바닥 평균이 유리 합성 후 지면 밝기가 되도록 바닥 어둡기를 역산.
  //    합성: a*glassL + (1-a)*ground*k ≤ bgLuma. 유리 기본 0.8 기준으로 k 를 잡는다 (glass 는 뒤에 확정)
  const glassL = luma(glassColor[0], glassColor[1], glassColor[2]);
  const groundMean = groundL.reduce((a, b) => a + b, 0) / Math.max(1, groundL.length);
  const aRef = 0.8;
  const groundTarget = Math.max(0.002, (bgLuma * 1.6 - aRef * glassL) / (1 - aRef)); // 지면보다 살짝만 밝게
  const darkBase = clamp(groundTarget / Math.max(groundMean, 1e-4), 0.05, 0.6);

  // 2. 밝기 비 — 조명 중앙값이 바닥 중앙값(어둡힌 뒤)의 LIGHT_RATIO 배가 되게 gain 역산
  const groundAfter = groundMed * darkBase;
  const gain = hasLights ? clamp((lightRatioTarget * Math.max(groundAfter, 0.01)) / Math.max(lightMed, 1e-4), 0.8, 4) : 0;
  const lightRatio = hasLights ? (lightMed * gain) / Math.max(groundAfter, 1e-4) : 0;

  // 지배 색상 + 겹침 경고
  let dominantHue: number | null = null;
  if (hasLights) {
    let best = 0;
    for (let k = 1; k < 36; k++) if (hueBins[k] > hueBins[best]) best = k;
    dominantHue = best * 10 + 5;
    if (hueDistance(dominantHue, 69) < 25) warnings.push("조명 색이 라임(동작색)과 겹쳐요. 주 버튼이 배경에 묻힐 수 있어요.");
    if (hueDistance(dominantHue, 5) < 20) warnings.push("조명 색이 산호(danger)와 겹쳐요. 삭제·오류 표시가 덜 눈에 띌 수 있어요.");
  }

  // 픽셀 적용: 조명은 채도 정규화(5) + gain, 바닥은 darkBase
  for (let i = 0; i < n; i++) {
    let r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    if (isLight[i] && hasLights) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const s2 = s < 0.05 ? s : clamp(s, lightSat[0], lightSat[1]); // 무채색 빛(백열)은 그대로
      [r, g, b] = hslToRgb(h, s2, l);
      r *= gain; g *= gain; b *= gain;
    } else {
      r *= darkBase; g *= darkBase; b *= darkBase;
    }
    px[i * 4] = Math.min(255, r); px[i * 4 + 1] = Math.min(255, g); px[i * 4 + 2] = Math.min(255, b);
  }
  bctx.putImageData(img, 0, 0);

  // 빛번짐 — 좁은 블러 + 넓은 블러. 캔버스에 구워서 런타임 필터 없음
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const octx = out.getContext("2d", { willReadFrequently: true })!;
  const blurS = Math.max(1, Math.round(W / 48)), blurL = Math.max(2, Math.round(W / 24));
  octx.filter = `blur(${blurS}px)`;
  octx.drawImage(base, 0, 0);
  octx.filter = `blur(${blurL}px)`;
  octx.globalAlpha = bloom;
  octx.globalCompositeOperation = "lighter";
  octx.drawImage(base, 0, 0);
  octx.globalAlpha = 1; octx.globalCompositeOperation = "source-over"; octx.filter = "none";

  // 4. 톤 매핑(p99 상한) + glassFloor(p85 기준 AA)
  const baked = octx.getImageData(0, 0, W, H);
  const bp = baked.data;
  const bakedL = new Float32Array(n);
  for (let i = 0; i < n; i++) bakedL[i] = luma(bp[i * 4], bp[i * 4 + 1], bp[i * 4 + 2]);
  const sortedB = sortedCopy(bakedL);
  const p99 = percentile(sortedB, 0.99), p85 = percentile(sortedB, 0.85);
  const cap = Math.max(p85 * 2.5, 0.05); // 넓은 영역의 2.5배를 넘는 점은 깎는다
  if (p99 > cap) {
    for (let i = 0; i < n; i++) {
      if (bakedL[i] > cap) {
        const k = Math.sqrt(cap / bakedL[i]); // 채널 스케일은 선형 밝기의 제곱근 근사
        bp[i * 4] *= k; bp[i * 4 + 1] *= k; bp[i * 4 + 2] *= k;
      }
    }
    octx.putImageData(baked, 0, 0);
  }
  const maxComposite = (textLuma + 0.05) / 4.5 - 0.05;
  const wide = Math.min(p85, cap);
  let glassFloor = wide > maxComposite ? (wide - maxComposite) / (wide - glassL) : 0.6;
  glassFloor = clamp(Math.round(glassFloor * 100) / 100, 0.6, GLASS_MAX);

  const uri = out.toDataURL("image/webp", 0.8);
  return {
    uri,
    stats: { meanLuma, coverage, lightRatio, dominantHue, glassFloor, bytes: uri.length },
    warnings,
  };
}

/** 구운 조명 위에 유리를 덮어 `--bg-scene` 값을 만든다. glass 는 아래쪽 불투명도(floor 이상) */
export function composeScene(
  baked: BakedScene,
  glass?: number,
  glassColor: [number, number, number] = GLASS_DEFAULT,
): SceneResult {
  const bottom = clamp(glass ?? baked.stats.glassFloor + 0.06, baked.stats.glassFloor, GLASS_MAX);
  const top = Math.min(0.94, bottom + 0.12);
  const g = `rgb(${glassColor[0]} ${glassColor[1]} ${glassColor[2]}`;
  const scene = `linear-gradient(180deg, ${g} / ${top.toFixed(2)}) 0%, ${g} / ${bottom.toFixed(2)}) 100%), url("${baked.uri}")`;
  return { scene, stats: { ...baked.stats, glass: bottom }, warnings: baked.warnings };
}

/** 한 번에: 굽고 유리 덮기 */
export async function buildSceneFromImage(
  source: HTMLImageElement | ImageBitmap,
  options: SceneOptions & { glass?: number } = {},
): Promise<SceneResult> {
  const baked = await bakeScene(source, options);
  return composeScene(baked, options.glass, options.glassColor);
}

/** File/Blob → 이미지 엘리먼트 (decode 완료) */
export async function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}
