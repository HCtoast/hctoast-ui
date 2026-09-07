/**
 * 카테고리 팔레트 — 사용자가 만든 분류(카테고리·태그·프로젝트)에 돌려 쓰는 색.
 *
 * 상태색(danger/warning/success/info)과 **역할이 다르다.** 상태색은 의미가 고정돼 있고,
 * 이건 의미 없는 라벨에 구분만 주는 용도다. "쇼핑" 카테고리는 warning이 아니다.
 *
 * ## 왜 HSL 문자열인가
 * CSS 토큰이 아니라 **데이터**다. DB에 저장되고, 사용자가 색을 바꾸고, 렌더링 시점에
 * 밝기를 파생시키는 식으로 쓰인다. 그래서 `hsl(H S% L%)` 문자열로 두어
 * 파싱·조작이 쉽게 했다. CSS 변수로 쓰고 싶으면 그대로 넣으면 된다.
 *
 * ## 밝기 L = 66, 채도 34~44%
 * 블록/칩 배경으로 깔고 그 위에 **검은 글자**를 얹는 전제로 잡았다.
 * 어두운 배경 + 흰 글자 조합을 쓸 거면 `shiftLightness`로 내려서 쓴다.
 *
 * 밝기를 한 값으로 통일해야 여러 카테고리가 나란히 있을 때 하나만 튀지 않는다.
 * 채도를 40% 안팎으로 낮게 잡은 건 **카테고리는 주인공이 아니기 때문**이다 —
 * 채도를 올리면 구분은 잘 되지만 색 블록이 화면 앞으로 튀어나와서, 정작 읽어야 할
 * 내용(제목·시간)보다 색이 먼저 보인다. 구분은 hue가 하고, 채도는 절제한다.
 *
 * ## 순서
 * 라임(시그니처)에서 출발해 색상환을 돈다. 인접한 두 개가 최대한 안 닮도록
 * 배열 순서를 섞어뒀다 — 카테고리를 위에서부터 자동 배정할 때 바로 옆이 비슷하면 안 된다.
 */

export interface CategoryColor {
  /** 안정적인 참조용 키 */
  readonly key: string;
  /** 한국어 이름 (UI 색 선택기에 그대로 쓸 수 있게) */
  readonly label: string;
  /** `hsl(H S% L%)` 정규 형식 */
  readonly hsl: string;
}

/** 카테고리 배경의 기준 밝기(%). 검은 글자가 읽히는 하한. */
export const CATEGORY_LIGHTNESS = 66;

/** 기준 채도(%). 이 근처를 벗어나면 한 카테고리만 튄다. */
export const CATEGORY_SATURATION = 38;

/**
 * 기본 8색. 이 이상 필요하면 `hueAt()`으로 늘린다.
 * 라임(74)이 앵커고, 나머지는 그 주위를 도는 순서.
 *
 * 채도가 색마다 조금씩 다른 건 오타가 아니다 — 노랑·주황 계열은 같은 채도값에서
 * 눈에 더 흐리게 보여서 몇 %p 올려 체감 강도를 맞췄다.
 */
export const CATEGORY_PALETTE: readonly CategoryColor[] = [
  { key: "lime", label: "라임", hsl: "hsl(74 40% 66%)" },
  { key: "blue", label: "파랑", hsl: "hsl(212 40% 66%)" },
  { key: "rose", label: "로즈", hsl: "hsl(352 38% 66%)" },
  { key: "teal", label: "청록", hsl: "hsl(168 34% 66%)" },
  { key: "amber", label: "앰버", hsl: "hsl(36 44% 66%)" },
  { key: "violet", label: "보라", hsl: "hsl(268 34% 66%)" },
  { key: "sky", label: "하늘", hsl: "hsl(194 38% 66%)" },
  { key: "coral", label: "코랄", hsl: "hsl(14 42% 66%)" },
] as const;

/** 어디에도 속하지 않는 것(미분류·외부 일정)의 무채색. */
export const CATEGORY_NEUTRAL: CategoryColor = {
  key: "neutral",
  label: "회색",
  hsl: "hsl(220 8% 66%)",
};

/**
 * 팔레트를 넘어서는 개수가 필요할 때 쓰는 hue 생성기.
 *
 * 황금각(137.5°)으로 돌린다. 균등 분할과 달리 몇 개를 뽑든 이미 뽑은 색과
 * 겹치지 않는다 — 카테고리가 몇 개까지 늘지 모를 때 쓰기 좋다.
 */
export function hueAt(index: number): number {
  const LIME_ANCHOR = 74;
  return (LIME_ANCHOR + index * 137.5) % 360;
}

/** `hueAt`으로 만든 hue를 팔레트와 같은 밝기/채도 규격의 색 문자열로. */
export function categoryColorAt(index: number): string {
  if (index < CATEGORY_PALETTE.length) return CATEGORY_PALETTE[index].hsl;
  const hue = Math.round(hueAt(index) * 10) / 10;
  return `hsl(${hue} ${CATEGORY_SATURATION}% ${CATEGORY_LIGHTNESS}%)`;
}
