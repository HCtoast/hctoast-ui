import { ArrowRight, Plus, Trash2 } from "lucide-react";

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ScenePicker } from "./scene-picker";
import { SliderDemo } from "./slider-demo";
import { ThemeControl } from "./theme-control";

const REGISTRY = "https://hctoast-ui.vercel.app";

const NAV: { id: string; label: string }[] = [
  { id: "tokens", label: "토큰" },
  { id: "button", label: "Button" },
  { id: "badge", label: "Badge" },
  { id: "card", label: "Card" },
  { id: "input", label: "Input · Label" },
  { id: "separator", label: "Separator" },
  { id: "skeleton", label: "Skeleton" },
  { id: "dialog", label: "Dialog" },
  { id: "dropdown-menu", label: "DropdownMenu" },
  { id: "popover", label: "Popover" },
  { id: "tooltip", label: "Tooltip" },
  { id: "select", label: "Select" },
  { id: "tabs", label: "Tabs" },
  { id: "slider", label: "Slider" },
];

function Snippet({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-bg-inset px-4 py-2 text-code text-fg-muted">
      {children}
    </pre>
  );
}

function DocSection({
  id,
  title,
  subtitle,
  register,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  register?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-h2 text-fg">{title}</h2>
        {subtitle && <p className="text-body-sm text-fg-muted">{subtitle}</p>}
      </div>
      {register && (
        <Snippet>{`npx shadcn@latest add ${REGISTRY}/r/${register}.json`}</Snippet>
      )}
      {children}
    </section>
  );
}

function Demo({
  children,
  layout = "row",
}: {
  children: React.ReactNode;
  layout?: "row" | "col";
}) {
  return (
    <div
      className={
        layout === "col"
          ? "flex flex-col items-stretch gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1"
          : "flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1"
      }
    >
      {children}
    </div>
  );
}

const SEMANTIC_SWATCHES: [string, string][] = [
  ["bg", "bg-bg"],
  ["bg-inset", "bg-bg-inset"],
  ["surface", "bg-surface"],
  ["surface-raised", "bg-surface-raised"],
  ["action", "bg-action"],
  ["action-hover", "bg-action-hover"],
  ["action-soft", "bg-action-soft"],
  ["accent", "bg-accent"],
];

const TYPE_SCALE = [
  ["text-display", "Display 40"],
  ["text-h1", "Heading 1 · 32"],
  ["text-h2", "Heading 2 · 24"],
  ["text-h3", "Heading 3 · 20"],
  ["text-body-lg", "Body large · 17"],
  ["text-body", "Body · 15"],
  ["text-body-sm", "Body small · 13"],
  ["text-label", "Label · 13/600"],
  ["text-caption", "Caption · 12"],
  ["text-code", "Code · 13 mono"],
] as const;

