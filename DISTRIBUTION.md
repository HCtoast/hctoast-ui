# 배포 방식 — 왜 shadcn 레지스트리인가

## 질문

"shadcn 것뿐 아니라 button, dropdown 같은 자주 쓰는 컴포넌트를 직접 만들 가능성도 있는데, 이 경우엔 어떤 방식이 좋은가?"

## 답: 그래도 shadcn 레지스트리 방식

**흔한 오해 하나를 먼저 정리.** shadcn 레지스트리는 "shadcn이 만든 컴포넌트를 받아오는 통로"가 아니다. 그냥 **"JSON 매니페스트가 가리키는 파일들을 프로젝트 안으로 복사하는 CLI"**다. 매니페스트 안에 뭘 넣든 상관없다 — 내가 처음부터 손으로 짠 Button이든, Radix를 감싼 내 Dropdown이든 똑같이 배포된다. shadcn 코드를 한 줄도 안 써도 이 방식을 쓸 수 있다.

```bash
npx shadcn@latest add https://<내-도메인>/r/button.json
```

→ 내 저장소의 `button.tsx`가 프로젝트의 `components/ui/button.tsx`로 복사된다. 끝.

## 세 방식 비교

| | shadcn 레지스트리 | npm 패키지 | 템플릿 repo |
|---|---|---|---|
| 코드 위치 | **프로젝트 안** | `node_modules` | 프로젝트 안 |
| AI가 코드를 읽고 고칠 수 있나 | **가능** | 사실상 불가 | 가능 |
| 프로젝트별 커스터마이징 | 파일 직접 수정 | prop 탈출구를 미리 뚫어놔야 함 | 파일 직접 수정 |
| 기존 프로젝트에 추가 | **가능** | 가능 | **불가** |
| 업스트림 개선 전파 | 수동 재실행 | `npm update` | 안 됨 |
| 버전 관리 | 없음(복사 시점 고정) | semver | 없음 |

## 바이브코딩 관점에서 결정적인 차이

npm 패키지의 치명적 단점은 **AI가 컴포넌트 내부를 못 본다**는 것이다. `node_modules` 안에 있으면 Claude가 "이 Button은 어떤 variant를 받지?"를 알려면 타입 정의를 뒤져야 하고, 스타일을 조금 바꾸고 싶으면 라이브러리를 고칠 수 없어 감싸는 래퍼를 또 만든다. 래퍼가 쌓이면 일관성이 무너진다 — 정확히 지금 피하려는 문제.

레지스트리 방식은 코드가 `components/ui/`에 그대로 있어서 AI가 읽고, 참고하고, 새 컴포넌트를 **기존 파일과 같은 문체로** 만든다. `CLAUDE.md` 규칙과 궁합이 제일 좋다.

버전 고정이 안 되는 게 단점인데, 개인 프로젝트에서는 오히려 장점이다. 프로젝트 A의 Button을 고쳐도 프로젝트 B가 안 깨진다.

## 그래서 실제로 어떻게 섞나

컴포넌트를 두 부류로 나눈다.

**① 직접 짜는 것 — 접근성 요구가 낮고 스타일이 전부인 것**
Button, Badge, Card, Input, Textarea, Label, Avatar, Skeleton, Separator, Alert, Spinner

이건 shadcn 버전을 가져와도 어차피 다 뜯어고치게 된다. 처음부터 내 토큰으로 짜는 게 빠르다.

**② shadcn 것에서 출발하는 것 — 키보드/ARIA/포커스 트랩이 어려운 것**
Dropdown Menu, Dialog, Popover, Tooltip, Select, Tabs, Command, Sheet, Toast

전부 Radix 프리미티브 래퍼다. 직접 짜면 포커스 트랩·타이핑 검색·`aria-activedescendant`에서 반드시 버그가 난다. shadcn 버전을 `npx shadcn add dropdown-menu`로 받아서 **className만 내 토큰으로 갈아끼우고** 내 레지스트리에 넣는다.

