import { expect, test } from "@playwright/test";

/* 보기 설정 패널 · 색 토큰 덮어쓰기 · 목차 세로 휠 → 가로 스크롤 (친구 피드백 2026-11-25) */

const panel = '[data-slot="popover-content"]';

async function openSettings(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "보기 설정" }).click();
  await page.locator(panel).waitFor();
  // 등장 애니메이션(pop-in, 0.98 배율)이 끝난 뒤에 잰다
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="popover-content"]')!.getAnimations().every((a) => a.playState === "finished"),
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

test("배경만 보기: 패널이 닫히고 Esc 로 돌아온다", async ({ page }) => {
  await openSettings(page);
  await page.locator(panel).getByRole("button", { name: "배경만 보기" }).click();
  await expect(page.locator(panel)).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-peek", "");
  await expect(page.locator("main")).toHaveCSS("visibility", "hidden");
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveAttribute("data-peek", /.*/);
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
