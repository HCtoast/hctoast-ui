/* 색 토큰 덮어쓰기 (쇼케이스 "보기 설정 → 색 토큰").
   사용자가 hex 로 시맨틱 색 토큰을 바꿔 보고, 마음에 들면 CSS 로 복사해 theme.css 에 옮기는 실험대.

   덮어쓰기는 <html> 인라인 style 이 아니라 <style id="hctoast-token-overrides"> 한 장에 테마별 선택자로 넣는다.
   - 테마마다 따로 기억한다(같은 action 이라도 day 와 night-city 의 값은 다른 역할이다). 시트에 네 테마를
     다 적어 두면 테마를 바꿀 때 JS 로 다시 칠할 일이 없다.
   - 그 시트만 잠깐 끄면(sheet.disabled) 테마의 "기본값"을 그대로 읽을 수 있다 — 인라인이었으면 기본값을
     따로 계산해야 했다.
   - 선택자는 :root:root[data-theme=…] (0,3,0). theme.css 의 가장 센 규칙이 [data-weather][data-theme] (0,2,0)
     이라 비가 와도 사용자가 고른 색이 이긴다.
   하이드레이션 전 깜빡임을 막으려고 만든 CSS 문자열 자체도 저장해 두고, layout 의 인라인 스크립트가 그걸
   그대로 <style> 로 넣는다(로직을 두 군데 복제하지 않으려고). */

export const THEMES = ["day", "night", "night-city", "night-lavender"] as const;
export type ThemeName = (typeof THEMES)[number];

export const OVERRIDES_KEY = "hctoast-token-overrides";
export const OVERRIDES_CSS_KEY = "hctoast-token-css";
export const OVERRIDES_STYLE_ID = "hctoast-token-overrides";

/* 바꿀 수 있는 토큰. hover·selection 은 fg·accent 에서 파생되므로(color-mix) 목록에 없다 —
   fg 를 바꾸면 호버도, accent 를 바꾸면 드래그 하이라이트도 따라간다.
   action-soft·action-ring 은 action 과 별개의 값이라 action 을 바꿔도 안 따라간다(따로 바꾼다). */
export const TOKEN_GROUPS: { label: string; tokens: string[] }[] = [
  { label: "지면·면", tokens: ["bg", "bg-inset", "surface", "surface-raised", "border", "border-strong", "overlay"] },
  { label: "글자", tokens: ["fg", "fg-muted", "fg-subtle", "fg-on-action", "fg-on-danger", "fg-on-solid", "fg-on-accent"] },
  { label: "동작·장식", tokens: ["action", "action-hover", "action-soft", "accent"] },
  { label: "상태", tokens: ["danger", "danger-hover", "warning", "success", "info"] },
];
export const TOKENS = TOKEN_GROUPS.flatMap((g) => g.tokens);

export type Overrides = Partial<Record<ThemeName, Record<string, string>>>;

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** "#abc" · "abc" · "#aabbccdd" 모두 받아 소문자 #rrggbb(aa) 로 펼친다. 올바르지 않으면 null.
 *  펼치는 까닭: 색 고르기(<input type="color">)가 #rrggbb 만 받고, 알파를 지킬 때 뒤 두 자리를 잘라 쓴다 */
export function normalizeHex(input: string): string | null {
  const v = input.trim().toLowerCase();
  const withHash = v.startsWith("#") ? v : `#${v}`;
  if (!HEX.test(withHash)) return null;
  const d = withHash.slice(1);
  return d.length <= 4 ? `#${[...d].map((c) => c + c).join("")}` : withHash;
}

function selectorFor(theme: ThemeName) {
  // data-theme 이 없으면 테마 버튼은 day 로 보이므로 day 덮어쓰기를 같이 건다
  return theme === "day"
    ? ':root:root[data-theme="day"], :root:root:not([data-theme])'
    : `:root:root[data-theme="${theme}"]`;
}

export function overridesCss(o: Overrides): string {
  return THEMES.map((t) => {
    const entries = Object.entries(o[t] ?? {}).filter(([k, v]) => TOKENS.includes(k) && HEX.test(v));
    if (entries.length === 0) return "";
    return `${selectorFor(t)}{${entries.map(([k, v]) => `--${k}:${v};`).join("")}}`;
  }).join("");
}

/** theme.css 에 붙여넣을 모양 */
export function overridesSnippet(theme: ThemeName, values: Record<string, string>): string {
  const lines = Object.entries(values).map(([k, v]) => `  --${k}: ${v};`);
  return `[data-theme="${theme}"] {\n${lines.join("\n")}\n}\n`;
}

function styleEl(): HTMLStyleElement {
  let el = document.getElementById(OVERRIDES_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = OVERRIDES_STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function readOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

export function writeOverrides(o: Overrides) {
  const css = overridesCss(o);
  styleEl().textContent = css;
  try {
    if (css) {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
      localStorage.setItem(OVERRIDES_CSS_KEY, css);
    } else {
      localStorage.removeItem(OVERRIDES_KEY);
      localStorage.removeItem(OVERRIDES_CSS_KEY);
    }
  } catch {
    // 저장 실패는 무시 — 이번 세션에서만 적용
  }
}

/* ---------- 지금 테마의 기본값 읽기 ----------
   덮어쓰기 시트를 잠깐 끄고, 숨은 탐침 요소의 color 를 var(--토큰) 으로 두어 계산된 색을 읽는다.
   getPropertyValue("--x") 를 바로 읽으면 "color-mix(in oklab, …)" 같은 식이 그대로 나와서,
   브라우저가 색으로 풀어 준 값을 캔버스에 한 번 칠해 RGBA 를 얻는다(oklab·color() 표기도 여기서 풀린다). */

let ctx: CanvasRenderingContext2D | null = null;

function cssColorToHex(css: string): string | null {
  if (!ctx) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
  }
  // 못 읽는 색이면 fillStyle 이 안 바뀐다 — 표지 색으로 가려낸다
  ctx.fillStyle = "#010203";
  ctx.fillStyle = css;
  if (ctx.fillStyle === "#010203" && !/^#010203/i.test(css)) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}${a < 255 ? h(a) : ""}`;
}

export function readDefaults(): Record<string, string> {
  const el = document.getElementById(OVERRIDES_STYLE_ID) as HTMLStyleElement | null;
  const sheet = el?.sheet ?? null;
  if (sheet) sheet.disabled = true;
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  const out: Record<string, string> = {};
  try {
    for (const t of TOKENS) {
      probe.style.color = `var(--${t})`;
      out[t] = cssColorToHex(getComputedStyle(probe).color) ?? "";
    }
  } finally {
    probe.remove();
    if (sheet) sheet.disabled = false;
  }
  return out;
}
