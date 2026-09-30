# UI 작업 규칙 (AI 필독)

이 프로젝트의 UI는 개인 디자인 시스템을 따른다. **아래 규칙은 예외 없이 지킨다.**
전체 근거와 표는 `DESIGN.md`, 토큰 실체는 theme.css 하나(이 저장소에선 `registry/theme.css`, 컴포넌트를 받아 쓰는 프로젝트에선 `app/theme.css`)에 있다.

## 절대 규칙

1. **임의값 문법 금지.** `bg-[#c9d96b]`, `p-[13px]`, `text-[15px]`, `rounded-[10px]` 전부 금지. 필요한 토큰이 없으면 만들어 쓰지 말고 **"토큰이 없습니다"라고 말하고 멈춘다.** 예외: 자손 선택자 변형(`[&>svg]:...`, `data-[state=open]:...`)과 Radix 런타임 CSS 변수 참조(`w-(--radix-select-trigger-width)` 등 위치 계산용)는 디자인값 하드코딩이 아니므로 허용.
2. **원시 색 금지.** `bg-lime-400`, `text-gray-500`, `border-slate-200` 같은 Tailwind 기본 팔레트나 원시 스케일을 컴포넌트에서 직접 쓰지 않는다. 시맨틱 토큰만: `bg-bg` `bg-bg-inset` `bg-surface` `bg-surface-raised` `bg-fg` · `text-fg` `text-bg` `text-fg-muted` `text-fg-subtle` · `border-border` `border-border-strong` · `bg-action` `bg-action-hover` `bg-action-soft` `bg-hover` `text-action` `text-fg-on-action` · `bg-danger` `bg-warning` `bg-success` `bg-info` · `text-danger` `text-warning` `text-success` `text-info` · `text-fg-on-danger` `text-fg-on-solid` (채도 높은 채움 위 텍스트) · `bg-accent` `text-fg-on-accent` (accent 채움 위 텍스트·아이콘) · `bg-overlay`. 토큰에 불투명도 단축(`bg-action-soft/60`)은 허용, 임의값(`bg-[...]`)은 금지.
3. **타이포는 정해진 유틸리티만.** 본문/제목 10종: `text-display` `text-h1` `text-h2` `text-h3` `text-body-lg` `text-body` `text-body-sm` `text-label` `text-caption` `text-code`. 컨트롤 라벨 3종(버튼 등 size 변형 안에서만): `text-label-sm` `text-label-md` `text-label-lg`. 아이콘 크기 3종: `icon-sm`(16) `icon-md`(18) `icon-lg`(20) — 텍스트와 같은 px로 맞추지 말고 한 단계 키운다. 어디에도 `font-bold`, `leading-tight`, `tracking-wide` 등을 덧붙이지 않는다 — 유틸리티 하나가 크기·행간·굵기·자간·폰트를 이미 결정한다.
4. **폰트를 직접 지정하지 않는다.** `font-sans`, `font-[Pretendard]`, `style={{fontFamily}}` 전부 금지. 이 시스템은 본문 Pretendard + 제목 고운바탕 두 개를 쓰는데, **어디서 갈아타는지는 타이포 유틸리티가 이미 정해뒀다** — `text-display`(40)와 `text-h1`(32)만 고운바탕, `text-h2`(24) 이하는 전부 Pretendard. 사용처에서 고를 일이 없다. 숫자 강조처럼 예외가 필요하면 `font-display` 유틸리티를 쓴다.
5. **고운바탕에 600(SemiBold)이 없다.** 400과 700뿐이다. `text-display`·`text-h1`은 둘 다 700이라 문제없지만, 고운바탕을 다른 자리에 손으로 얹으면서 500·600을 요구하지 않는다. 요구하면 브라우저가 700으로 올려버려서 굵기 위계가 뭉개진다.
6. **간격은 8의 배수.** `gap-2`(8px) `gap-4`(16px) `gap-5`(20px) `gap-6`(24px) `gap-10`(40px) `gap-12`(48px). 홀수 간격이 필요하다고 느끼면 레이아웃 구조가 잘못된 것이니 구조를 고친다. **유일한 예외:** 버튼·인풋 같은 컨트롤의 좌우 안쪽 패딩에 한해 `px-3`(12px) 허용 (sm 12 / md 16 / lg 24). 요소 사이 간격에는 절대 금지.
7. **모서리는 5단계만.** `rounded-sm`(8, 뱃지·체크박스) `rounded-md`(12, 버튼·인풋) `rounded-lg`(16, 카드·팝오버) `rounded-xl`(24, 모달) `rounded-full`.
8. **포커스 링을 컴포넌트에 넣지 않는다.** 전역 `:focus-visible`이 이미 처리한다. `focus:ring-*`, `focus-visible:outline-*` 추가 금지.
9. **다크모드 클래스를 직접 쓰지 않는다.** `dark:bg-...` 금지. 시맨틱 토큰이 테마별로 이미 다른 값을 갖는다.
10. **장식색(`accent`)을 텍스트로 쓰지 않는다.** 테마마다 값이 다르고(day 올리브유 / night 짙은 올리브 / night-city 시안 / night-lavender 라벤더) 대비를 보장하지 않는다. 채우기·장식·다크 텍스트 전용. **accent 위에 글자·아이콘을 얹을 땐 `text-fg`가 아니라 `text-fg-on-accent`** — 밝은 채움 위 글자는 검정이어야 하고, 다크 테마의 `text-fg`는 흰색이라 안 보인다.
11. **success는 초록이 아니라 청록.** 동작색이 연두라 초록 success는 구분이 안 된다. `text-success` 토큰을 그대로 쓴다.

