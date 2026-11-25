import { expect, test } from "@playwright/test";

/* 보기 설정 패널 · 색 토큰 덮어쓰기 · 목차 세로 휠 → 가로 스크롤 (친구 피드백 2026-11-25) */

const panel = '[data-slot="view-settings"]';

async function openSettings(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "보기 설정" }).click();
  await page.locator(panel).waitFor();
  // 등장 애니메이션(pop-in, 0.98 배율)이 끝난 뒤에 잰다
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="view-settings"]')!.getAnimations().every((a) => a.playState === "finished"),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("헤더 높이: 비·테마를 바꿔도 같다", async ({ page }) => {
  const header = page.locator("header");
  const h0 = (await header.boundingBox())!.height;
  await openSettings(page);
  await page.locator(panel).getByRole("button", { name: "비", exact: true }).click();
  await page.locator(panel).getByRole("button", { name: "night-city" }).click();
  await page.waitForTimeout(250);
  expect((await header.boundingBox())!.height).toBe(h0);
});

test("패널: 비를 켜고 꺼도 패널 크기가 같다", async ({ page }) => {
  await openSettings(page);
  const p = page.locator(panel);
  const a = await p.boundingBox();
  await p.getByRole("button", { name: "비", exact: true }).click();
  await page.waitForTimeout(250);
  expect(await p.boundingBox()).toEqual(a);
});

test("배경만 보기: 창은 떠 있고, Esc 는 배경만 보기만 끝낸다", async ({ page }) => {
  await openSettings(page);
  await page.locator(panel).getByRole("button", { name: "배경만 보기" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-peek", "");
  await expect(page.locator("main")).toHaveCSS("visibility", "hidden");
  await expect(page.locator(panel)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveAttribute("data-peek", /.*/);
  await expect(page.locator(panel)).toBeVisible();
  await page.keyboard.press("Escape"); // 두 번째 Esc 는 창을 닫는다
  await expect(page.locator(panel)).toHaveCount(0);
});

test("배경만 보기 중 창을 닫으면 돌아오기 바가 뜬다", async ({ page }) => {
  await openSettings(page);
  await page.locator(panel).getByRole("button", { name: "배경만 보기" }).click();
  await page.locator(panel).getByRole("button", { name: "닫기" }).click();
  const bar = page.getByRole("button", { name: "카드 다시 보기 (Esc)" });
  await expect(bar).toBeVisible();
  await bar.click();
  await expect(page.locator("main")).toHaveCSS("visibility", "visible");
});

test("바깥(페이지)을 눌러도 창은 안 닫힌다", async ({ page }) => {
  await openSettings(page);
  await page.mouse.click(40, 600);
  await expect(page.locator(panel)).toBeVisible();
});

test("비 표현 선택지: night-city 에만 있다", async ({ page }) => {
  await openSettings(page);
  const p = page.locator(panel);
  await expect(p.getByRole("button", { name: "빗줄기" })).toHaveCount(0);
  await p.getByRole("button", { name: "night-city" }).click();
  await expect(p.getByRole("button", { name: "빗줄기" })).toBeVisible();
});

test("높이: 내용만큼 — day 는 640 보다 작고 night-city 는 640", async ({ page }) => {
  await openSettings(page);
  const p = page.locator(panel);
  expect((await p.boundingBox())!.height).toBeLessThan(600);
  await p.getByRole("button", { name: "night-city" }).click();
  await expect.poll(async () => Math.round((await p.boundingBox())!.height)).toBe(640);
});

test("버튼은 끌기를 시작하지 않는다", async ({ page }) => {
  await openSettings(page);
  const p = page.locator(panel);
  const start = (await p.boundingBox())!;
  const btn = (await p.getByRole("button", { name: "닫기" }).boundingBox())!;
  await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2);
  await page.mouse.down();
  await page.mouse.move(btn.x - 200, btn.y + 100, { steps: 4 });
  await page.mouse.up();
  expect(Math.round((await p.boundingBox())!.x)).toBe(Math.round(start.x));
});

test("끌어서 옮기면 자리를 기억하고, 두 번 누르면 원래 자리로", async ({ page }) => {
  await openSettings(page);
  const p = page.locator(panel);
  const handle = p.locator('[data-slot="view-settings-handle"]');
  const start = (await p.boundingBox())!;
  const h = (await handle.boundingBox())!;
  // 제목 글자 줄이 아니라 머리 줄 위쪽 여백(8px 아래)을 잡는다 — 예전엔 여기가 안 잡혔다
  await page.mouse.move(h.x + 20, h.y + 8);
  await page.mouse.down();
  await page.mouse.move(h.x + 20 - 300, h.y + 8 + 100, { steps: 6 });
  await page.mouse.up();
  const moved = (await p.boundingBox())!;
  expect(Math.round(moved.x)).toBe(Math.round(start.x - 300));
  expect(Math.round(moved.y)).toBe(Math.round(start.y + 100));

  // 닫았다 열어도 그 자리 (닫힘 애니메이션이 끝나 사라진 뒤에 다시 연다).
  // 마우스를 손잡이에서 치운다 — 손잡이 툴팁이 떠 있으면 Esc 가 툴팁부터 닫는다(Radix 레이어 순서, 정상)
  await page.mouse.move(10, 890);
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(p).toHaveCount(0);
  await openSettings(page);
  expect(Math.round((await p.boundingBox())!.x)).toBe(Math.round(moved.x));

  await handle.dblclick();
  await expect.poll(async () => Math.round((await p.boundingBox())!.x)).toBe(Math.round(start.x));
  expect(await page.evaluate(() => localStorage.getItem("hctoast-settings-pos"))).toBeNull();
});

test("화면 밖에 저장된 자리여도 창은 화면 안에 그려진다", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("hctoast-settings-pos", JSON.stringify({ x: 5000, y: -900 })));
  await openSettings(page);
  const b = (await page.locator(panel).boundingBox())!;
  const vp = page.viewportSize()!;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height);
});

