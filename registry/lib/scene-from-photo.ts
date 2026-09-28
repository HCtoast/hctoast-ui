/**
 * 사진 → 조명(scene) 변환.
 *
 * night-city-c 의 "사진 + 유리" 방식을 어떤 사진에나 적용한다.
 * 결과는 `--bg-scene` 에 그대로 넣을 수 있는 CSS 문자열 하나. 이미지 파일은 남지 않는다
 * (96px WebP 를 data URI 로 굽는다 — 보통 1~3KB).
 *
 * 파이프라인
 *  1. 96px 로 축소 (형체는 버리고 빛 분포만 남긴다)
 *  2. 밝기 상위 percentile 이면서 채도 있는 픽셀 = "조명". 조명은 키우고 나머지는 어둡게
 *  3. 두 단계 블러(2px + 4px)를 캔버스에 구워 빛번짐(bloom)을 만든다. 런타임 CSS 필터 없음
 *  4. 구운 결과의 밝기 p95 를 보고, 위에 덮는 어두운 유리의 불투명도를 자동으로 정한다 —
 *     지면 위 fg-muted 글자가 AA(4.5:1)를 지키는 값까지 올린다
 *
 * 도시 야경이 아닌 사진이 들어왔을 때의 가드 (stats / warnings 로 알려준다)
 *  - 낮 사진·흰 사진(평균 밝기 높음): 조명 기준 percentile 을 올리고 바닥을 더 어둡게 — 하늘
 *    전체가 조명이 되는 걸 막는다
 *  - 조명이 너무 넓음(coverage 큼): 조명 gain 을 줄인다
 *  - 조명이 없음(너무 어두움): 경고만. 유리 아래는 그냥 검은 밤이 된다
 *  - 지배 조명 색이 라임(동작색)·산호(danger)와 겹침: 경고. 값은 손대지 않는다 —
 *    사용자가 사진을 바꾸는 게 맞다
 */

export type SceneStats = {
  meanLuma: number;        // 원본 평균 밝기 0~1
  coverage: number;        // 조명으로 잡힌 픽셀 비율 0~1
  dominantHue: number | null; // 조명 지배 색상각 0~360, 조명 없으면 null
  overlay: [number, number];  // 유리 불투명도 [위, 아래]
  bytes: number;           // data URI 길이
};

export type SceneResult = {
  /** `--bg-scene` 에 넣을 값 */
  scene: string;
  stats: SceneStats;
  warnings: string[];
};

/** 선택기에서 고르는 디테일 단계 → 축소 폭 */
export const SCENE_DETAIL = { lights: 96, silhouette: 192, shapes: 320 } as const;
export type SceneDetail = keyof typeof SCENE_DETAIL;

export type SceneOptions = {
  /** 축소 폭. 기본 96 — 빛 분포만 남는다. 192 면 실루엣이 조금, 320 이면 형체가 보인다.
   *  블러 반경은 폭에 비례하므로 "번짐 정도"는 같고 디테일만 달라진다. 크기: 96≈1.6KB, 192≈5KB, 320≈12KB */
  width?: number;
  /** 유리 색 (지면색). 기본 night-city 지면 rgb(4 10 20) */
  glass?: [number, number, number];
  /** 지면 위 보조 글자(fg-muted)의 상대 밝기. 유리 불투명도 계산에 쓴다. 기본 steel-200 */
  textLuma?: number;
};

const GLASS_DEFAULT: [number, number, number] = [4, 10, 20];
const TEXT_LUMA_DEFAULT = 0.4; // #93adc0