> 처음부터 직접 짤 컴포넌트로 Button과 Dropdown을 같이 언급했는데, 이 둘은 난이도가 완전히 다르다. Button은 30줄이고 Dropdown은 Radix 없이 제대로 만들면 300줄에 접근성 버그가 남는다. Dropdown은 "직접 만든다"가 아니라 "Radix를 내 스타일로 감싼다"가 맞다.

## 저장소 구조

```
hctoast-ui/
├─ registry/
│  ├─ theme.css              # 코어 토큰(모든 컴포넌트의 전제). 레지스트리 항목 이름은 "tokens"
│  ├─ lib/cn.ts
│  └─ ui/
│     ├─ button.tsx          # ① 직접 작성
│     ├─ card.tsx
│     ├─ input.tsx
│     └─ dropdown-menu.tsx   # ② Radix 래퍼
├─ public/r/                 # 빌드 산출물 (JSON 매니페스트) — gitignore, `npm run build` 가 생성
│  ├─ registry.json          # 레지스트리 인덱스
│  ├─ tokens.json
│  ├─ button.json
│  └─ dropdown-menu.json
├─ registry.json             # 소스 정의
├─ app/                      # 쇼케이스 (Next.js) — 배포하면 문서 사이트 겸용
├─ CLAUDE.md                 # 새 프로젝트에 복사할 AI 규칙
└─ DESIGN.md
```

실제 `registry.json` 은 항목들을 `items` 배열로 감싼다(최신 shadcn 스키마):

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "hctoast-ui",
  "homepage": "https://hctoast-ui.vercel.app",
  "items": [
    {
      "name": "button",
      "type": "registry:ui",
      "dependencies": ["class-variance-authority", "radix-ui"],
      "registryDependencies": [
        "https://hctoast-ui.vercel.app/r/tokens.json",
        "https://hctoast-ui.vercel.app/r/cn.json"
      ],
      "files": [{ "path": "registry/ui/button.tsx", "type": "registry:ui" }]
    }
  ]
}
```

`registryDependencies`에 `tokens`·`cn` 을 걸어두면 어떤 컴포넌트를 받든 토큰과 유틸이 먼저 따라 들어온다. **토큰 없이 컴포넌트만 복사돼서 색이 깨지는 사고를 막는 장치**라 반드시 넣는다.

> **커스텀 레지스트리는 `registryDependencies` 에 전체 URL 을 써야 한다.** shadcn 은 이름만 적힌 의존(`"tokens"`)을 같은 오리진이 아니라 프로젝트에 설정된 shadcn **스타일 레지스트리**(`https://ui.shadcn.com/r/styles/<style>/tokens.json`)에서 찾으므로 404 가 난다. `homepage` 를 넣어도 `shadcn build` 가 이름을 URL 로 바꿔주지 않는다. `theme`·`style`·`index`·`utils` 는 shadcn 예약어라 항목 이름으로도 못 쓴다 — 그래서 토큰 항목 이름이 `tokens`.
>
> 로컬 E2E 테스트 때는 `registry.json` 의 도메인만 `http://localhost:3000` 으로 sed 치환 후 `npm run registry:build`.

`npm run build`(= `shadcn build && next build`) → `public/r/*.json` 생성 → Vercel 에 배포하면 `https://hctoast-ui.vercel.app/r/button.json` 이 곧 설치 URL. 쇼케이스 앱이 그대로 문서 사이트가 된다.

## 배포 (이 저장소)

### 0. 커밋된 URL 전제
`registry.json` 의 `homepage` 와 모든 `registryDependencies`, `app/page.tsx` 의 `REGISTRY`,
문서의 raw URL 이 전부 **`https://hctoast-ui.vercel.app`** / **`github.com/<me>/hctoast-ui`** 로
박혀 있다. 아래 1~2 를 그 이름 그대로 맞추면 URL 을 하나도 안 고쳐도 된다.

### 1. GitHub

```bash
gh repo create hctoast-ui --private --source=. --push
#  또는: git remote add origin git@github.com:<me>/hctoast-ui.git && git push -u origin main
```

