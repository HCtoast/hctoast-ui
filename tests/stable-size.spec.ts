import { expect, test } from "@playwright/test";

/* 상태 전환이 크기를 바꾸지 않는지.
   (1) 테마 버튼: primary ↔ secondary 전환 전후 각 버튼의 너비·높이 동일
   (2) 비 토글: 켜짐 ↔ 꺼짐 동일
   (3) 토글 후보(임시 /toggle-lab): 각 후보의 켜짐 ↔ 꺼짐 동일 */

async function box(locator: import("@playwright/test").Locator) {
  const b = (await locator.boundingBox())!;
  return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 };
}

test("테마 버튼: 선택이 바뀌어도 크기가 같다", async ({ page }) => {
  await page.goto("/");
  const group = page.locator('[aria-label="테마 선택"] button');
  const n = await group.count();
  const before = [];
  for (let i = 0; i < n; i++) before.push(await box(group.nth(i)));
  await group.nth(2).click(); // night-city 로 전환 → 0번은 secondary, 2번은 primary
  await page.waitForTimeout(250);
  for (let i = 0; i < n; i++) expect(await box(group.nth(i))).toEqual(before[i]);
});

test("비 토글: 켜짐/꺼짐 크기가 같다", async ({ page }) => {
  await page.goto("/");
  const btn = page.locator("header button", { hasText: /^비$/ });
  const off = await box(btn);
  await btn.click();
  await page.waitForTimeout(250);
  expect(await box(btn)).toEqual(off);
  await btn.click();
});

test("토글 후보: 각 후보의 켜짐/꺼짐 크기가 같다", async ({ page }) => {
  await page.goto("/toggle-lab");
  const toggles = page.locator('main [role="switch"], main button[aria-pressed]');
  const n = await toggles.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const t = toggles.nth(i);
    // 스위치는 문구와 한 세트(label) — 세트 전체 크기를 잰다
    const set = (await t.evaluate((el) => !!el.closest("label"))) ? t.locator("xpath=ancestor::label[1]") : t;
    const a = await box(set);
    await t.click();
    await page.waitForTimeout(200);
    const b = await box(set);
    expect(b, `toggle #${i}`).toEqual(a);
  }
});
