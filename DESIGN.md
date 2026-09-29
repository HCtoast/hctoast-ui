# 개인 UI 프레임워크 — 디자인 규칙

> 이 문서가 단일 진실 공급원(single source of truth). 색·간격·타이포에 대한 판단이 필요하면 여기서 찾고, 여기 없으면 새로 만들지 말고 먼저 이 문서를 갱신한다.

## 0. 한 줄 정체성

**따뜻한 아이보리 지면 + 올리브(day)/라임(night) 동작색 + 12px 이상 둥근 모서리 + 중간 밀도.**
얇은 테두리와 낮은 그림자를 함께 써서 면을 구분한다.

---

## 1. 테마

| 테마 | `data-theme` | 지면 | 동작색 | 용도 |
|---|---|---|---|---|
| **day** | (없음, 기본) | `#f7f4ea` 아이보리 | `#656c1b` 올리브유 | **기본 테마.** 이탈리아 올리브 사이트류의 노란 올리브 |
| **night** | `night` | `#0c0c0d` 뉴트럴 다크 | `#8a9c2c` 올리브유 | day의 페어 다크. **저조도** — 글자·동작색·상태색을 한두 단계 내림 |
| **night-city** | `night-city` | `#0b1420` 강철 남색 | `#c9d96b` 라임 | 사이버펑크 2077 나이트시티. 비 젖은 밤 + 시안 네온 accent. 라임을 가장 밝게 쓴다 |
| **night-lavender** | `night-lavender` | `#0f1540` 청보라 | `#c4d36a` 라임 | 명조 호나미 시티. 청보라 하늘 + 등나무 라벤더 벚꽃 accent + 등불 |

- `data-theme` 미지정 시 `prefers-color-scheme`을 따라 day ↔ night 자동 전환.
- **시그니처는 테마마다 갈린다.** day = 올리브유 `#656c1b`(색상각 65°), night = 올리브유의 어두운 판 `#8a9c2c`, night-city / night-lavender = 라임 `#c9d96b`(69°). 같은 초록 계열이라 색감은 이어지고 명도만 크게 달라서, 같은 버튼이 테마를 넘어가도 낯설지 않다. 라이트에서 라임을 쓰지 않는 건 대비(흰 글자 위 1.4:1) 때문이기도 하다.
- 올리브의 기준은 실제 잎 색(회녹)이 아니라 **이탈리아 올리브 관련 사이트·올리브유 색**이다. 회녹 올리브로 뉴트럴까지 틴트한 안은 비교 후 기각했다 — 색 자체가 그 자연을 연상시키는 쪽이 취향. 레퍼런스는 `reference/day/`.
- 라이트에서 흰 글자를 얹을 수 있는 가장 밝은 올리브유가 `#656c1b`다. 레퍼런스 사이트의 `#859626`(= `lime-600`)은 흰 글자 대비 3.3:1로 AA 미달이라 그대로 못 쓴다.
- `accent`(day `#a1ab2b`, night `#c9d96b`)는 **텍스트로 절대 쓰지 않는다** (아이보리 위 2.3:1 / 1.4:1). 채우기·장식·다크 텍스트 전용.
- **밝은 채움 위 글자·아이콘은 검정.** 동작색·accent·솔리드 뱃지처럼 명도가 높은 채움에는 `fg-on-action` / `fg-on-accent` / `fg-on-solid`를 얹는다. `text-fg`는 지면 위에서만 — 다크 테마에서 밝은 채움 위에 올리면 흰 글자가 되어 안 보인다. 채움이 어두운 경우(night의 accent `#5f6e1a`)만 토큰이 밝은 값을 갖는다.

## 2. 색 토큰

컴포넌트는 원시 팔레트(`--color-lime-400` 등)를 직접 참조하지 않는다. **시맨틱 토큰만 사용.**

