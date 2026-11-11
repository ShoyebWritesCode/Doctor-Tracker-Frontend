import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./helpers/environment";

const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;

async function audit(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const path = test.info().outputPath(`axe-${name}.json`);
  await writeFile(path, JSON.stringify(results, null, 2));
  await test.info().attach(`axe-${name}`, {
    path,
    contentType: "application/json",
  });
  // Review all violations, not only the serious/critical acceptance threshold.
  expect(results.violations, `Accessibility violations in ${name}`).toEqual([]);
}

async function signIn(page: Page) {
  await page.goto("/login?next=%2Fdoctors");
  await page.getByLabel("Email address").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
}

test.describe("quality audit against the disposable API", () => {
  test.skip(!email || !password, "Requires the explicitly seeded disposable backend.");

  test("audits populated pages, form errors, navigation and responsive keyboard behavior", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || /hydration|did not match/i.test(message.text()))
        errors.push(message.text());
    });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await audit(page, "login");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByLabel("Email address")).toBeFocused();
    await audit(page, "login-validation");
    await signIn(page);
    const prefix = `Audit${Date.now()}`;
    const created = await page.request.post("/api/v1/doctors", {
      headers: { Origin: e2eOrigin },
      data: {
        name: `${prefix} Doctor`,
        specialization: "Cardiology",
        hospital: "Fictional Quality Practice",
        email: `${prefix.toLowerCase()}@example.test`,
        phone: "+880 1700 000000",
      },
    });
    expect(created.status()).toBe(201);
    const doctor = (await created.json()).data as { id: string; name: string };
    for (const status of ["active", "follow_up", "discharged"]) {
      const patient = await page.request.post(`/api/v1/doctors/${doctor.id}/patients`, {
        headers: { Origin: e2eOrigin },
        data: {
          name: `${prefix} ${status}`,
          condition: "Routine review",
          status,
          phone: "+880 1700 111111",
        },
      });
      expect(patient.status()).toBe(201);
    }
    for (const path of ["/doctors", `/doctors/${doctor.id}`, "/patients", "/dashboard"]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
      // Wait for the real records/analytics, not just their surrounding headings.
      await expect(page.locator('main [role="status"][aria-label^="Loading"]')).toHaveCount(0);
      for (const width of [360, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
          `${path} fits ${width}px`,
        ).toBe(true);
        await audit(page, `${path.replaceAll("/", "-")}-${width}`);
      }
    }
    await page.goto("/doctors");
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await page.setViewportSize({ width: 360, height: 800 });
    const navigation = page.getByRole("button", { name: "Open navigation" });
    await navigation.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Doctor Tracker", exact: true });
    await expect(drawer).toBeVisible();
    await audit(page, "mobile-navigation");
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press("Tab");
      expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      );
    }
    await page.keyboard.press("Escape");
    await expect(navigation).toBeFocused();
    for (const kind of ["doctor", "patient"] as const) {
      if (kind === "patient") await page.goto(`/doctors/${doctor.id}`);
      const trigger = page.getByRole("button", { name: `Add ${kind}`, exact: true });
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog", { name: `Add a ${kind}`, exact: true });
      await audit(page, `${kind}-dialog`);
      await dialog.getByRole("button", { name: `Create ${kind}`, exact: true }).click();
      await expect(dialog.getByRole("alert").first()).toBeVisible();
      await audit(page, `${kind}-validation`);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    expect(
      errors,
      "No uncaught errors, console errors or hydration warnings in normal workflows",
    ).toEqual([]);
  });

  test("recovers from forbidden, throttled, broken and malformed list responses", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await signIn(page);
    for (const status of [403, 429, 500, 200]) {
      await page.route("**/api/v1/doctors?*", (route) =>
        route.fulfill({
          status,
          ...(status === 200
            ? { contentType: "application/json", body: "{broken-json" }
            : {
                json: {
                  error: { code: "AUDIT_FAILURE", message: "Internal diagnostic must not appear" },
                },
              }),
        }),
      );
      await page.goto(`/doctors?search=failure-${status}`);
      await expect(page.locator("main").getByRole("alert")).toContainText(
        "We could not load the records",
      );
      await expect(page.getByText("Internal diagnostic must not appear")).toHaveCount(0);
      await page.unroute("**/api/v1/doctors?*");
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await expect(page.getByRole("heading", { name: "No matching doctors" })).toBeVisible();
      await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    }
  });

  test("preserves unsaved values across an offline mutation and recovery", async ({
    page,
    context,
  }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Add doctor", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add a doctor", exact: true });
    const name = `Offline${Date.now()} Doctor`;
    await dialog.getByLabel("Full name").fill(name);
    await dialog.getByLabel("Specialization").fill("Cardiology");
    await dialog.getByLabel("Hospital").fill("Fictional Offline Practice");
    await dialog.getByLabel("Email").fill(`offline-${Date.now()}@example.test`);
    await dialog.getByLabel("Phone").fill("+880 1700 000000");
    await context.setOffline(true);
    await dialog.getByRole("button", { name: "Create doctor", exact: true }).click();
    await expect(dialog.getByRole("alert").first()).toBeVisible();
    await expect(dialog.getByLabel("Full name")).toHaveValue(name);
    await context.setOffline(false);
    await dialog.getByRole("button", { name: "Create doctor", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByLabel("Search", { exact: true }).fill(name);
    await expect(page.getByText("1–1 of 1 doctors", { exact: true })).toBeVisible();
  });
});
