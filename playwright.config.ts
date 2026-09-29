import { defineConfig } from "@playwright/test";

/* UI 회귀 테스트. `npx playwright test` — dev 서버가 3111 에 떠 있으면 그걸 쓰고, 없으면 띄운다. */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3111",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npx next dev -p 3111",
    url: "http://localhost:3111",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