## 컴포넌트 작성 방식

- 변형은 **cva**로 정의한다. `clsx` 조건부 문자열 나열 금지.
- 모든 컴포넌트는 `className?: string`을 받아 `cn()`으로 마지막에 병합한다.
- 드롭다운·다이얼로그·툴팁·탭·셀렉트는 **직접 구현하지 않고 Radix UI 프리미티브를 감싼다.** 키보드 내비게이션과 ARIA를 손으로 짜지 않는다.
- 원자 컴포넌트는 상태를 갖지 않는다 (controlled 우선). 상태는 사용처에서.
- **호버·하이라이트 배경은 `bg-hover`.** 보조/고스트 버튼 호버, 메뉴 하이라이트, 닫기 버튼 호버 전부. `bg-action-soft`는 "동작색 표시"(action 뱃지, 선택된 상태)에만 쓴다. 드래그 하이라이트(`::selection`)는 전역에서 처리하니 건드리지 않는다.
- **슬라이더는 `SliderField`로 쓴다** (라벨·값·트랙이 한 열). `Slider`를 직접 쓸 땐 라벨 줄과 같은 컨테이너에 두고, **부모에 `overflow-hidden`을 두지 않는다** — 손잡이가 양 끝에서 반 폭 튀어나오는 게 정상이고 잘리면 안 된다. **슬라이더를 가로로 나란히 둘 땐 열 사이 26px 이상** — 손잡이 돌출 10 + 최소 간격 16. 한쪽만 끝에 있는 게 보통이라 양쪽 동시 침범은 안 잡는다. 간격 척도에서 26 이상은 `gap-10`(40)이므로 그걸 쓴다 (32 는 척도에 없다). 세로로 쌓을 땐 `gap-6` 그대로.
- **지면 그라데이션을 컴포넌트에서 만들지 않는다.** 조명은 `--bg-scene` 토큰으로 body 에 한 번만 걸려 있다. `bg-gradient-*` 금지. 비(`data-weather="rain"`)도 body 의 빗줄기 층과 토큰 덮어쓰기로만 표현한다 — 컴포넌트에 비·물방울 효과를 넣지 않는다.
- **상태가 바뀌어도 크기(레이아웃)는 바뀌지 않는다.** 켜짐/꺼짐·선택/비선택·호버·로딩 어느 전환에서도 요소의 너비·높이가 같아야 한다. 그래서 (1) 상태에 따라 아이콘을 조건부로 그리지 않는다 — 자리를 항상 잡아두고 `opacity` 로 숨긴다, (2) 상태별로 굵기(font-weight)를 바꾸지 않는다, (3) 활성일 때만 테두리를 더하지 않는다 — 테두리는 항상 두고 색만 바꾼다(버튼 base 가 `border-transparent`), (4) 라벨 글자를 바꾸지 않는다 — 꼭 바꿔야 하면 `FixedLabel`(후보 문구를 같은 칸에 겹쳐 가장 긴 것이 폭을 잡음)로 감싼다. 토글·스위치와 문구를 한 세트로 다룰 때 문구 쪽을 이걸로 감싸면 세트 전체 크기가 고정된다. 짧은 문구일 때 생기는 빈 공간은 **고정된 쪽(토글)에 글자를 붙이고 유연한 쪽(라벨과의 사이)으로 보낸다** — 토글이 오른쪽이면 `align="end"`. 상태 문구는 가능하면 글자 수를 맞춘다(켜짐/꺼짐, 켜짐/끔 대신). 열거할 수 없는 동적 문구는 FixedLabel 대신 폭 예산(`w-*`/`max-w-*`) + `truncate` + 툴팁, 숫자는 `tabular-nums`. 줄바꿈으로 높이를 바꾸지 않는다. 특정 폭에서 상태 전환이 줄바꿈을 일으키면 이 규칙을 어긴 것이다.
- 새 컴포넌트를 만들기 전에 `components/ui/` 안에 비슷한 게 있는지 먼저 확인한다.

