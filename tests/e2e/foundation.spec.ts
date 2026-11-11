import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./helpers/environment";

test("renders the administrator sign-in page", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 1, name: "Administrator sign in" }),
  ).toBeVisible();
});

test("does not submit credentials when JavaScript is unavailable", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: e2eOrigin,
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    await page.getByLabel("Email address").fill("no-script@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fictional-no-script-password");
    await page.getByLabel("Password", { exact: true }).press("Enter");
    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Enable JavaScript to sign in securely.")).toBeVisible();
  } finally {
    await context.close();
  }
});
