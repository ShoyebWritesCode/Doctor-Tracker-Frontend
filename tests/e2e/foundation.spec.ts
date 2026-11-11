import { expect, test } from "@playwright/test";

test("renders the administrator sign-in page", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 1, name: "Administrator sign in" }),
  ).toBeVisible();
});
