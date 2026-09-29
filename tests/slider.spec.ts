import { expect, test } from "@playwright/test";

/* Slider 정렬 기하 회귀 테스트.
   (1) 트랙 좌우 = 옆 글자 열(SliderField 컨테이너) 좌우
   (2) 채움 끝 = 손잡이 중심 (0 / 100 / 50)
   (3) 드래그 놓으면 눈금에 스냅, 화살표는 눈금 단위
   dev 서버(3111)를 띄운 상태에서 `npx playwright test` */

const THUMBS = ["dot", "pill", "ring", "bar", "knob"] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/#slider");
  await page.locator("#slider").scrollIntoViewIfNeeded();
});

for (const t of THUMBS) {
  test(`${t}: 트랙이 글자 열과 같고 채움 끝이 손잡이 중심`, async ({ page }) => {
    const root = page.locator(`#slider-${t}`);
    const thumb = root.locator('[role="slider"]');
    const track = root.locator('[data-slot="slider-track"]');
    const range = root.locator('[data-slot="slider-range"]');
    const column = root.locator("xpath=..");

    const col = (await column.boundingBox())!;
    const tr = (await track.boundingBox())!;
    expect(Math.abs(tr.x - col.x)).toBeLessThan(0.6);
    expect(Math.abs(col.x + col.width - (tr.x + tr.width))).toBeLessThan(0.6);

    for (const key of ["Home", "End"]) {
      await thumb.focus();
      await page.keyboard.press(key);
      await page.waitForTimeout(200);
      const r = (await range.boundingBox())!;
      const th = (await thumb.boundingBox())!;
      expect(Math.abs(r.x + r.width - (th.x + th.width / 2))).toBeLessThan(0.6);
    }
  });
}

test("스냅: 37에 놓으면 40, 화살표는 10", async ({ page }) => {
  const root = page.locator('[aria-label="스냅 데모"]');
  const thumb = root.locator('[role="slider"]');
  const box = (await root.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.5, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.37, y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  expect(await thumb.getAttribute("aria-valuenow")).toBe("40");
  await thumb.focus();
  await page.keyboard.press("ArrowRight");
  expect(await thumb.getAttribute("aria-valuenow")).toBe("50");
});