## 면 구분 (elevation)

| 레벨 | 클래스 조합 | 용도 |
|---|---|---|
| 1 | `bg-surface border border-border shadow-e1` | 카드, 리스트 아이템 |
| 2 | `bg-surface-raised border border-border shadow-e2` | 드롭다운, 팝오버 |
| 3 | `bg-surface-raised border border-border shadow-e3` | 모달, 시트 |

레벨 2·3 은 콘텐츠 위에 뜨므로 **어떤 테마에서도 불투명**이어야 한다. 떠 있는 면에 `bg-surface-raised/80` 같은 불투명도 단축이나 `backdrop-blur` 를 얹지 않는다 (헤더 같은 고정 띠는 예외).

## 새 화면을 만들 때

1. 지면색은 body 가 이미 칠한다 (`bg` + 조명 `--bg-scene`). **페이지 루트 div 에 `bg-bg` 를 다시 칠하지 않는다** — 불투명 지면이 조명을 통째로 가린다. `bg-bg` 는 헤더처럼 부분 영역에만. 콘텐츠 블록은 `bg-surface`로 감싼다.
2. 제목은 `text-h2`, 본문은 `text-body`, 설명은 `text-body-sm text-fg-muted`.
3. 주 동작 버튼은 화면당 **하나**. 나머지는 `secondary` / `ghost`. 토글(눌린 상태 = `primary`, `aria-pressed`)은 예외지만, **버튼 모음이 둘 이상 나란히 있으면 반드시 세로 `Separator`로 가르거나 한 그룹으로 묶어 표시한다** — 어느 primary 가 어느 모음의 "켜짐"인지 눈으로 구분돼야 한다.
4. 유채색은 동작색 + 상태색 최대 2개, 총 3개를 넘기지 않는다.
5. 빈 상태·로딩·에러 상태를 처음부터 같이 만든다. 나중에 붙이면 스타일이 어긋난다.

## 막혔을 때

규칙과 요구사항이 충돌하면 **임의로 규칙을 깨지 말고 충돌 지점을 말한다.** 예: "카드 안에 12px 간격이 필요해 보이는데 규칙은 8의 배수입니다. 8px로 갈까요, 16px로 갈까요?"