| 토큰 | 역할 | day | night |
|---|---|---|---|
| `bg` | 페이지 지면 | `#f7f4ea` | `#0c0c0d` |
| `bg-inset` | 움푹 들어간 영역(코드블록, 트랙) | `#ebe6d6` | `#08080a` |
| `surface` | 카드·패널 | `#faf7ec` | `#151517` |
| `surface-raised` | 팝오버·모달·드롭다운 | `#fffdf7` | `#1d1d20` |
| `border` | 기본 테두리 | `#e3decd` | `#2a2a2e` |
| `border-strong` | 인풋 테두리, 강조 구분선 | `#cdc6b0` | `#3a3a40` |
| `fg` | 본문 | `#1c1b16` | `#d9d9db` |
| `fg-muted` | 보조 설명 | `#6b6759` | `#97979c` |
| `fg-subtle` | 플레이스홀더·비활성 | `#918c7c` | `#66666c` |
| `action` | 주 버튼, 링크, 포커스 | `#656c1b` | `#8a9c2c` |
| `action-hover` | 호버·프레스 | `#4f5515` | `#9aad38` |
| `action-soft` | 선택 상태 배경, 뱃지 | `#eef4c9` | 동작색 14% |
| `fg-on-action` | 동작색 위 텍스트 | `#ffffff` | `#14180a` |
| `fg-on-danger` | danger 솔리드 위 텍스트 | `#ffffff` | `#1c130f` |
| `fg-on-solid` | 채도 높은 채움(솔리드 뱃지 등) 위 텍스트 | `#ffffff` | `#1c130f` |
| `fg-on-accent` | `accent` 채움 위 텍스트·아이콘 | `#1c1b16` | `#ececed` (city `#06202a` / lavender `#1a1533`) |
| `overlay` | 모달 백드롭 | `rgb(28 27 22 / .45)` | `rgb(0 0 0 / .6)` |
| `accent` | 장식 전용 — 그 테마의 "빛" | `#a1ab2b` 올리브유 | `#5f6e1a` (city 시안 `#42a5be` / lavender 라벤더 `#b39be0`) |
| `hover` | 호버·하이라이트 배경 (뉴트럴 리프트) | `fg` 8% | `fg` 8% |
| `selection` | 드래그 하이라이트 (`::selection` 전용) | `accent` 30% | `accent` 30% |
| `bg-scene` | 조명 그라데이션 층 (body 전용, 유틸 없음) | 위에서 은은한 햇살 | 없음 (city 물웅덩이 시안 반사 / lavender 등불 + 하늘) |

### 상태색
라임과 색상이 겹치지 않게 의도적으로 분리했다. **success를 초록으로 쓰지 않는 게 핵심** — 동작색이 이미 연두라 구분이 안 된다. 대신 청록으로 밀었다.

| 토큰 | day | night | 비고 |
|---|---|---|---|
| `danger` | `#b03a2e` | `#d4766b` | 삭제·오류. city `#e07f76` / lavender `#ff8a76` |
| `warning` | `#8a6410` | `#cfa040` | 주의. city `#d4a24f` / lavender `#f2b544` |
| `success` | `#17715c` | `#4bb092` | 청록 계열. city `#4fae95` / lavender `#57c9a8` |
| `info` | `#3f5f9e` | `#7f9dd2` | 안내. city `#7396d9` / lavender `#93ace4` |

모든 텍스트 조합은 WCAG AA(4.5:1) 이상 검증 완료. 유일한 예외가 위에 적은 `accent`.

### 한 화면에 쓰는 색 개수
동작색 1 + 지면/테두리/텍스트(뉴트럴) + 상태색 최대 2개. 총 유채색은 **3개를 넘기지 않는다** (많아도 5개).

## 3. 간격

베이스 4px, **레이아웃 간격은 8의 배수**(8 / 16 / 20 / 24 / 40 / 48). 홀수 간격이 필요하면 레이아웃이 잘못된 것.

| 용도 | 값 |
|---|---|
| 아이콘–텍스트, 인라인 요소 사이 | 8px |
| 폼 라벨–인풋, 리스트 아이템 내부 | 8px |
| **컨트롤(버튼·인풋) 좌우 안쪽 패딩** | sm 12px / md 16px / lg 24px |
| 카드 내부 패딩 (중간 밀도) | 16px ~ 20px |
| 섹션 내 블록 사이 | 24px |
| 섹션 사이 | 40px |
| 페이지 상하 여백 | 48px ~ 64px |

> 12px(`px-3`)는 **컨트롤 내부 좌우 패딩 한정** 예외다. 요소 사이 간격이나 그 밖의 패딩에는 쓰지 않는다.

**밀도 = 중간.** 버튼 높이 40px, 인풋 높이 40px, 컴팩트 변형은 32px, 라지는 48px.