- `raw.githubusercontent.com/<me>/hctoast-ui/main/CLAUDE.md` 가 살아있어야 새 프로젝트 셋업의 마지막 줄이 동작한다. private repo 면 raw 도 토큰이 필요하니, CLAUDE.md 배포용으로는 **public 이 편하다** (컴포넌트 소스가 민감하지 않으면 public 권장).

### 2. Vercel

1. Vercel 에서 **New Project → import `hctoast-ui`**.
2. **Project Name 을 `hctoast-ui` 로** 둔다 → 프로덕션 URL 이 `https://hctoast-ui.vercel.app` 로 자동 배정 → 커밋된 URL 과 일치, 수정 불필요.
   - 다른 이름/도메인을 쓸 거면 전역 치환: `registry.json`(homepage + 모든 항목의 `registryDependencies`), `app/page.tsx` 의 `REGISTRY`, `DISTRIBUTION.md` 의 URL. 그 뒤 `npm run build` → 커밋.
     `sed -i 's#hctoast-ui.vercel.app#내도메인#g' registry.json app/page.tsx DISTRIBUTION.md`
3. 빌드 설정은 기본값. Vercel 이 `npm run build`(= `shadcn build && next build`)를 돌려 `public/r/*.json` 을 정적으로 서빙한다. `public/r/` 은 gitignore 지만 빌드가 매번 생성하므로 문제없다.
4. Node 버전은 프로젝트 설정에서 20+ (로컬은 24).

### 3. 배포 검증

```bash
curl -s https://hctoast-ui.vercel.app/r/registry.json | jq '.items[].name'   # 15개
curl -sI https://hctoast-ui.vercel.app/r/button.json | grep -i content-type   # application/json

# 임시 프로젝트에서 실제 설치
npx create-next-app@latest /tmp/probe --ts --tailwind --app --yes && cd /tmp/probe
npx shadcn@latest init --base radix --template next --preset nova --yes
npx shadcn@latest add https://hctoast-ui.vercel.app/r/button.json --yes
#  → app/theme.css + lib/cn.ts + components/ui/button.tsx 3파일 생성되면 성공
```

그 뒤 `/tmp/probe/app/globals.css` 맨 아래에 `@import "./theme.css";` 추가 → `npm run build` 통과 확인.

### 4. 컴포넌트를 추가/수정한 뒤

`registry/` 편집 → `registry.json` 갱신(새 항목이면 전체 URL registryDependencies) → `git push` →
Vercel 이 자동 재배포하며 `public/r/*.json` 재생성. 소비자는 **재실행해야** 최신을 받는다
(레지스트리 방식은 복사 시점 고정이라 자동 전파 없음 — 개인 프로젝트에선 오히려 장점).

### 미확인 항목 (배포 전 PC에서)

- 세 테마 색 대비·폰트(고운바탕/Pretendard) 렌더 — 지금까지 헤드리스 스크린샷으로만 봄
- 오버레이 애니메이션(`animate-fade`/`animate-pop`) 실제 모션
- `README.md` 가 create-next-app 기본값 — 교체 권장

## 새 프로젝트 시작 절차

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npx shadcn@latest init            # 컴포넌트 라이브러리: Radix UI
npx shadcn@latest add https://hctoast-ui.vercel.app/r/button.json https://hctoast-ui.vercel.app/r/card.json
# → button/card 가 tokens(app/theme.css) + cn 을 자동으로 함께 가져온다
curl -o CLAUDE.md https://raw.githubusercontent.com/<me>/hctoast-ui/main/CLAUDE.md
```

> `tokens` 항목은 `app/theme.css` 로 복사만 된다. 앱 진입 CSS(`app/globals.css`)에서 `@import "./theme.css";` 를 **직접 한 줄 추가**해야 한다. Pretendard·고운바탕 로딩은 `DESIGN.md` 폰트 로딩 절 참고.

마지막 줄이 핵심이다. **컴포넌트보다 `CLAUDE.md`가 일관성에 더 크게 기여한다.** 컴포넌트는 있는 것만 통일해주지만, 규칙 파일은 앞으로 만들 모든 화면을 통일해준다.
