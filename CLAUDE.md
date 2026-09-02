# UI 작업 규칙 (AI 필독)

이 프로젝트의 UI는 개인 디자인 시스템을 따른다. **아래 규칙은 예외 없이 지킨다.**
전체 근거와 표는 `DESIGN.md`, 토큰 실체는 theme.css 하나(이 저장소에선 `registry/theme.css`, 컴포넌트를 받아 쓰는 프로젝트에선 `app/theme.css`)에 있다.

## 절대 규칙

1. **임의값 문법 금지.** `bg-[#c9d96b]`, `p-[13px]`, `text-[15px]`, `rounded-[10px]` 전부 금지. 필요한 토큰이 없으면 만들어 쓰지 말고 **"토큰이 없습니다"라고 말하고 멈춘다.** 예외: 자손 선택자 변형(`[&>svg]:...`, `data-[state=open]:...`)과 Radix 런타임 CSS 변수 참조(`w-(--radix-select-trigger-width)` 등 위치 계산용)는 디자인값 하드코딩이 아니므로 허용.
2. **원시 색 금지.** `bg-lime-400`, `text-gray-500`, `border-slate-200` 같은 Tailwind 기본 팔레트나 원시 스케일을 컴포넌트에서 직접 쓰지 않는다. 시맨틱 토큰만: `bg-bg` `bg-bg-inset` `bg-surface` `bg-surface-raised` `bg-fg` · `text-fg` `text-bg` `text-fg-muted` `text-fg-subtle` · `border-border` `border-border-strong` · `bg-action` `bg-action-hover` `bg-action-soft` `text-action` `text-fg-on-action` · `bg-danger` `bg-warning` `bg-success` `bg-info` · `text-danger` `text-warning` `text-success` `text-info` · `text-fg-on-danger` `text-fg-on-solid` (채도 높은 채움 위 텍스트) · `bg-accent` `bg-blossom` `border-blossom` `bg-water` `border-water` `bg-overlay`. 토큰에 불투명도 단축(`bg-action-soft/60`, `bg-blossom/20`)은 허용, 임의값(`bg-[...]`)은 금지.
3. **타이포는 정해진 유틸리티만.** 본문/제목 10종: `text-display` `text-h1` `text-h2` `text-h3` `text-body-lg` `text-body` `text-body-sm` `text-label` `text-caption` `text-code`. 컨트롤 라벨 3종(버튼 등 size 변형 안에서만): `text-label-sm` `text-label-md` `text-label-lg`. 아이콘 크기 3종: `icon-sm`(16) `icon-md`(18) `icon-lg`(20) — 텍스트와 같은 px로 맞추지 말고 한 단계 키운다. 어디에도 `font-bold`, `leading-tight`, `tracking-wide` 등을 덧붙이지 않는다 — 유틸리티 하나가 크기·행간·굵기·자간·폰트를 이미 결정한다.
4. **폰트를 직접 지정하지 않는다.** `font-sans`, `font-[Pretendard]`, `style={{fontFamily}}` 전부 금지. 이 시스템은 본문 Pretendard + 제목 고운바탕 두 개를 쓰는데, **어디서 갈아타는지는 타이포 유틸리티가 이미 정해뒀다** — `text-display`(40)와 `text-h1`(32)만 고운바탕, `text-h2`(24) 이하는 전부 Pretendard. 사용처에서 고를 일이 없다. 숫자 강조처럼 예외가 필요하면 `font-display` 유틸리티를 쓴다.
5. **고운바탕에 600(SemiBold)이 없다.** 400과 700뿐이다. `text-display`·`text-h1`은 둘 다 700이라 문제없지만, 고운바탕을 다른 자리에 손으로 얹으면서 500·600을 요구하지 않는다. 요구하면 브라우저가 700으로 올려버려서 굵기 위계가 뭉개진다.
6. **간격은 8의 배수.** `gap-2`(8px) `gap-4`(16px) `gap-5`(20px) `gap-6`(24px) `gap-10`(40px) `gap-12`(48px). 홀수 간격이 필요하다고 느끼면 레이아웃 구조가 잘못된 것이니 구조를 고친다. **유일한 예외:** 버튼·인풋 같은 컨트롤의 좌우 안쪽 패딩에 한해 `px-3`(12px) 허용 (sm 12 / md 16 / lg 24). 요소 사이 간격에는 절대 금지.
7. **모서리는 5단계만.** `rounded-sm`(8, 뱃지·체크박스) `rounded-md`(12, 버튼·인풋) `rounded-lg`(16, 카드·팝오버) `rounded-xl`(24, 모달) `rounded-full`.
8. **포커스 링을 컴포넌트에 넣지 않는다.** 전역 `:focus-visible`이 이미 처리한다. `focus:ring-*`, `focus-visible:outline-*` 추가 금지.
9. **다크모드 클래스를 직접 쓰지 않는다.** `dark:bg-...` 금지. 시맨틱 토큰이 테마별로 이미 다른 값을 갖는다.
10. **장식색(`accent` 라임, `blossom` 벚꽃, `water` 물)을 텍스트로 쓰지 않는다.** 대비 미달. 채우기·테두리·장식 전용. `blossom`·`water`는 세 테마 모두 정의돼 있다. `water`는 나무색(`action`/`blossom`)의 짝 — day는 바다, night/night-blue는 호수로 값이 바뀐다(이름은 하나, 값이 테마마다 다름).
11. **success는 초록이 아니라 청록.** 동작색이 연두라 초록 success는 구분이 안 된다. `text-success` 토큰을 그대로 쓴다.

## 컴포넌트 작성 방식

- 변형은 **cva**로 정의한다. `clsx` 조건부 문자열 나열 금지.
- 모든 컴포넌트는 `className?: string`을 받아 `cn()`으로 마지막에 병합한다.
- 드롭다운·다이얼로그·툴팁·탭·셀렉트는 **직접 구현하지 않고 Radix UI 프리미티브를 감싼다.** 키보드 내비게이션과 ARIA를 손으로 짜지 않는다.
- 원자 컴포넌트는 상태를 갖지 않는다 (controlled 우선). 상태는 사용처에서.
- 새 컴포넌트를 만들기 전에 `components/ui/` 안에 비슷한 게 있는지 먼저 확인한다.

## 면 구분 (elevation)

| 레벨 | 클래스 조합 | 용도 |
|---|---|---|
| 1 | `bg-surface border border-border shadow-e1` | 카드, 리스트 아이템 |
| 2 | `bg-surface-raised border border-border shadow-e2` | 드롭다운, 팝오버 |
| 3 | `bg-surface-raised border border-border shadow-e3` | 모달, 시트 |

## 새 화면을 만들 때

1. 지면은 `bg-bg`, 콘텐츠 블록은 `bg-surface`로 감싼다.
2. 제목은 `text-h2`, 본문은 `text-body`, 설명은 `text-body-sm text-fg-muted`.
3. 주 동작 버튼은 화면당 **하나**. 나머지는 `secondary` / `ghost`.
4. 유채색은 동작색 + 상태색 최대 2개, 총 3개를 넘기지 않는다.
5. 빈 상태·로딩·에러 상태를 처음부터 같이 만든다. 나중에 붙이면 스타일이 어긋난다.

## 막혔을 때

규칙과 요구사항이 충돌하면 **임의로 규칙을 깨지 말고 충돌 지점을 말한다.** 예: "카드 안에 12px 간격이 필요해 보이는데 규칙은 8의 배수입니다. 8px로 갈까요, 16px로 갈까요?"
