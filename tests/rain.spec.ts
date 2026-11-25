import { expect, test } from "@playwright/test";

/* 캔버스 빗줄기(선택 설치 항목 rain) — 비가 오면 돌고 CSS 층을 끄고, CSS 로 바꾸면 물러난다 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

const html = (page: import("@playwright/test").Page) => page.locator("html");
const streakDisplay = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body, "::before").display);

test("비를 켜면 캔버스가 돌고 CSS 빗줄기 층은 꺼진다, 끄면 멈춘다", async ({ page }) => {
  await expect(html(page)).not.toHaveAttribute("data-rain-canvas", /.*/);
  await page.evaluate(() => (document.documentElement.dataset.weather = "rain"));
  await expect(html(page)).toHaveAttribute("data-rain-canvas", "");
  await expect(page.locator('canvas[data-slot="rain"]')).toBeVisible();
  expect(await streakDisplay(page)).toBe("none");

  // 실제로 무언가 그려지고 있다 (투명하지 않은 픽셀이 있다)
  await page.waitForTimeout(300);
  const painted = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-slot="rain"]')!;
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  expect(painted).toBeGreaterThan(100);

  await page.evaluate(() => delete document.documentElement.dataset.weather);
  await expect(html(page)).not.toHaveAttribute("data-rain-canvas", /.*/);
  await expect(page.locator('canvas[data-slot="rain"]')).toBeHidden();
});

test("보기 설정에서 CSS 를 고르면 캔버스가 내려가고 CSS 빗줄기가 돌아온다", async ({ page }) => {
  await page.evaluate(() => (document.documentElement.dataset.weather = "rain"));
  await expect(html(page)).toHaveAttribute("data-rain-canvas", "");
  await page.getByRole("button", { name: "보기 설정" }).click();
  await page.locator('[data-slot="view-settings"]').getByRole("button", { name: "CSS", exact: true }).click();
  await expect(html(page)).not.toHaveAttribute("data-rain-canvas", /.*/);
  await expect(page.locator('canvas[data-slot="rain"]')).toHaveCount(0);
  expect(await streakDisplay(page)).toBe("block");
});

test("움직임 줄이기면 캔버스를 안 돌리고 CSS 빗줄기를 둔다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => (document.documentElement.dataset.weather = "rain"));
  await page.waitForTimeout(200);
  await expect(html(page)).not.toHaveAttribute("data-rain-canvas", /.*/);
  expect(await streakDisplay(page)).toBe("block");
});

test("다른 렌더러(data-rain-glass)가 돌면 물러난다", async ({ page }) => {
  await page.evaluate(() => (document.documentElement.dataset.weather = "rain"));
  await expect(html(page)).toHaveAttribute("data-rain-canvas", "");
  await page.evaluate(() => (document.documentElement.dataset.rainGlass = ""));
  await expect(html(page)).not.toHaveAttribute("data-rain-canvas", /.*/);
});