## 4. 타이포

`text-body` 처럼 **정해진 유틸리티만** 사용. `text-[15px]`, `text-sm font-medium` 같은 조합 금지 — 유틸리티 하나가 크기·행간·굵기·자간·**폰트**를 모두 결정한다.

**본문/제목 스케일 (10종)**

| 유틸 | 크기/행간 | 굵기 | 폰트 | 용도 |
|---|---|---|---|---|
| `text-display` | 40/48 | 700 | **제목 폰트** | 랜딩 헤드라인 |
| `text-h1` | 32/40 | 700 | **제목 폰트** | 페이지 제목 |
| `text-h2` | 24/32 | 600 | 본문 폰트 | 섹션 제목 |
| `text-h3` | 20/28 | 600 | 본문 폰트 | 카드 제목 |
| `text-body-lg` | 17/28 | 400 | 본문 폰트 | 리드 문단 |
| `text-body` | 15/24 | 400 | 본문 폰트 | **기본 본문** |
| `text-body-sm` | 13/20 | 400 | 본문 폰트 | 보조 설명 |
| `text-label` | 13/16 | 600 | 본문 폰트 | 폼 라벨 |
| `text-caption` | 12/16 | 400 | 본문 폰트 | 캡션, 타임스탬프 |
| `text-code` | 13/20 | 400 | mono | 코드 |

**컨트롤 라벨 (3종)** — 버튼처럼 크기 변형이 있는 컨트롤의 텍스트. 버튼 크기에 1:1 대응하고, 컴포넌트 `cva`의 size 변형 안에서만 쓴다.

| 유틸 | 크기/행간 | 굵기 | 대응 |
|---|---|---|---|
| `text-label-sm` | 13/16 | 600 | 버튼 sm (32) |
| `text-label-md` | 14/20 | 600 | 버튼 md (40) |
| `text-label-lg` | 15/24 | 600 | 버튼 lg (48) |

**아이콘 크기 (3종)** — 텍스트와 같은 px로 맞추면 커 보이므로 한 단계 키운다. 컨트롤 안에서는 라벨 크기에 짝지어 쓴다.

| 유틸 | 크기 | 짝 |
|---|---|---|
| `icon-sm` | 16 | `text-label-sm` / `text-body-sm` |
| `icon-md` | 18 | `text-label-md` / `text-body` |
| `icon-lg` | 20 | `text-label-lg` / `text-body-lg` |

### 두 폰트 체계

- **본문 폰트 = Pretendard.** `--font-sans`
- **제목 폰트 = 고운바탕.** `--font-display`
- **경계는 32px(h1).** `text-display`(40)와 `text-h1`(32)만 고운바탕이고, `text-h2`(24) 이하는 전부 Pretendard다.
- **숫자 강조(스탯 값)는 예외**로 `font-display`를 붙여도 된다.
- 전환 지점은 `@utility` 정의 안에 박혀 있어서 **사용처에서 폰트를 고를 일이 없다.** 이게 두 폰트를 쓰면서도 일관성이 무너지지 않는 유일한 방법이다.

#### 경계를 24px이 아니라 32px에 둔 이유

고운바탕은 굵기가 **400과 700 둘뿐**이고 그 사이(SemiBold 600)가 없다. `text-h2`는 600으로 설계돼 있어서, 여기까지 제목 폰트를 올리면 브라우저가 700으로 올려 렌더링한다. 그러면 24px 섹션 제목이 32px 페이지 제목과 같은 굵기로 나가고, 크기 차이만 남아 위계가 흐려진다.

경계를 32px로 올리면 제목 폰트를 쓰는 자리가 **display(40/700)와 h1(32/700) 둘뿐**이 되고, 둘 다 700이라 없는 굵기를 요구할 일이 아예 사라진다. 굵기가 두 단계인 폰트를 안전하게 쓰는 방법은 **범위를 좁히는 것**이지 굵기를 늘리는 게 아니다.

부수 효과로 h2가 Pretendard 600이 되면서, 본문에 가까운 자리는 전부 한 폰트로 통일된다. 큰 제목만 다른 얼굴을 갖는 구조가 더 또렷해진다.

### 폰트 로딩

Pretendard는 Google Fonts에 없고 고운바탕은 있어서, 둘을 다른 경로로 가져온다.

