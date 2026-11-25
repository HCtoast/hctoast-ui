"use client";

import * as React from "react";
import { Eye, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { enterPeek } from "./peek";
import { ScenePicker } from "./scene-picker";
import {
  FrameMeter,
  RainFxControl,
  RainIntensity,
  ThemeControl,
  useRain,
  useTheme,
  WeatherControl,
} from "./theme-control";
import { TokenEditor } from "./token-editor";

/* "보기 설정" — 테마·비·조명 사진·수치·배경만 보기·색 토큰을 한곳에 모은 패널.
   예전엔 헤더에 테마·비 버튼이 있고 비를 켜면 헤더 아래에 조절 줄이 새로 생겼다. 그래서 비를 켤 때마다
   헤더 높이가 들썩이고 본문이 밀렸다(친구 피드백 2026-11-25). 지금 헤더엔 이 버튼 하나만 둔다.

   Dialog 가 아니라 Popover 인 까닭: 모달은 overlay 로 화면을 어둡게 덮어서, 지금 바꾸는 테마·비·색이
   어떻게 보이는지를 패널을 닫아야만 확인할 수 있다. Popover 는 뒤 화면을 그대로 두고, 바깥을 누르면 닫힌다.
   대신 치른 값: 포커스 트랩이 없다(Tab 이 패널 밖으로 나갈 수 있다).

   패널 크기는 고정(h-160, 화면이 작으면 그만큼)이고 안쪽만 스크롤한다 — 탭·테마를 바꿔 내용 길이가 달라져도
   패널이 커졌다 작아졌다 하지 않게. 스크롤 영역의 좌우 여백(px-4)은 슬라이더 손잡이가 끝에서 반 폭(10px)
   튀어나오는 자리다 — overflow 가 잘라 버리지 않게(슬라이더 규칙). */

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
        {/* 버튼 모음 둘(비 / 비 표현)이 한 줄 — 구분선으로 가른다(규칙) */}
        <div className="flex items-center gap-4">
          <WeatherControl />
          <Separator orientation="vertical" className="h-8" />
          <RainFxControl disabled={!rain || !city} />
        </div>
        <RainIntensity />
        <p className="flex items-center justify-between gap-4 text-caption text-fg-subtle">
          <span>유리 물방울은 night-city 에서만 돼요.</span>
          <FrameMeter />
        </p>
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

  const peek = () => {
    setOpen(false);
    enterPeek();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary">
          <SlidersHorizontal /> 보기 설정
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="보기 설정"
        className="flex h-160 max-h-(--radix-popover-content-available-height) w-lg max-w-(--radix-popover-content-available-width) flex-col gap-4 px-2 py-6"
      >
        <Tabs defaultValue="scene" className="flex min-h-0 flex-1 flex-col">
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
        <Separator />
        <div className="flex items-center justify-between gap-4 px-4">
          <p className="text-caption text-fg-subtle">바깥을 누르거나 Esc 로 닫혀요.</p>
          <Button size="sm" variant="secondary" onClick={peek}>
            <Eye /> 배경만 보기
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
