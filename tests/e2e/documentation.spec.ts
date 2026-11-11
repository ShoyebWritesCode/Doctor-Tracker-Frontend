import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("capture fictional product evidence for the README", async ({ page }) => {
  test.skip(process.env.E2E_CAPTURE_SCREENSHOTS !== "1", "Explicit documentation capture only.");
  test.setTimeout(60_000);
  await page.goto("/login?next=%2Fdoctors");
  await page.getByLabel("Email address").fill("browser-test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fictional-browser-verification-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
  const response = await page.request.get("/api/v1/doctors?limit=1&sort=name%3Aasc");
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: { id: string }[]; meta: { total: number } };
  expect(body.meta.total, "Use only the explicit seeded documentation fixture").toBe(24);
  const directory = resolve("docs/screenshots");
  await mkdir(directory, { recursive: true });
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    await page.setViewportSize(viewport);
    for (const [name, route, endpoint] of [
      ["dashboard", "/dashboard", "/api/v1/dashboard/summary"],
      ["doctors", "/doctors", "/api/v1/doctors"],
      [
        "doctor-detail",
        `/doctors/${body.data[0]!.id}`,
        `/api/v1/doctors/${body.data[0]!.id}/patients`,
      ],
      ["patients", "/patients", "/api/v1/patients"],
    ] as const) {
      const loaded = page.waitForResponse(
        (result) => new URL(result.url()).pathname === endpoint && result.ok(),
      );
      await page.goto(route);
      await loaded;
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator('main [role="status"][aria-label^="Loading"]')).toHaveCount(0);
      await page.screenshot({
        path: resolve(directory, `${name}-${device}.png`),
        animations: "disabled",
        fullPage: name === "dashboard" || name === "doctor-detail",
      });
    }
  }
});
