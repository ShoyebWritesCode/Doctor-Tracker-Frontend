import { expect, test, type Page } from "@playwright/test";

const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;

test.describe("real backend authentication", () => {
  test.skip(
    !email || !password,
    "Set AUTH_E2E_EMAIL and AUTH_E2E_PASSWORD for an explicitly seeded test administrator.",
  );

  async function signIn(page: Page, destination = "/dashboard", expectedDestination = destination) {
    await page.goto(`/login?next=${encodeURIComponent(destination)}`);
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(expectedDestination);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  test("protects direct entry and refresh for each portal route", async ({ page }) => {
    for (const path of ["/dashboard", "/doctors", "/patients"]) {
      await page.goto(path);
      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
      await expect(page.getByRole("heading", { name: "Administrator sign in" })).toBeVisible();
    }
    await signIn(page, "/doctors?search=missing-doctor");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
  });

  test("keeps the cookie private and supports sign-out and Back navigation", async ({
    page,
    context,
  }) => {
    await signIn(page);
    if (test.info().project.name === "mobile-chromium") {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    await page
      .getByRole("link", { name: "Doctors", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
    const cookie = (await context.cookies("http://localhost:3000/api/v1/auth/me")).find(
      (item) => item.name === "doctor_tracker_session",
    );
    expect(cookie).toMatchObject({ httpOnly: true, path: "/api/v1", sameSite: "Lax" });
    expect(await page.evaluate(() => document.cookie)).not.toContain("doctor_tracker_session");
    expect(
      await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
    ).toEqual({ local: {}, session: {} });
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL("/login");
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Administrator sign in" })).toBeVisible();
    const current = await page.request.get("/api/v1/auth/me");
    expect(current.status()).toBe(401);
  });

  test("returns the same safe error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill("fictional-wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "The email or password is incorrect." }),
    ).toBeVisible();
  });

  test("recovers from failed sign-out without leaving the workspace blocked", async ({ page }) => {
    await signIn(page);
    await page.route("**/api/v1/auth/logout", (route) =>
      route.fulfill({
        status: 500,
        json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
      }),
    );
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByText("Sign out failed", { exact: true })).toBeVisible();
    await page.unroute("**/api/v1/auth/logout");
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL("/login");
  });

  test("rejects external redirects and rechecks a revoked session", async ({
    page,
    playwright,
    context,
  }) => {
    await signIn(page, "//evil.example", "/dashboard");
    const cookie = (await context.cookies("http://localhost:3000/api/v1/auth/me")).find(
      (item) => item.name === "doctor_tracker_session",
    );
    expect(cookie).toBeDefined();
    const isolatedClient = await playwright.request.newContext({
      baseURL: "http://localhost:3000",
    });
    try {
      const revoked = await isolatedClient.post("/api/v1/auth/logout", {
        headers: { Cookie: `${cookie!.name}=${cookie!.value}`, Origin: "http://localhost:3000" },
      });
      expect(revoked.status()).toBe(204);
    } finally {
      await isolatedClient.dispose();
    }
    await page.reload();
    await expect(page).toHaveURL("/login?next=%2Fdashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeHidden();
  });

  test("provides keyboard navigation and fits the required review widths", async ({ page }) => {
    await signIn(page);
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
        `overflow at ${width}px`,
      ).toBe(false);
      if (width === 360 || width === 1440) {
        await page.screenshot({
          path: test.info().outputPath(`portal-${width}.png`),
          fullPage: true,
        });
      }
      if (width < 1024) {
        const trigger = page.getByRole("button", { name: "Open navigation" });
        await trigger.press("Enter");
        const drawer = page.getByRole("dialog", { name: "Doctor Tracker" });
        await expect(drawer).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    }
    await page
      .getByRole("link", { name: "Doctors", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Doctors", exact: true }).filter({ visible: true }),
    ).toHaveAttribute("aria-current", "page");
  });
});
