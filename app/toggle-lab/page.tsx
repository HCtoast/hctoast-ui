"use client";

import * as React from "react";
import { Check, CloudRain, Sun } from "lucide-react";
import { Switch as SwitchPrimitive, Toggle as TogglePrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { FixedLabel } from "@/components/ui/fixed-label";
import { Separator } from "@/components/ui/separator";

/* 임시 실험 페이지 — 토글 모양 후보 5종. 결정되면 registry/ui 로 승격하고 이 페이지는 지운다.
   공통 원칙: 켜짐은 primary 가 아니라 "선택 상태"(action-soft + action). 주 동작과 경쟁하지 않는다. */

function Row({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6 shadow-e1">
      <div className="flex flex-col">
        <span className="text-label text-fg">{title}</span>
        <span className="text-body-sm text-fg-muted">{note}</span>
      </div>
      <div className="flex flex-wrap items-center gap-6 pt-2">{children}</div>
    </div>
  );
}

/* A. 스위치 — 알약 트랙 + 미끄러지는 손잡이 */
function SwitchA({ label }: { label: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <label className="inline-flex items-center gap-2 text-body text-fg">
      <SwitchPrimitive.Root
        checked={on}
        onCheckedChange={setOn}
        className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border-strong bg-bg-inset transition-base data-[state=checked]:border-action data-[state=checked]:bg-action"
      >
        <SwitchPrimitive.Thumb className="block size-5 translate-x-px rounded-full bg-surface-raised shadow-e1 transition-snap data-[state=checked]:translate-x-4" />
      </SwitchPrimitive.Root>
      {/* 문구가 바뀌어도 세트 크기는 고정 — 가장 긴 문구가 상자를 잡는다 */}
      <FixedLabel value={on ? `${label} 켜짐` : `${label} 꺼짐`} options={[`${label} 켜짐`, `${label} 꺼짐`]} />
    </label>
  );
}

/* B. 눌림 버튼 — 보조 버튼 모양, 켜지면 action-soft + action 글자 + action 테두리 */
function PressedB({ label }: { label: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <TogglePrimitive.Root
      pressed={on}
      onPressedChange={setOn}
      className="inline-flex h-8 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-label-sm text-fg transition-base hover:bg-hover data-[state=on]:border-action data-[state=on]:bg-action-soft data-[state=on]:text-action [&_svg]:icon-sm"
    >
      <CloudRain /> {label}
    </TogglePrimitive.Root>
  );
}

/* C. 아이콘 토글 — B 와 같은 규칙, 아이콘만. 헤더·툴바용 */
function IconC({ label }: { label: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <TogglePrimitive.Root
      pressed={on}
      onPressedChange={setOn}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-md border border-border-strong bg-surface text-fg-muted transition-base hover:bg-hover hover:text-fg data-[state=on]:border-action data-[state=on]:bg-action-soft data-[state=on]:text-action [&_svg]:icon-md"
    >
      <CloudRain />
    </TogglePrimitive.Root>
  );
}

/* D. 체크 칩 — 필터 칩. 켜지면 체크가 나타나고 action-soft */
function ChipD({ label }: { label: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <TogglePrimitive.Root
      pressed={on}
      onPressedChange={setOn}
      className="inline-flex h-8 items-center gap-2 rounded-full bg-bg-inset px-3 text-label-sm text-fg-muted transition-base hover:text-fg data-[state=on]:bg-action-soft data-[state=on]:text-action [&_svg]:icon-sm"
    >
      {/* 체크 자리는 항상 잡아둔다 — 켜질 때 폭이 변하면 안 된다 */}
      <Check className={on ? "opacity-100" : "opacity-0"} aria-hidden />
      {label}
    </TogglePrimitive.Root>
  );
}

/* E. 아이콘 스위치 — 손잡이 안에 상태 아이콘 (해 ↔ 비) */
function IconSwitchE({ label }: { label: string }) {
  const [on, setOn] = React.useState(true);
  return (
    <label className="inline-flex items-center gap-2 text-body text-fg">
      <SwitchPrimitive.Root
        checked={on}
        onCheckedChange={setOn}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-border-strong bg-bg-inset transition-base data-[state=checked]:border-action data-[state=checked]:bg-action"
      >
        <SwitchPrimitive.Thumb className="flex size-6 translate-x-px items-center justify-center rounded-full bg-surface-raised text-fg-muted shadow-e1 transition-snap data-[state=checked]:translate-x-5 data-[state=checked]:text-action [&_svg]:icon-sm">
          {on ? <CloudRain /> : <Sun />}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
      {label}
    </label>
  );
}

function SettingRow({ label, status, align }: { label: string; status: readonly [string, string]; align: "start" | "end" }) {
  const [on, setOn] = React.useState(false);
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-surface-raised px-4 py-2">
      <span className="text-body text-fg">{label}</span>
      <label className="inline-flex items-center gap-2 text-body-sm text-fg-muted">
        <FixedLabel value={on ? status[0] : status[1]} options={status} align={align} />
        <SwitchPrimitive.Root
          checked={on}
          onCheckedChange={setOn}
          className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border-strong bg-bg-inset transition-base data-[state=checked]:border-action data-[state=checked]:bg-action"
        >
          <SwitchPrimitive.Thumb className="block size-5 translate-x-px rounded-full bg-surface-raised shadow-e1 transition-snap data-[state=checked]:translate-x-4" />
        </SwitchPrimitive.Root>
      </label>
    </div>
  );
}
function SettingRows() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SettingRow label="자동갱신" status={["켜짐", "끔"]} align="start" />
      <SettingRow label="자동갱신" status={["켜짐", "끔"]} align="end" />
      <SettingRow label="자동갱신" status={["켜짐", "꺼짐"]} align="end" />
    </div>
  );
}

