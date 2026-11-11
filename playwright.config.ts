import { defineConfig, devices } from "@playwright/test";
import { e2eOrigin, e2ePort } from "./tests/e2e/helpers/environment";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  // The real API suite shares one fixture; concurrent writes would invalidate live-total checks.
  workers: 1,
  testDir: "./tests/e2e",
  use: {
    baseURL: e2eOrigin,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    env: { E2E_ISOLATED_BUILD: "1" },
    command: `npm run dev -- --webpack --port ${e2ePort}`,
    reuseExistingServer: !process.env.CI,
    url: e2eOrigin,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