const RADII = [
  ["rounded-sm", "8"],
  ["rounded-md", "12"],
  ["rounded-lg", "16"],
  ["rounded-xl", "24"],
  ["rounded-full", "∞"],
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className="text-h3 text-fg">HCToast UI</span>
          <ThemeControl />
        </div>
        <nav className="mx-auto max-w-4xl overflow-x-auto px-6 pb-3">
          <ul className="flex gap-4">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className="whitespace-nowrap text-body-sm text-fg-muted transition-base hover:text-fg"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
        <section className="flex flex-col gap-4">
          <h1 className="text-display text-fg">컴포넌트 & 토큰</h1>
          <p className="text-body-lg text-fg-muted">
            개인 프로젝트에서 일관된 UI를 얻기 위한 디자인 시스템. day / night /
            night-city / night-lavender 네 테마, Pretendard 본문 + 고운바탕 제목, shadcn 레지스트리로
            배포.
          </p>
          <p className="text-body-sm text-fg-subtle">
            아래 명령을 그대로 붙여넣으면 설치됩니다. 각 컴포넌트는 tokens와 cn을
            자동으로 함께 가져오므로 따로 받을 필요가 없습니다.
          </p>
        </section>

        <ScenePicker />

        <DocSection
          id="tokens"
          title="디자인 토큰"
          subtitle="컴포넌트는 시맨틱 토큰만 참조한다. 원시 팔레트·임의값·dark: 클래스 금지."
          register="tokens"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-label text-fg-muted">색 토큰</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {SEMANTIC_SWATCHES.map(([name, cls]) => (
                  <div
                    key={name}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-e1"
                  >
                    <div
                      className={`h-12 rounded-md border border-border ${cls}`}
                    />
                    <span className="text-caption text-fg-muted">{name}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-surface p-4 shadow-e1">
                <span className="text-label text-danger">danger</span>
                <span className="text-label text-warning">warning</span>
                <span className="text-label text-success">success</span>
                <span className="text-label text-info">info</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-label text-fg-muted">타이포 스케일</p>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
                {TYPE_SCALE.map(([cls, label]) => (
                  <p key={cls} className={`${cls} text-fg`}>
                    {label}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-label text-fg-muted">모서리</p>
                <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
                  {RADII.map(([cls, px]) => (
                    <div key={cls} className="flex flex-col items-center gap-2">
                      <div
                        className={`size-12 border border-border-strong bg-action-soft ${cls}`}
                      />
                      <span className="text-caption text-fg-muted">{px}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-label text-fg-muted">면 (elevation)</p>
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
                  <div className="rounded-lg border border-border bg-surface p-4 text-body-sm text-fg shadow-e1">
                    레벨 1 · 카드
                  </div>
                  <div className="rounded-lg border border-border bg-surface-raised p-4 text-body-sm text-fg shadow-e2">
                    레벨 2 · 팝오버
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-4 text-body-sm text-fg shadow-e3">
                    레벨 3 · 모달
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DocSection>

        <DocSection
          id="button"
          title="Button"
          subtitle="primary / secondary / ghost / danger / link · sm 32 · md 40 · lg 48"
          register="button"
        >
          <Demo>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
            </div>
          </Demo>
          <Demo>
            <Button size="sm">
              <Plus />
              Small
            </Button>
            <Button size="md" variant="secondary">
              Medium
              <ArrowRight />
            </Button>
            <Button size="lg" variant="danger">
              <Trash2 />
              Large
            </Button>
            <Button disabled>Disabled</Button>
          </Demo>
        </DocSection>

        <DocSection
          id="badge"
          title="Badge"
          subtitle="soft 6종 + solid 6종 · rounded-sm · 높이 20"
          register="badge"
        >
          <Demo layout="col">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="neutral">neutral</Badge>
              <Badge variant="action">action</Badge>
              <Badge variant="success">success</Badge>
              <Badge variant="warning">warning</Badge>
              <Badge variant="danger">danger</Badge>
              <Badge variant="info">info</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="neutral-solid">neutral</Badge>
              <Badge variant="action-solid">action</Badge>
              <Badge variant="success-solid">success</Badge>
              <Badge variant="warning-solid">warning</Badge>
              <Badge variant="danger-solid">danger</Badge>
              <Badge variant="info-solid">info</Badge>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="card"
          title="Card"
          subtitle="레벨 1 면 · Header / Title / Description / Content / Footer"
          register="card"
        >
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>카드 제목</CardTitle>
              <CardDescription>설명은 text-body-sm text-fg-muted.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-fg">
                border + shadow-e1 로 지면과 구분됩니다.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">확인</Button>
              <Button size="sm" variant="ghost">
                취소
              </Button>
            </CardFooter>
          </Card>
        </DocSection>

        <DocSection
          id="input"
          title="Input · Label"
          subtitle="높이 40 · border-strong · rounded-md"
          register="input"
        >
          <Demo layout="col">
            <div className="flex max-w-sm flex-col gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex max-w-sm flex-col gap-2">
              <Label htmlFor="off">비활성</Label>
              <Input id="off" placeholder="비활성 상태" disabled />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="separator"
          title="Separator"
          subtitle="horizontal / vertical · decorative 여부로 role 결정"
          register="separator"
        >
          <Demo layout="col">
            <p className="text-body text-fg">위 블록</p>
            <Separator />
            <p className="text-body text-fg">아래 블록</p>
            <div className="flex h-8 items-center gap-4">
              <span className="text-body-sm text-fg-muted">A</span>
              <Separator orientation="vertical" />
              <span className="text-body-sm text-fg-muted">B</span>
              <Separator orientation="vertical" />
              <span className="text-body-sm text-fg-muted">C</span>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="skeleton"
          title="Skeleton"
          subtitle="animate-pulse · bg-bg-inset · prefers-reduced-motion 대응"
          register="skeleton"
        >
          <Demo layout="col">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Demo>
        </DocSection>

        <DocSection
          id="dialog"
          title="Dialog"
          subtitle="레벨 3 면 · overlay 백드롭 · 포커스 트랩·ESC·스크롤 잠금은 Radix"
          register="dialog"
        >
          <Demo>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">모달 열기</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>모달 제목</DialogTitle>
                  <DialogDescription>
                    surface-raised + shadow-e3 + rounded-xl.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-body text-fg">
                  등장·퇴장은 theme.css의 animate-fade / animate-pop.
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm">
                      취소
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button size="sm">확인</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Demo>
        </DocSection>

        <DocSection
          id="dropdown-menu"
          title="DropdownMenu"
          subtitle="item / checkbox / radio / label / separator / sub · 타이핑 검색·방향키는 Radix"
          register="dropdown-menu"
        >
          <Demo>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">메뉴</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>계정</DropdownMenuLabel>
                <DropdownMenuItem>
                  프로필
                  <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>설정</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  알림 받기
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Demo>
        </DocSection>

        <DocSection
          id="popover"
          title="Popover"
          subtitle="레벨 2 면 · 위치·충돌 회피는 Radix"
          register="popover"
        >
          <Demo>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">팝오버</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-2">
                  <p className="text-label text-fg">팝오버 콘텐츠</p>
                  <p className="text-body-sm text-fg-muted">
                    surface-raised + shadow-e2 + rounded-lg.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </Demo>
        </DocSection>

        <DocSection
          id="tooltip"
          title="Tooltip"
          subtitle="레벨 2 면 · text-body-sm · 호버/포커스로 표시"
          register="tooltip"
        >
          <Demo>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">여기에 호버</Button>
                </TooltipTrigger>
                <TooltipContent>도움말 텍스트</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Demo>
        </DocSection>

        <DocSection
          id="select"
          title="Select"
          subtitle="트리거 40 · popper 포지션 · 스크롤 버튼 · 타이핑 검색은 Radix"
          register="select"
        >
          <Demo layout="col">
            <div className="flex max-w-xs flex-col gap-2">
              <Label>향 계열</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citrus">시트러스</SelectItem>
                  <SelectItem value="floral">플로럴</SelectItem>
                  <SelectItem value="woody">우디</SelectItem>
                  <SelectItem value="musk">머스크</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="tabs"
          title="Tabs"
          subtitle="bg-bg-inset 트랙 + 활성 탭 surface-raised"
          register="tabs"
        >
          <Demo layout="col">
            <Tabs defaultValue="a">
              <TabsList>
                <TabsTrigger value="a">개요</TabsTrigger>
                <TabsTrigger value="b">사용법</TabsTrigger>
                <TabsTrigger value="c">토큰</TabsTrigger>
              </TabsList>
              <TabsContent value="a">
                <p className="text-body text-fg">개요 탭 콘텐츠.</p>
              </TabsContent>
              <TabsContent value="b">
                <p className="text-body text-fg">사용법 탭 콘텐츠.</p>
              </TabsContent>
              <TabsContent value="c">
                <p className="text-body text-fg">토큰 탭 콘텐츠.</p>
              </TabsContent>
            </Tabs>
          </Demo>
        </DocSection>

        <DocSection
          id="slider"
          title="Slider"
          subtitle="Radix Slider 래퍼 · 손잡이 5종 · 드래그는 부드럽게, 놓으면 눈금에 스냅"
          register="slider"
        >
          <Demo layout="col">
            <SliderDemo />
          </Demo>
        </DocSection>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-caption text-fg-subtle">
            HCToast UI · Next.js + Tailwind v4 + Radix · shadcn 레지스트리 배포
          </p>
        </div>
      </footer>
    </div>
  );
}
