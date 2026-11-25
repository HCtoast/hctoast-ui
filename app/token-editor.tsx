"use client";

import * as React from "react";
import { Copy, Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FixedLabel } from "@/components/ui/fixed-label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import { useRain, useTheme } from "./theme-control";
import {
  normalizeHex,
  overridesSnippet,
  readDefaults,
  readOverrides,
  THEMES,
  TOKEN_GROUPS,
  writeOverrides,
  type Overrides,
  type ThemeName,
} from "./token-overrides";

/* 색 토큰 편집기 — "보기 설정" 패널의 두 번째 탭. 값 저장·적용 규칙은 token-overrides.ts 에.
   한 줄 = [견본] 토큰 이름 [색 고르기 아이콘] [hex 입력] [이 토큰만 초기화]. 줄 구성은 바뀌어도 늘 같고,
   덮어쓴 줄은 이름 색만 진해진다(굵기·테두리를 바꾸면 크기가 변한다 — 규칙).
   처음엔 견본을 누르면 색 고르기가 열렸는데, 견본이 눌린다는 걸 알 길이 없었다(사용자 피드백 2026-11-25).
   그래서 견본은 보기만 하고, 입력칸 왼쪽에 팔레트 아이콘 + 툴팁을 따로 둔다. */

export function TokenEditor() {
  const theme = useTheme() as ThemeName;
  const rain = useRain();
  const [overrides, setOverrides] = React.useState<Overrides>(readOverrides);
  const [copied, setCopied] = React.useState(false);

  // 기본값은 테마·날씨에 따라 다르다(비 오는 day 는 지면이 다르다). 패널 안에서만 마운트되므로 DOM 을 바로 읽는다
  // eslint-disable-next-line react-hooks/exhaustive-deps -- theme·rain 은 DOM 을 다시 읽을 신호로만 쓴다
  const defaults = React.useMemo(() => readDefaults(), [theme, rain]);
  const mine = overrides[theme] ?? {};
  const count = Object.keys(mine).length;

  const update = (next: Overrides) => {
    setOverrides(next);
    writeOverrides(next);
  };
  const setToken = (name: string, hex: string) => update({ ...overrides, [theme]: { ...mine, [name]: hex } });
  const resetToken = (name: string) => {
    const rest = { ...mine };
    delete rest[name];
    update({ ...overrides, [theme]: rest });
  };
  const resetAll = () => {
    const rest = { ...overrides };
    delete rest[theme];
    update(rest);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(overridesSnippet(theme, mine));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 조용히 넘어간다
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-fg-muted">
            지금 테마 <FixedLabel value={theme} options={THEMES} className="text-fg" />에만 적용돼요. 테마마다
            따로 기억하고, 이 브라우저에만 저장돼요. hex 를 칸에 바로 치거나 칸 왼쪽 팔레트 아이콘으로 골라요.
            hover·선택 하이라이트는 fg·accent 를 따라가요.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={count === 0} onClick={() => void copy()}>
              <Copy />
              <FixedLabel value={copied ? "복사됨" : "CSS 복사"} options={["CSS 복사", "복사됨"]} />
            </Button>
            <Button size="sm" variant="ghost" disabled={count === 0} onClick={resetAll}>
              <RotateCcw /> 전체 초기화
            </Button>
          </div>
        </div>

        {TOKEN_GROUPS.map((g) => (
          <section key={g.label} className="flex flex-col gap-2">
            <h4 className="text-label text-fg-muted">{g.label}</h4>
            <ul className="flex flex-col gap-2">
              {g.tokens.map((t) => (
                <TokenRow
                  key={`${theme}-${t}`}
                  name={t}
                  value={mine[t] ?? defaults[t] ?? ""}
                  overridden={t in mine}
                  onChange={(hex) => setToken(t, hex)}
                  onReset={() => resetToken(t)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </TooltipProvider>
  );
}

function TokenRow({
  name,
  value,
  overridden,
  onChange,
  onReset,
}: {
  name: string;
  value: string;
  overridden: boolean;
  onChange: (hex: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const [prev, setPrev] = React.useState(value);
  // 값이 밖에서 바뀌면(초기화·색 고르기) 입력칸도 따라간다. 다만 지금 입력이 그 값을 만든 거라면 그대로 둔다
  // — "#656" 을 치는 중에 "#665566" 으로 펼쳐 버리면 커서가 튄다
  if (value !== prev) {
    setPrev(value);
    if (normalizeHex(draft) !== value) setDraft(value);
  }
  const valid = normalizeHex(draft) !== null;
  const picker = React.useRef<HTMLInputElement>(null);
  const id = React.useId();

  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        // 견본은 토큰 자체를 칠한다 — hex 를 박지 않으므로 덮어쓰기·테마 전환을 그대로 따라간다
        style={{ backgroundColor: `var(--${name})` }}
        className="size-8 shrink-0 rounded-sm border border-border-strong"
      />
      <label htmlFor={id} className={cn("min-w-0 flex-1 truncate text-code", overridden ? "text-fg" : "text-fg-subtle")}>
        {name}
      </label>
      {/* 브라우저 색 고르기 창은 <input type="color"> 의 자리에 붙어 뜬다. 예전엔 sr-only(1px, 줄 밖)라 창이
          엉뚱하게 아래에 떴다 — 그래서 아이콘 버튼과 같은 칸에 투명하게 겹쳐 둔다 */}
      <span className="relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`${name} 색 고르기`}
              onClick={() => (picker.current?.showPicker ? picker.current.showPicker() : picker.current?.click())}
              className="w-8 px-0"
            >
              <Palette />
            </Button>
          </TooltipTrigger>
          <TooltipContent>색 고르기 — hex 는 오른쪽 칸에 바로 쳐도 돼요</TooltipContent>
        </Tooltip>
        <input
          ref={picker}
          type="color"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          value={value.slice(0, 7) || "#000000"}
          // 색 고르기는 알파가 없다 — 원래 알파(#rrggbbaa 의 aa)는 지킨다
          onChange={(e) => onChange(e.target.value + (value.length === 9 ? value.slice(7) : ""))}
        />
      </span>
      <Input
        id={id}
        value={draft}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!valid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const hex = normalizeHex(e.target.value);
          if (hex) onChange(hex);
        }}
        onBlur={() => {
          if (!valid) setDraft(value);
        }}
        className={cn("h-8 w-32 px-3 text-code", !valid && "text-danger")}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          {/* 비활성 버튼은 포인터 이벤트가 없어 툴팁이 안 뜬다 — 감싸는 칸에 건다 */}
          <span className="shrink-0">
            <Button
              size="sm"
              variant="ghost"
              aria-label={`${name} 기본값으로`}
              disabled={!overridden}
              onClick={onReset}
              className="w-8 px-0"
            >
              <RotateCcw />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{overridden ? "이 토큰만 기본값으로" : "바꾼 적 없어요"}</TooltipContent>
      </Tooltip>
    </li>
  );
}
