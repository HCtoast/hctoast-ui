# Claude Code 킥오프 프롬프트

## 먼저 할 것 (1분)

빈 폴더를 만들고 아래 네 파일을 넣은 다음 Claude Code를 연다. `CLAUDE.md`가 저장소 루트에 있으면 Claude Code가 매 세션 자동으로 읽어서, 아래 프롬프트에 규칙을 다시 붙여넣을 필요가 없다.

```
jaewon-ui/
├─ CLAUDE.md      ← 루트에 두는 게 핵심
├─ DESIGN.md
├─ DISTRIBUTION.md
└─ theme.css
```

그리고 아래를 그대로 붙여넣는다.

---

## 붙여넣을 프롬프트

개인용 UI 프레임워크 저장소 `jaewon-ui`를 처음부터 만든다. 여러 개인 프로젝트에서 가져다 써서 UI가 일관되게 나오게 하는 게 목적이고, 배포는 **shadcn 레지스트리 방식**(내 저장소의 JSON 매니페스트를 `npx shadcn add <url>`로 가져가 프로젝트 안에 파일을 복사)을 쓴다.

루트의 `CLAUDE.md`(작성 규칙), `DESIGN.md`(디자인 규칙 단일 진실 공급원), `DISTRIBUTION.md`(저장소 구조와 배포 방식), `theme.css`(Tailwind v4 토큰 실체)를 먼저 다 읽어라. 이 넷이 이미 확정된 결정이고, 여기 적힌 것과 충돌하는 판단은 하지 마라.

### 확정 사항 요약 (자세한 건 파일에)

- Next.js(App Router) + TypeScript + **Tailwind CSS v4**
- 테마 3종: `day`(아이보리 `#f7f4ea` + 딥올리브 `#5f6e1a`) / `night`(`#0c0c0d` + 라임 `#c9d96b`) / `night-blue`(`#020715`). `data-theme` 속성으로 전환, 미지정 시 `prefers-color-scheme`
- 본문 폰트 **Pretendard**(npm), 제목 폰트 **고운바탕**(Google Fonts). 고운바탕은 굵기가 400·700 둘뿐이라 `text-display`(40)와 `text-h1`(32)에만 쓴다. `text-h2`(24) 이하는 전부 Pretendard
- 간격 8의 배수, 모서리 12px부터(sm 8 / md 12 / lg 16 / xl 24 / full), 타이포 유틸 10종 고정
- 컴포넌트는 **cva**로 변형 정의, `cn()`으로 className 병합, 접근성은 **Radix UI**에 위임

### 작업 순서

1. **저장소 뼈대.** `npx create-next-app@latest . --typescript --tailwind --app --eslint` 로 시작하고 `npx shadcn@latest init` 실행. `theme.css`를 `registry/theme.css`로 옮기고 앱 진입 CSS에서 import. Pretendard(`npm i pretendard` → dynamic-subset CSS import)와 고운바탕(`next/font/google`, `subsets: ["latin"]` — `"korean"`은 타입 미허용이라 넣지 않는다. 이 폰트는 웨이트 파일이 한글을 통째로 포함해 문제없음. 자세한 건 `DESIGN.md` 폰트 로딩 절) 로딩까지 붙인 뒤, 세 테마가 실제로 전환되는지 확인하고 멈춰서 보고해라.

2. **`lib/cn.ts`와 `registry.json` 스캐폴드.** `DISTRIBUTION.md`의 구조를 그대로 따른다. 모든 컴포넌트 항목의 `registryDependencies`에 theme을 걸어서, 컴포넌트만 복사되고 토큰이 빠지는 사고를 막아라.

3. **직접 작성 컴포넌트** (스타일이 전부이고 접근성 요구가 낮은 것): `Button` `Card` `Input` `Label` `Badge` `Separator` `Skeleton`. Button 변형은 `DESIGN.md` 8장의 표를 그대로 구현한다(primary / secondary / ghost / danger / link, 크기 sm 32 · md 40 · lg 48).

4. **Radix 래핑 컴포넌트**: `Dialog` `DropdownMenu` `Popover` `Tooltip` `Select` `Tabs`. **`radix-ui` 통합 패키지 프리미티브를 직접 래핑**한다(우리 시맨틱 토큰으로). 포커스 트랩·타이핑 검색·ARIA는 Radix가 담당하므로 손으로 짜지 마라.
   - 원래 계획은 `npx shadcn@latest add <name>` 후 className 교체였으나, 최신 shadcn(`radix-nova` 스타일)은 `bg-popover`·`dark:`·임의값·`tw-animate-css` 의존을 써서 받은 파일의 ~90%를 재작성해야 했다. 구조 참고 이득보다 정리 비용이 커서 직접 래핑으로 전환(2026-08-31 결정).
   - 오버레이 등장/퇴장 애니메이션은 `theme.css`의 `@keyframes`(페이드 + 미세 스케일)로. `data-[state=open/closed]:animate-*`. Radix 프리미티브가 애니메이션 종료까지 unmount를 지연시킨다.

5. **쇼케이스 앱.** `app/`에 컴포넌트 전부를 세 테마로 볼 수 있는 페이지를 만든다. 이게 그대로 문서 사이트가 된다.

6. **`npx shadcn build`** 로 `r/*.json` 생성 확인.

### 하지 말 것

- `CLAUDE.md`의 규칙을 어기는 것. 특히 임의값 문법(`bg-[#c9d96b]`, `p-[13px]`), Tailwind 기본 팔레트 직접 사용(`bg-lime-400`, `text-gray-500`), `dark:` 클래스, 컴포넌트 내부 포커스 링, 타이포 유틸에 `font-bold`/`leading-*` 덧붙이기
- 규칙에 없는 값이 필요할 때 임의로 만들어 쓰는 것. **멈추고 물어봐라.**
- 한 번에 6단계를 다 하는 것. **각 단계 끝에서 멈추고 결과를 보여줘라.**

### 완료 기준

각 단계마다: 빌드가 통과하고, 쇼케이스에서 세 테마가 다 정상으로 보이고, 새로 추가한 컴포넌트에 하드코딩된 색·크기 값이 하나도 없을 것.

1단계부터 시작해라.

---

## 이후 세션에서 쓸 짧은 프롬프트

저장소가 만들어진 뒤에는 `CLAUDE.md`가 자동으로 읽히므로 이 정도면 충분하다.

> `DESIGN.md` 규칙에 맞춰 `<컴포넌트 이름>` 컴포넌트를 `registry/ui/`에 추가하고 `registry.json`에 등록해줘. 쇼케이스 페이지에도 세 테마로 확인할 수 있게 섹션을 붙여줘.

## 새 애플리케이션 프로젝트를 시작할 때

프레임워크 저장소가 아니라 그걸 **쓰는** 프로젝트를 시작할 때는 이렇게 한다.

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npx shadcn@latest init
npx shadcn@latest add https://<배포주소>/r/button.json https://<배포주소>/r/card.json
# button/card 가 tokens(app/theme.css) + cn 을 자동으로 함께 가져온다. globals.css 에 @import "./theme.css" 한 줄 추가.
curl -o CLAUDE.md https://raw.githubusercontent.com/<나>/hctoast-ui/main/CLAUDE.md
```

마지막 줄이 제일 중요하다. **컴포넌트보다 `CLAUDE.md`가 일관성에 더 크게 기여한다** — 컴포넌트는 이미 있는 것만 통일해주지만, 규칙 파일은 앞으로 만들 모든 화면을 통일해준다.