export default function ToggleLab() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-fg">토글 후보 (임시)</h1>
        <p className="text-body-sm text-fg-muted">
          켜짐은 primary 가 아니라 선택 상태(action-soft + action). 각 후보의 켜짐·꺼짐을 나란히.
        </p>
      </div>
      <Row title="A · 스위치" note="설정·폼. 라벨과 함께. 켜짐 = 트랙 action, 손잡이 오른쪽">
        <SwitchA label="비" />
        <label className="inline-flex items-center gap-2 text-body text-fg-muted">
          <span className="relative inline-flex h-6 w-10 items-center rounded-full border border-border-strong bg-bg-inset"><span className="block size-5 translate-x-px rounded-full bg-surface-raised shadow-e1" /></span>
          꺼짐
        </label>
      </Row>
      <Row title="B · 눌림 버튼" note="툴바·헤더. 보조 버튼 모양, 켜지면 action-soft 채움 + action 글자·테두리">
        <PressedB label="비" />
        <span className="inline-flex h-8 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-label-sm text-fg [&_svg]:icon-sm"><CloudRain /> 꺼짐</span>
      </Row>
      <Row title="C · 아이콘 토글" note="B 의 아이콘판. 가장 좁다">
        <IconC label="비" />
        <span className="inline-flex size-8 items-center justify-center rounded-md border border-border-strong bg-surface text-fg-muted [&_svg]:icon-md"><CloudRain /></span>
      </Row>
      <Row title="D · 체크 칩" note="필터·태그. 켜지면 체크 + action-soft, 테두리 없음">
        <ChipD label="비" />
        <span className="inline-flex h-8 items-center rounded-full bg-bg-inset px-3 text-label-sm text-fg-muted">꺼짐</span>
      </Row>
      <Row title="E · 아이콘 스위치" note="A 에 상태 아이콘(해 ↔ 비). 상태가 두 얼굴을 가질 때">
        <IconSwitchE label="비" />
      </Row>
      <Row title="설정 줄: 토글이 오른쪽 끝, 상태 문구가 그 옆 (자동갱신 켜짐 / 끔)" note="위: 문구를 왼쪽 정렬 → 끔일 때 토글 옆이 텅 빈다. 가운데: 오른쪽 정렬 → 문구가 토글에 붙고 빈 공간은 라벨 쪽으로. 아래: 문구 길이를 맞춘 카피(켜짐/꺼짐)">
        <SettingRows />
      </Row>
      <Row title="헤더에 놓았을 때 (B / C 비교)" note="테마 모음 | 구분선 | 토글">
        <div className="flex items-center gap-4">
          <div className="flex gap-2"><Button size="sm">day</Button><Button size="sm" variant="secondary">night</Button><Button size="sm" variant="secondary">night-city</Button></div>
          <Separator orientation="vertical" className="h-8" />
          <PressedB label="비" />
          <IconC label="비" />
        </div>
      </Row>
    </main>
  );
}
