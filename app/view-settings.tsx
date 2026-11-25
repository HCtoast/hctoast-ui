"use client";

import * as React from "react";
import { Dialog as DialogPrimitive, Portal } from "radix-ui";
import { Eye, GripVertical, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FixedLabel } from "@/components/ui/fixed-label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { exitPeek, isPeeking, PeekBar, togglePeek, usePeek } from "./peek";
import { ScenePicker } from "./scene-picker";
import {
  FrameMeter,
  RainFxControl,
  RainIntensity,
  RainRenderControl,
  ThemeControl,
  useRain,
  useTheme,
  WeatherControl,
} from "./theme-control";
import { TokenEditor } from "./token-editor";

/* "보기 설정" — 테마·비·조명 사진·수치·배경만 보기·색 토큰을 한곳에 모은 떠 있는 창.
   예전엔 헤더에 테마·비 버튼이 있고 비를 켜면 헤더 아래에 조절 줄이 새로 생겨 헤더 높이가 들썩였다
   (친구 피드백 2026-11-25). 지금 헤더엔 이 창을 여는 버튼 하나만 둔다.

   비모달 Dialog(modal={false})인 까닭:
   - 모달 overlay 는 화면을 어둡게 덮어서, 지금 바꾸는 테마·비·색이 어떻게 보이는지 닫아야만 보인다.
   - 처음엔 Popover 였는데 (1) 끌어서 옮길 수 없고(위치를 Radix 가 트리거에 붙여 계산) (2) 바깥을 누르면
     닫혀서 "배경만 보기" 중에 창을 띄워 둔 채 조절할 수 없었다(사용자 요청 2026-11-25).
   - 그래서 바깥을 눌러도 안 닫히는 도구 창으로: 닫기는 X · Esc · 헤더 버튼. 대신 포커스 트랩은 없다.

   위치: 머리 줄(손잡이)을 끌어서 옮기고, 놓은 자리를 localStorage 에 기억한다. 창이 화면 밖으로 사라지면
   되돌릴 방법이 없어서, 그리는 위치는 늘 화면 안으로 깎는다(창 크기·창 내용이 바뀔 때마다). 기억하는 건
   깎기 전 "놓은 자리"라 창을 다시 키우면 그 자리로 돌아간다. 손잡이를 두 번 누르면 기본 자리(헤더 버튼
   아래)로 돌아가고 기억도 지운다.

   높이: 내용만큼(빈 공간 없이), 최대 MAX_H 에서 안쪽만 스크롤. night-city 장면 탭은 사진 목록 때문에
   늘 MAX_H 에 닿는다 — 예전 고정 높이(h-160 = 640)와 같은 값이라 그 테마에선 크기가 그대로다.
   스크롤 영역의 좌우 여백(px-4)은 슬라이더 손잡이가 끝에서 반 폭(10px) 튀어나오는 자리다 —
   overflow 가 잘라 버리지 않게(슬라이더 규칙). */

const POS_KEY = "hctoast-settings-pos";
const MARGIN = 8; // 화면 가장자리와 띄울 최소 거리
const MAX_H = 640;
const GAP_BELOW_TRIGGER = 8;

type Pos = { x: number; y: number };

function readPos(): Pos | null {
  try {
    const v = JSON.parse(localStorage.getItem(POS_KEY) ?? "null") as Pos | null;
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null;
  } catch {
    return null;
  }
}
function writePos(p: Pos | null) {
  try {
    if (p) localStorage.setItem(POS_KEY, JSON.stringify(p));
    else localStorage.removeItem(POS_KEY);
  } catch {
    // 저장 실패는 무시 — 이번 세션에서만 기억
  }
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-label text-fg-muted">{title}</h3>
      {children}
    </section>
  );
}

function SceneTab() {
  const theme = useTheme();
  const rain = useRain();
  const city = theme === "night-city";
  return (
    <div className="flex flex-col gap-6">
      <PanelSection title="테마">
        <ThemeControl />
      </PanelSection>

      <PanelSection title="날씨">
        {/* 비 표현(빗줄기 / 유리 물방울)은 night-city 에만 있다. 다른 테마에선 고를 게 없으니 비활성이 아니라
            아예 그리지 않는다(사용자 결정 2026-11-25). 버튼 모음 둘이 한 줄이면 구분선으로 가른다(규칙) */}
        <div className="flex items-center gap-4">
          <WeatherControl />
          {city && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <RainFxControl disabled={!rain} />
            </>
          )}
        </div>
        <RainIntensity />
        {/* 캔버스 = 선택 설치 항목 rain, CSS = 기본 설치(tokens)판. 유리 물방울이 도는 동안엔 둘 다 안 쓰인다 */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-label text-fg">빗줄기 그리기</span>
          <RainRenderControl disabled={!rain} />
        </div>
        {city && (
          <p className="flex items-center justify-between gap-4 text-caption text-fg-subtle">
            <span>유리 물방울 프레임 간격(p90)</span>
            <FrameMeter />
          </p>
        )}
      </PanelSection>

      <PanelSection title="조명 사진">
        {city ? (
          <ScenePicker />
        ) : (
          <p className="text-body-sm text-fg-muted">
            night-city 테마에서만 쓰여요. 사진에서 밝은 부분만 남겨 조명으로 굽고, 그 위를 유리로 덮어요.
          </p>
        )}
      </PanelSection>
    </div>
  );
}

