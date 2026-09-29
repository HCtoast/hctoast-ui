import { ArrowRight, Leaf, Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import "./candidate.css";

/* 실험 페이지 — 현재 토큰 vs 후보 토큰을 day / night 나란히 놓고 눈으로 비교한다.
   토큰 값은 candidate.css 에만 있고, 이 파일은 시맨틱 유틸리티만 쓴다.
   Radix 포털 컴포넌트(Dialog·Popover 등)는 body 에 붙어 패널 스코프를 벗어나므로 뺐다. */

/* "current" 는 candidate.css 에 정의가 없어 :root(= registry/theme.css)가 그대로 보인다. */
type Palette = "current" | "prev" | "dim" | "lavender" | "simple";
type Mode = "day" | "night" | "night-city" | "night-lavender";

type PaletteInfo = { id: Palette; label: string; note: string };

const PALETTES: Record<Mode, PaletteInfo[]> = {
  day: [
    { id: "prev", label: "이전", note: "동작색 lime-700 #5f6e1a · accent 라임" },
    {
      id: "current",
      label: "적용됨 · 올리브유 + 은은한 햇살",
      note: "동작색 olive-600 #656c1b · accent olive-400 · 위에서 넓게 내려오는 햇살(--bg-scene)",
    },
  ],
  night: [
    { id: "prev", label: "이전", note: "뉴트럴 다크 + 라임 #c9d96b" },
    {
      id: "dim",
      label: "적용됨 · 저조도",
      note: "지면 그대로, 글자·동작색(lime-600)·상태색을 한두 단계 내림. registry/theme.css 반영",
    },
  ],
  "night-city": [
    { id: "prev", label: "이전 · night-blue", note: "순흑 남색 + 라임 #c9d96b" },
    {
      id: "simple",
      label: "아카이브 · night-city 심플 (그라데이션 조명)",
      note: "정식 night-city 는 사진 + 유리(쇼케이스에서 확인). 이 판은 registry/archive/night-city-simple.css",
    },
  ],
  "night-lavender": [
    {
      id: "lavender",
      label: "적용됨 · night-lavender (호나미)",
      note: "청보라 지면(l12) · 청보라→보라 하늘 · 오른쪽 위 등불 · accent 등나무 라벤더 · action 잎 라임",
    },
  ],
};

const SWATCHES: [string, string][] = [
  ["bg", "bg-bg"],
  ["inset", "bg-bg-inset"],
  ["surface", "bg-surface"],
  ["raised", "bg-surface-raised"],
  ["border", "bg-border"],
  ["border-strong", "bg-border-strong"],
  ["subtle", "bg-fg-subtle"],
  ["muted", "bg-fg-muted"],
  ["fg", "bg-fg"],
  ["action", "bg-action"],
  ["hover", "bg-action-hover"],
  ["soft", "bg-action-soft"],
  ["accent", "bg-accent"],
];

const ROWS = [
  { name: "올리브 오일 발주", meta: "토스카나 · 2일 전", state: "success", label: "완료" },
  { name: "묘목 이식 계획", meta: "밀레니엄 농장 · 어제", state: "action", label: "진행" },
  { name: "관개 펌프 점검", meta: "동쪽 밭 · 오늘", state: "warning", label: "대기" },
] as const;

function SwatchStrip() {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map(([name, cls]) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <div className={"size-8 rounded-sm border border-border " + cls} />
          <span className="text-caption text-fg-subtle">{name}</span>
        </div>
      ))}
    </div>
  );
}

function Screen() {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-fg">올리브 농장 대시보드</h1>
          <p className="text-body-sm text-fg-muted">
            제목은 고운바탕, 본문은 Pretendard. 동작색 하나, 상태색 둘.
          </p>
        </div>
        <Button>
          <Plus /> 새 작업
        </Button>
      </div>

      {/* 스탯 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ["수확량", "1,240", "kg"],
          ["나무", "312", "그루"],
          ["강수", "38", "mm"],
        ].map(([k, v, u]) => (
          <div
            key={k}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-e1"
          >
            <span className="text-caption text-fg-muted">{k}</span>
            <span className="text-h2 font-display text-fg">
              {v} <span className="text-body-sm text-fg-subtle">{u}</span>
            </span>
          </div>
        ))}
      </div>

      {/* accent 소프트 콜아웃 — 장식색을 배경 틴트·테두리로 쓰는 자리 */}
      <div className="flex items-center gap-4 rounded-lg border border-accent/40 bg-accent/15 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
          <Leaf className="icon-md text-fg-on-accent" />
        </span>
        <div className="flex flex-col">
          <span className="text-label text-fg">개화 예보</span>
          <span className="text-body-sm text-fg-muted">
            이번 주말 만개. accent 15% 배경 + 40% 테두리, 글자는 fg 그대로.
          </span>
        </div>
      </div>

      {/* 탭 + 리스트 */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="mine">내 작업</TabsTrigger>
          <TabsTrigger value="done">완료</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              {ROWS.map((r, i) => (
                <div key={r.name} className="flex flex-col gap-4">
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-accent">
                        <Leaf className="icon-md text-fg-on-accent" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-body text-fg">{r.name}</span>
                        <span className="text-caption text-fg-muted">{r.meta}</span>
                      </div>
                    </div>
                    <Badge variant={r.state}>{r.label}</Badge>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mine">
          <p className="text-body-sm text-fg-muted">내 작업이 없어요.</p>
        </TabsContent>
        <TabsContent value="done">
          <p className="text-body-sm text-fg-muted">완료한 작업이 없어요.</p>
        </TabsContent>
      </Tabs>

      {/* 폼 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>작업 추가</CardTitle>
          <CardDescription>
            surface 위 인풋 · border-strong 테두리 · 보조 버튼 두 개
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task">작업 이름</Label>
            <Input id="task" placeholder="예: 서쪽 밭 가지치기" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>neutral</Badge>
            <Badge variant="action">action</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="danger">danger</Badge>
            <Badge variant="info">info</Badge>
            <Badge variant="action-solid">solid</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="secondary">취소</Button>
          <Button variant="ghost">임시 저장</Button>
          <Button variant="link">
            자세히 <ArrowRight />
          </Button>
          <Button variant="danger" className="ml-auto">
            삭제
          </Button>
        </CardFooter>
      </Card>

      <Separator />
      <SwatchStrip />
    </div>
  );
}

function Panel({ palette, mode }: { palette: Palette; mode: Mode }) {
  return (
    <div
      data-palette={palette}
      data-mode={mode}
      className="rounded-xl border border-border bg-bg p-6 text-fg"
    >
      <Screen />
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-h3 text-fg">테마 후보 비교</span>
            <span className="text-body-sm text-fg-muted">
              왼쪽 = 현재, 오른쪽 = 후보. registry/theme.css 는 그대로다.
            </span>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/">쇼케이스로</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12">
        {(["day", "night", "night-city", "night-lavender"] as Mode[]).map((mode) => (
          <section key={mode} className="flex flex-col gap-4">
            <h2 className="text-h2 text-fg">{mode}</h2>
            <div
              className={
                PALETTES[mode].length > 2
                  ? "grid gap-6 lg:grid-cols-3"
                  : "grid gap-6 lg:grid-cols-2"
              }
            >
              {PALETTES[mode].map((p) => (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-label text-fg">{p.label}</span>
                    <span className="text-caption text-fg-muted">{p.note}</span>
                  </div>
                  <Panel palette={p.id} mode={mode} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