```html
<!-- 고운바탕 (Google Fonts) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap">
```

```bash
# Pretendard (npm)
npm i pretendard
```
```css
/* 진입 CSS, theme.css 보다 위 */
@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
```

Next.js에서 `next/font/google`을 쓸 경우, 고운바탕은 `subsets`에 `"latin"`만 넣는다. **`"korean"`은 넣지 않는다** — `next/font/google`의 Gowun Batang 타입은 `latin | latin-ext | vietnamese`만 허용하고 `"korean"`을 주면 `TS2322`로 빌드가 깨진다. 고운바탕은 한글이 별도 서브셋 파일로 쪼개져 있지 않고 웨이트 파일 하나가 한글 글리프를 통째로 포함하는 폰트라, `"latin"`만으로도 한글이 정상으로 내려온다(day/night/night-blue 렌더 확인 완료).

> 서브셋이 쪼개진 폰트(Noto Sans KR 등)라면 `"korean"` 누락 시 한글이 조용히 폴백되는 게 맞다. 고운바탕은 그 부류가 아니다.

```ts
import { Gowun_Batang } from "next/font/google";

export const display = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun",
});
```
```css
/* theme.css */
--font-display: var(--font-gowun), var(--font-sans);
```

> 구현 주의: Tailwind v4의 `--text-*` 테마 변수는 `--line-height` / `--letter-spacing` / `--font-weight` 수정자만 지원하고 **font-family 수정자가 없다.** 그래서 타이포 스케일을 테마 변수가 아니라 `@utility`로 정의했다.

## 5. 모서리

12px 이상이 취향. 8px는 뱃지·체크박스처럼 작은 요소에만.

| 토큰 | 값 | 적용 |
|---|---|---|
| `rounded-sm` | 8px | 뱃지, 체크박스, 작은 칩 |
| `rounded-md` | 12px | 버튼, 인풋, 셀렉트, 탭 |
| `rounded-lg` | 16px | 카드, 팝오버, 드롭다운 |
| `rounded-xl` | 24px | 모달, 시트, 대형 패널 |
| `rounded-full` | ∞ | 아바타, 필 버튼, 토글 |

## 6. 면 구분 — 테두리 + 그림자 혼합

둘 중 하나만 고르지 않는다. **높이(elevation)에 따라 조합을 바꾼다.**

| 레벨 | 조합 | 예 |
|---|---|---|
| 0 | 테두리 없음, 그림자 없음 | 페이지 지면 |
| 1 | `border` + `shadow-e1` | 카드, 리스트 아이템 |
| 2 | `border` + `shadow-e2` | 드롭다운, 팝오버, 툴팁 |
| 3 | `border` + `shadow-e3` | 모달, 시트 |

night 열은 저조도 값이다. night-city / night-lavender 의 전체 값은 theme.css 를 본다. night-city 는 상태색도 accent 와 같은 대역으로 가라앉혀 두었다 — 색상은 유지하고 채도·명도만 내려서, 구분은 되고 배경과 싸우지 않는다.

다크 테마에서는 그림자가 잘 안 보이므로 `surface`가 지면보다 밝아지는 것으로 높이를 표현한다 (토큰에 이미 반영됨).

**떠 있는 면(레벨 2·3)은 어떤 테마에서도 불투명하다.** 드롭다운·팝오버·툴팁·모달은 콘텐츠 위에 겹치므로 뒤가 비치면 글자가 겹쳐 읽힌다. night-city 의 "젖은 유리" 반투명은 지면 위에 놓인 레벨 1(`surface`)에만 적용하고, `surface-raised`는 불투명 값을 쓴다. 새 테마를 만들 때도 같은 규칙.

## 7. 인터랙션