test("색 토큰: 색 고르기 아이콘이 입력칸 왼쪽에 있다", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("tab", { name: "색 토큰" }).click();
  const pick = (await page.getByRole("button", { name: "action 색 고르기", exact: true }).boundingBox())!;
  const input = (await page.getByLabel("action", { exact: true }).boundingBox())!;
  expect(pick.x + pick.width).toBeLessThanOrEqual(input.x);
  expect(Math.abs(pick.y + pick.height / 2 - (input.y + input.height / 2))).toBeLessThan(1);
});

test("색 토큰: hex 로 바꾸면 적용·저장되고, 토큰별·전체 초기화가 된다", async ({ page }) => {
  const action = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--action").trim());
  const before = await action();

  await openSettings(page);
  await page.getByRole("tab", { name: "색 토큰" }).click();
  const input = page.getByLabel("action", { exact: true });
  await expect(input).toHaveValue(/^#[0-9a-f]{6}$/);
  await input.fill("#f0a");
  expect(await action()).toBe("#ff00aa");

  // 새로고침 뒤에도 남는다 (하이드레이션 전 스크립트가 다시 건다)
  await page.reload();
  expect(await action()).toBe("#ff00aa");

  // 다른 테마엔 안 번진다
  await page.evaluate(() => (document.documentElement.dataset.theme = "night"));
  expect(await action()).not.toBe("#ff00aa");
  await page.evaluate(() => (document.documentElement.dataset.theme = "day"));

  await openSettings(page);
  await page.getByRole("tab", { name: "색 토큰" }).click();
  await page.getByLabel("fg", { exact: true }).fill("#123456");
  await page.getByRole("button", { name: "action 기본값으로", exact: true }).click();
  expect(await action()).toBe(before);
  await expect(page.getByLabel("action", { exact: true })).toHaveValue(before);

  await page.getByRole("button", { name: "전체 초기화" }).click();
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--fg").trim()),
  ).not.toBe("#123456");
});

test("색 토큰: 잘못된 hex 는 적용하지 않고, 칸을 떠나면 원래 값으로", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("tab", { name: "색 토큰" }).click();
  const input = page.getByLabel("accent", { exact: true });
  const orig = await input.inputValue();
  await input.fill("#zz");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.blur();
  await expect(input).toHaveValue(orig);
});

test("목차: 세로 휠이 가로 스크롤로 — 아래 → 오른쪽, 위 → 왼쪽", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  const nav = page.getByRole("navigation", { name: "목차" });
  const left = () => nav.evaluate((el) => el.scrollLeft);
  expect(await nav.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const b = (await nav.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.wheel(0, 200);
  await expect.poll(left).toBeGreaterThan(0);
  const pageY = await page.evaluate(() => window.scrollY);
  expect(pageY).toBe(0); // 가로로 썼으니 페이지는 안 내려간다
  const mid = await left();
  await page.mouse.wheel(0, -100);
  await expect.poll(left).toBeLessThan(mid);
});
