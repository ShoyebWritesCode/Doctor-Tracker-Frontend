import { expect, test } from "@playwright/test";

const reviewWidths = [360, 768, 1024, 1440] as const;

test("component gallery remains within every review viewport", async ({ page }) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "The development gallery is intentionally disabled in production.",
  );
  for (const width of reviewWidths) {
    await page.setViewportSize({ height: 900, width });
    await page.goto("/dev/components");

    await expect(
      page.getByRole("heading", { level: 1, name: "Interface foundations" }),
    ).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow, `horizontal overflow at ${width}px`).toBe(false);
  }
});

test("dialog supports keyboard entry, escape, and focus restoration", async ({ page }) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "Production dialog behavior is covered through real doctor/patient forms.",
  );
  await page.goto("/dev/components");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.press("Enter");

  await expect(page.getByRole("dialog", { name: "Edit clinician" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Edit clinician" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("does not expose development components in production", async ({ page }) => {
  test.skip(process.env.E2E_PRODUCTION !== "1", "Production-only route protection check.");
  const response = await page.goto("/dev/components");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Interface foundations" })).toBeHidden();
});