- **포커스 링은 전역 `:focus-visible`로 한 번만 정의.** 컴포넌트에서 개별 구현 금지. `outline: 2px solid var(--action); outline-offset: 2px`
- 호버: 주 버튼은 `action-hover`, 그 외(보조·고스트·메뉴 항목)는 배경 `hover`(fg 8% 뉴트럴 리프트). `action-soft`는 호버에 쓰지 않는다 — 그건 "동작색 표시"(action 뱃지, 선택된 상태)다. 투명도(opacity) 변경으로 호버를 표현하지 않는다.
- 드래그 하이라이트(`::selection`)는 `selection` 토큰(그 테마의 accent 30%). 전역 한 번만 정의.
- **슬라이더 스냅**: 드래그 중엔 손잡이가 포인터를 그대로 따라오고, 놓는 순간 가까운 눈금(`snap`)에 달라붙는다. 붙는 120ms 만 `transition-snap`(left) — 레이아웃 속성을 트랜지션하는 **유일한 예외**. 절대 위치의 작은 손잡이라 리플로 비용이 없다. 다른 곳에 쓰지 않는다. 손잡이 변형 5종(dot·pill·ring·bar·knob)은 `thumb` prop. **정렬 기하**: 트랙은 손잡이 반 폭만큼 들이고(채움 끝 = 손잡이 중심) 루트는 같은 만큼 음수 마진으로 내민다(트랙 = 옆 글자 열). 손잡이만 양 끝에서 튀어나오므로 부모에 `overflow-hidden` 금지. 라벨·값·트랙 조합은 `SliderField`로 — 손으로 짜면 열이 어긋난다. 가로로 나란히 둘 땐 열 사이 26px 이상(손잡이 돌출 10 + 최소 간격 16, 한쪽 침범 기준) — 척도에서는 `gap-10`(40). 32 를 척도에 넣으면 `gap-8` 도 가능; 인라인 배치는 슬라이더 칸에 손잡이 반 폭 안쪽 여백을 둬서 라벨·값과 gap-4 가 온전히 남는다. `tests/slider.spec.ts`가 다섯 변형의 정렬을 0px 로 검증한다.
- 트랜지션은 `--duration-base 180ms` + `--ease-out-soft`가 기본. 색/그림자만 트랜지션하고 레이아웃 속성은 건드리지 않는다. 컴포넌트는 `transition-base` 유틸리티 하나로 적용한다 (Tailwind v4에 `--duration-*` 네임스페이스가 없어 `@utility`로 묶음). `transition-colors` 등 Tailwind 기본 트랜지션 유틸은 쓰지 않는다.
- **오버레이 등장/퇴장** — Radix 오버레이(Dialog·DropdownMenu·Popover·Tooltip·Select)는 `animate-fade-in`/`animate-fade-out`(백드롭), `animate-pop-in`/`animate-pop-out`(패널)만 쓴다. 페이드 + 2% 스케일이 전부고 레이아웃 속성은 안 움직인다. `data-[state=open]:animate-* data-[state=closed]:animate-*` 로 건다. 별도 애니메이션 라이브러리(`tw-animate-css` 등)를 넣지 않는다.
- `prefers-reduced-motion` 대응은 base 레이어에 이미 있음 (애니메이션 0.01ms로 무력화).

## 8. 컴포넌트 규칙

- 변형(variant)은 **cva**로 정의. 조건부 className 문자열 조합 금지.
- 모든 컴포넌트는 `className` prop을 받아 `cn()`으로 병합한다.
- 원자 컴포넌트는 상태를 갖지 않는다 (controlled 우선).
- 접근성은 Radix UI 프리미티브에 위임 — 드롭다운·다이얼로그·툴팁·셀렉트·탭·팝오버를 직접 구현하지 않는다. `radix-ui` 통합 패키지(`import { Dialog } from "radix-ui"`)를 직접 래핑하고 className만 우리 토큰으로 얹는다. shadcn 산출물은 우리 토큰 체계와 안 맞아 재작성 비용이 더 크다.
- 면 레벨: Dialog = 레벨 3(`surface-raised` + `shadow-e3` + `rounded-xl`), DropdownMenu·Popover·Tooltip·Select 콘텐츠 = 레벨 2(`surface-raised` + `shadow-e2` + `rounded-lg`).

### 버튼 변형 (기준)

| variant | 배경 | 텍스트 | 테두리 |
|---|---|---|---|
| `primary` | `action` | `fg-on-action` | 없음 |
| `secondary` | `surface` | `fg` | `border-strong` |
| `ghost` | 투명 → 호버 시 `action-soft` | `fg` | 없음 |
| `danger` | `danger` | `fg-on-danger` | 없음 |
| `link` | 없음 | `action`, 밑줄 | 없음 |

크기별 높이·좌우패딩·라벨·아이콘:

