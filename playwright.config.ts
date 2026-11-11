import { defineConfig, devices } from "@playwright/test";
import { e2eOrigin, e2ePort } from "./tests/e2e/helpers/environment";

const production = process.env.E2E_PRODUCTION === "1";
const startBackend = process.env.E2E_START_BACKEND === "1";
const target = new URL(process.env.API_PROXY_TARGET ?? "http://localhost:4000");
if (startBackend) {
  if (
    target.protocol !== "http:" ||
    target.hostname !== "localhost" ||
    target.pathname !== "/" ||
    target.search ||
    target.hash ||
    target.username ||
    target.password
  )
    throw new Error("The managed disposable backend requires an http://localhost API origin.");
  process.env.AUTH_E2E_EMAIL ??= "browser-test@example.test";
  process.env.AUTH_E2E_PASSWORD ??= "fictional-browser-verification-only";
}
if (production && (!process.env.AUTH_E2E_EMAIL || !process.env.AUTH_E2E_PASSWORD))
  throw new Error(
    "Production browser verification requires the disposable backend credentials; do not silently skip integration tests.",
  );
const frontendServer = {
  env: { E2E_ISOLATED_BUILD: "1" },
  command: production
    ? `npm run build -- --webpack && npm start -- --port ${e2ePort}`
    : `npm run dev -- --webpack --port ${e2ePort}`,
  reuseExistingServer: !production && !process.env.CI,
  url: e2eOrigin,
  timeout: 180_000,
  gracefulShutdown: { signal: "SIGTERM" as const, timeout: 10_000 },
};

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  retries: 0,
  // The real API suite shares one fixture; concurrent writes would invalidate live-total checks.
  workers: 1,
  testDir: "./tests/e2e",
  use: {
    baseURL: e2eOrigin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: startBackend
    ? [
        {
          command: "npm run test:auth-server",
          cwd: process.env.E2E_BACKEND_DIR ?? "../Doctor-Tracker-Backend",
          env: {
            BROWSER_TEST_API_PORT: target.port || "80",
            BROWSER_TEST_FRONTEND_ORIGIN: e2eOrigin,
          },
          url: `${target.origin}/ready`,
          reuseExistingServer: false,
          timeout: 90_000,
        },
        frontendServer,
      ]
    : frontendServer,
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