function srgbToLinear(c: number) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luma(r: number, g: number, b: number) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}
function percentile(sorted: Float32Array, p: number) {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}
function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export async function buildSceneFromImage(
  source: HTMLImageElement | ImageBitmap,
  options: SceneOptions = {},
): Promise<SceneResult> {
  const W = options.width ?? 96;
  const glass = options.glass ?? GLASS_DEFAULT;
  const textLuma = options.textLuma ?? TEXT_LUMA_DEFAULT;
  const warnings: string[] = [];

  const sw = source.width, sh = source.height;
  const H = Math.max(8, Math.round((W * sh) / sw));

  // 1. 축소
  const base = document.createElement("canvas");
  base.width = W; base.height = H;
  const bctx = base.getContext("2d", { willReadFrequently: true })!;
  bctx.drawImage(source, 0, 0, W, H);
  const img = bctx.getImageData(0, 0, W, H);
  const px = img.data;
  const n = W * H;

  // 밝기·채도 계산
  const L = new Float32Array(n), S = new Float32Array(n), Hh = new Float32Array(n);
  let sumL = 0;
  for (let i = 0; i < n; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const l = luma(r, g, b); L[i] = l; sumL += l;
    const [h, s] = hsl(r, g, b); S[i] = s; Hh[i] = h;
  }
  const meanLuma = sumL / n;
  const sorted = Float32Array.from(L).sort();

  // 2. 조명 추출 — 가드: 밝은 사진이면 기준을 올리고 바닥을 더 어둡게
  let thresholdP = 0.8, darkBase = 0.55, gain = 1.6;
  if (meanLuma > 0.45) {
    thresholdP = 0.92; darkBase = 0.3; gain = 1.3;
    warnings.push("밝은 사진(낮·흰 배경)이라 조명 기준을 올리고 바닥을 더 어둡게 눌렀어요. 도시 야경보다 밋밋할 수 있어요.");
  } else if (meanLuma > 0.25) {
    thresholdP = 0.86; darkBase = 0.45;
  }
  const thr = percentile(sorted, thresholdP);
  const score = new Float32Array(n);
  let covered = 0;
  const hueBins = new Float32Array(36);
  for (let i = 0; i < n; i++) {
    const t = thr >= 1 ? 0 : Math.max(0, (L[i] - thr) / (1 - thr));
    const sc = Math.min(1, t * (0.5 + 0.5 * S[i]) * 1.5);
    score[i] = sc;
    if (sc > 0.3) { covered++; hueBins[Math.floor(Hh[i] / 10) % 36] += sc * (0.3 + S[i]); }
  }
  const coverage = covered / n;
  if (coverage > 0.3) {
    gain = 1.0;
    warnings.push("밝은 영역이 화면의 30%를 넘어요. 조명을 약하게 잡았지만 '빛'이 아니라 '얼룩'처럼 보일 수 있어요.");
  }
  if (coverage < 0.02) {
    warnings.push("조명으로 잡을 만큼 밝고 색 있는 부분이 거의 없어요. 유리 아래가 그냥 어두운 밤이 돼요.");
  }
  let dominantHue: number | null = null;
  if (covered > 0) {
    let best = 0;
    for (let k = 1; k < 36; k++) if (hueBins[k] > hueBins[best]) best = k;
    dominantHue = best * 10 + 5;
    if (hueDistance(dominantHue, 69) < 25) warnings.push("조명 색이 라임(동작색)과 겹쳐요. 주 버튼이 배경에 묻힐 수 있어요.");
    if (hueDistance(dominantHue, 5) < 20) warnings.push("조명 색이 산호(danger)와 겹쳐요. 삭제·오류 표시가 덜 눈에 띌 수 있어요.");
  }

  // 조명 키우기 / 나머지 어둡게
  for (let i = 0; i < n; i++) {
    const k = darkBase + gain * score[i];
    px[i * 4] = Math.min(255, px[i * 4] * k);
    px[i * 4 + 1] = Math.min(255, px[i * 4 + 1] * k);
    px[i * 4 + 2] = Math.min(255, px[i * 4 + 2] * k);
  }
  bctx.putImageData(img, 0, 0);

  // 3. 빛번짐 — 좁은 블러 + 넓은 블러를 겹친다 (캔버스에 구워서 런타임 필터 없음)
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const octx = out.getContext("2d", { willReadFrequently: true })!;
  const blurS = Math.max(1, Math.round(W / 48)), blurL = Math.max(2, Math.round(W / 24));
  octx.filter = `blur(${blurS}px) saturate(1.4)`;
  octx.drawImage(base, 0, 0);
  octx.filter = `blur(${blurL}px) saturate(1.6)`;
  octx.globalAlpha = 0.5;
  octx.globalCompositeOperation = "lighter";
  octx.drawImage(base, 0, 0);
  octx.globalAlpha = 1; octx.globalCompositeOperation = "source-over"; octx.filter = "none";

  // 4. 유리 불투명도 — 구운 결과의 p85 밝기 기준으로 fg-muted 가 4.5:1 을 지키게.
  //    최대값(p100)이나 p95 를 쓰면 작은 하이라이트 하나가 유리를 검게 만든다 — 글자가 실제로
  //    앉는 "넓은 영역" 기준이 p85. 상한 86% (그 이상은 사진이 의미 없다)
  const baked = octx.getImageData(0, 0, W, H).data;
  const bakedL = new Float32Array(n);
  for (let i = 0; i < n; i++) bakedL[i] = luma(baked[i * 4], baked[i * 4 + 1], baked[i * 4 + 2]);
  const p85 = percentile(Float32Array.from(bakedL).sort(), 0.85);
  const glassL = luma(glass[0], glass[1], glass[2]);
  // (textLuma + .05) / (composite + .05) >= 4.5  →  composite <= (textLuma + .05)/4.5 - .05
  const maxComposite = (textLuma + 0.05) / 4.5 - 0.05;
  // composite = a*glassL + (1-a)*p95  →  a >= (p95 - maxComposite) / (p95 - glassL)
  let bottom = p85 > maxComposite ? (p85 - maxComposite) / (p85 - glassL) : 0.72;
  bottom = Math.min(0.86, Math.max(0.72, bottom));
  const top = Math.min(0.94, bottom + 0.14);
  if (bottom >= 0.84) warnings.push("사진이 밝아서 유리를 많이 어둡게 덮었어요. 사진이 거의 안 보일 수 있어요.");

  const uri = out.toDataURL("image/webp", 0.8);
  const g = `rgb(${glass[0]} ${glass[1]} ${glass[2]}`;
  const scene = `linear-gradient(180deg, ${g} / ${top.toFixed(2)}) 0%, ${g} / ${bottom.toFixed(2)}) 100%), url("${uri}")`;

  return {
    scene,
    stats: { meanLuma, coverage, dominantHue, overlay: [top, bottom], bytes: uri.length },
    warnings,
  };
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