| size | 높이 | 좌우 패딩 | 라벨 | 아이콘 |
|---|---|---|---|---|
| `sm` | 32 | `px-3` (12) | `text-label-sm` (13) | `icon-sm` (16) |
| `md` (기본) | 40 | `px-4` (16) | `text-label-md` (14) | `icon-md` (18) |
| `lg` | 48 | `px-6` (24) | `text-label-lg` (15) | `icon-lg` (20) |

아이콘–텍스트 간격은 `gap-2` (8). 아이콘은 `[&_svg]:icon-*` 로 size 변형 안에서 지정한다.

### 뱃지 변형

두 세트, 각 6종. `rounded-sm`(8), 높이 20, `text-caption`.

| | 배경 | 텍스트 |
|---|---|---|
| **soft** `neutral` / `action` / `success` / `warning` / `danger` / `info` | `bg-inset` (action은 `action-soft`) | 해당 시맨틱 색 (`fg-muted` / `action` / `success` …) |
| **solid** `*-solid` | 해당 채움색 (neutral은 `fg` 반전) | `fg-on-solid` (neutral은 `bg`) |

soft 가 기본. solid 는 강조가 필요할 때만.

### Dismiss (동그란 X)

무언가를 없애는 작은 원형 버튼. `corner`는 부모(`relative`) 오른쪽 위에 반쯤 걸치고(`-right-2 -top-2`, border-strong + surface-raised + shadow-e1), `inline`은 칩·태그 흐름 안에 놓인다. 크기 sm 24(icon-sm) / md 32(icon-md). 호버는 `bg-hover`. **`aria-label`은 필수**이고 무엇을 없애는지 적는다("발코니 지우기", "완료 필터 해제"). 되돌릴 수 있는 동작(숨기기)과 없는 동작(지우기)은 라벨로 구분한다.

---

## 9. 조명 (scene)

지면은 단색(`bg`)이고, 그 위에 `--bg-scene` 그라데이션 층을 body 배경 이미지로 **한 번만** 덧칠한다. 층은 여러 개를 쌓을 수 있고(먼저 쓴 게 위), 가장자리가 투명한 원형 그라데이션이 빛 번짐, 선형이 하늘이 된다. 스크롤해도 고정.

| 테마 | 조명 이야기 |
|---|---|
| day | 위에서 넓고 은은하게 내려오는 햇살. 구석 글로우는 안 어울려서 뺐다 |
| night | 없음. 저조도의 정체성은 "빛이 없음" |
| night-city | 위는 어둡고 아래 물웅덩이에 시안 네온이 비친다. 표면은 젖은 유리처럼 86% 불투명 |
| night-lavender | 오른쪽 위 등불 온기 + 청보라→보라 하늘 |

규칙: 지면 위에 직접 놓이는 텍스트는 그라데이션의 **가장 밝은 지점**에서도 AA 를 지켜야 한다. 그래서 글로우 불투명도에 상한이 있다(현재 값은 전부 검증됨). 컴포넌트는 조명을 모른다 — `bg-gradient-*` 를 컴포넌트에 쓰지 않는다.

## 10. 미결정 사항

- [x] ~~본문 폰트 확정~~ → **Pretendard**
- [x] ~~제목 폰트 확정~~ → **고운바탕** (적용 범위: display · h1)
- [x] ~~아이콘 세트~~ → **lucide-react**. 크기는 `icon-sm/md/lg`(16/18/20). Dialog·DropdownMenu·Select 인디케이터에서 사용.
- [x] ~~차트/카테고리 팔레트~~ → **`category-palette`** (레지스트리 `registry:lib` 항목). 라임(74°) 앵커 8색 + 무채색, 전부 `hsl(H 34~44% 66%)`. 밝기 66% 통일은 **검은 글자를 얹는 배경** 전제고, 채도를 40% 안팎으로 낮게 잡은 건 카테고리가 주인공이 아니기 때문 — 구분은 hue가 하고 채도는 절제한다(채도를 올리면 색 블록이 내용보다 먼저 보인다). 8색을 넘기면 `hueAt(i)`가 황금각(137.5°)으로 돌려 뽑는다. 상태색과 역할이 다르다(의미 고정 vs 구분만).
- [ ] 차트 팔레트 (라임 앵커로 4~6색 시퀀스)