export function ViewSettings() {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<Pos>({ x: 0, y: 0 });
  const [maxH, setMaxH] = React.useState(MAX_H);
  const peek = usePeek();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const placed = React.useRef<Pos | null>(null); // 사용자가 놓은 자리(깎기 전). null = 기본 자리
  const drag = React.useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  /** 원하는 자리(없으면 기본 자리)를 화면 안으로 깎아 그린다 */
  const place = React.useCallback((want: Pos | null): Pos => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = panelRef.current;
    const w = el?.offsetWidth ?? Math.min(512, vw - 2 * MARGIN);
    const h = el?.offsetHeight ?? 0;
    let target = want;
    if (!target) {
      const r = triggerRef.current?.getBoundingClientRect();
      target = r ? { x: r.right - w, y: r.bottom + GAP_BELOW_TRIGGER } : { x: vw - w - MARGIN, y: MARGIN };
    }
    const next = {
      x: Math.round(Math.min(Math.max(MARGIN, target.x), Math.max(MARGIN, vw - w - MARGIN))),
      y: Math.round(Math.min(Math.max(MARGIN, target.y), Math.max(MARGIN, vh - h - MARGIN))),
    };
    setPos(next);
    setMaxH(Math.min(MAX_H, vh - 2 * MARGIN));
    return next;
  }, []);

  // 창 내용(탭·테마 전환)으로 크기가 바뀌면 다시 깎는다. 콜백 ref — Radix Portal 이 내용을 한 박자 늦게 붙여서
  const attach = React.useCallback(
    (el: HTMLDivElement | null) => {
      panelRef.current = el;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        if (!drag.current) place(placed.current);
      });
      ro.observe(el);
      return () => ro.disconnect();
    },
    [place],
  );

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => place(placed.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, place]);

  const onOpenChange = (next: boolean) => {
    if (next) {
      placed.current = readPos();
      place(placed.current);
    }
    setOpen(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    place({ x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const moved = { x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py };
    if (moved.x === d.x && moved.y === d.y) return; // 그냥 누른 것
    // 놓은 자리는 깎은 값으로 기억한다 — 화면 밖으로 끌어 놓았다면 그건 의도가 아니라 실수라서
    placed.current = place(moved);
    writePos(placed.current);
  };
  const resetPos = () => {
    placed.current = null;
    writePos(null);
    place(null);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Trigger asChild>
        <Button ref={triggerRef} size="sm" variant="secondary">
          <SlidersHorizontal /> 보기 설정
        </Button>
      </DialogPrimitive.Trigger>

      {/* 배경만 보기 중에 창을 닫았을 때만 돌아오기 바를 띄운다(창이 열려 있으면 창의 토글로 돌아온다).
          헤더는 backdrop-blur 라 fixed 자식의 기준이 헤더가 돼 버린다 — 그래서 body 로 포털 */}
      {peek && !open && (
        <Portal.Root>
          <PeekBar />
        </Portal.Root>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={attach}
          data-slot="view-settings"
          aria-describedby={undefined}
          // 도구 창 — 바깥을 눌러도(페이지를 만져도) 닫히지 않는다
          onInteractOutside={(e) => e.preventDefault()}
          // 배경만 보기 중의 Esc 는 "배경만 보기를 끝낸다"까지만. 창은 연 채로 둔다(사용자 요청)
          onEscapeKeyDown={(e) => {
            if (isPeeking()) {
              e.preventDefault();
              exitPeek();
            }
          }}
          // 위치·최대 높이는 끌기·화면 크기로 정해지는 런타임 값이라 인라인으로 (디자인 값이 아니다)
          style={{ left: pos.x, top: pos.y, maxHeight: maxH }}
          className={
            "fixed z-50 flex w-lg max-w-full flex-col rounded-xl border border-border bg-surface-raised text-fg shadow-e3 outline-none " +
            "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out"
          }
        >
          <div className="flex items-center gap-2 px-6 py-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    data-slot="view-settings-handle"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => (drag.current = null)}
                    onDoubleClick={resetPos}
                    className="flex min-w-0 flex-1 cursor-grab touch-none select-none items-center gap-2 active:cursor-grabbing"
                  >
                    <GripVertical className="icon-sm shrink-0 text-fg-subtle" />
                    <DialogPrimitive.Title className="truncate text-label text-fg">보기 설정</DialogPrimitive.Title>
                  </div>
                </TooltipTrigger>
                <TooltipContent>끌어서 옮겨요. 두 번 누르면 원래 자리로 돌아가요.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              variant={peek ? "primary" : "secondary"}
              aria-pressed={peek}
              onClick={togglePeek}
            >
              <Eye />
              <FixedLabel value={peek ? "카드 다시 보기" : "배경만 보기"} options={["배경만 보기", "카드 다시 보기"]} />
            </Button>
            <DialogPrimitive.Close asChild>
              <Button size="sm" variant="ghost" aria-label="닫기" className="w-8 px-0">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <Separator />
          <Tabs defaultValue="scene" className="flex min-h-0 flex-1 flex-col px-2 pt-4 pb-6">
            <TabsList className="mx-4 self-start">
              <TabsTrigger value="scene">장면</TabsTrigger>
              <TabsTrigger value="tokens">색 토큰</TabsTrigger>
            </TabsList>
            <TabsContent value="scene" className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              <SceneTab />
            </TabsContent>
            <TabsContent value="tokens" className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              <TokenEditor />
            </TabsContent>
          </Tabs>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
