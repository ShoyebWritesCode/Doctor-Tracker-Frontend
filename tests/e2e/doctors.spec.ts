import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin as origin } from "./helpers/environment";

const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;

test.describe("real backend doctor workflows", () => {
  test.skip(!email || !password, "Requires the explicitly seeded disposable backend.");

  async function signIn(page: Page) {
    await page.goto("/login?next=%2Fdoctors");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
  }
  function token() {
    return `Review${Date.now()}${test.info().parallelIndex}`;
  }
  async function seedDoctor(page: Page, prefix: string, index = 0) {
    const response = await page.request.post("/api/v1/doctors", {
      headers: { Origin: origin },
      data: {
        name: `${prefix} Doctor ${String(index).padStart(2, "0")}`,
        specialization: "Cardiology",
        hospital: `${prefix} Practice`,
        phone: "+880 1700 000000",
        email: `${prefix.toLowerCase()}-${index}@example.test`,
      },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).data as { id: string; name: string; email: string };
  }

  for (const kind of ["doctor", "patient"] as const) {
    test(`dismisses the ${kind} form on the first click without blur-driven layout shifts`, async ({
      page,
    }) => {
      await signIn(page);
      if (kind === "patient") {
        const doctor = await seedDoctor(page, token());
        await page.goto(`/doctors/${doctor.id}`);
      }
      const trigger = page.getByRole("button", { name: `Add ${kind}`, exact: true });
      const dialog = page.getByRole("dialog", { name: `Add a ${kind}`, exact: true });
      const name = dialog.getByLabel(kind === "doctor" ? "Full name" : "Patient name");
      for (const dismissLabel of ["Close dialog", "Cancel"]) {
        for (const value of ["", "x"]) {
          await trigger.click();
          await expect(name).toBeFocused();
          if (value) await name.fill(value);
          const dismiss = dialog.getByRole("button", { name: dismissLabel, exact: true });
          const bounds = await dismiss.boundingBox();
          expect(bounds).not.toBeNull();
          // Fixed pointer coordinates catch a button moving between down and up.
          await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
          await page.mouse.down();
          await expect(dialog.getByRole("alert")).toHaveCount(0);
          await page.mouse.up();
          await expect(dialog).toBeHidden();
          await expect(trigger).toBeFocused();
        }
      }
      await trigger.click();
      await expect(name).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await dialog.getByRole("button", { name: "Close dialog", exact: true }).click();
      await expect(dialog).toBeHidden();
      await trigger.click();
      await expect(dialog.getByRole("alert")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test("keeps pagination, debounced search, filters, sort and browser history synchronized", async ({
    page,
  }) => {
    await signIn(page);
    const prefix = token();
    for (let index = 0; index < 12; index++) await seedDoctor(page, prefix, index);
    await page.goto(`/doctors?search=${prefix}&limit=10&sort=name%3Aasc`);
    await expect(page.getByText("1–10 of 12 doctors", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.getByText("11–12 of 12 doctors", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/page=2/);
    await page.reload();
    await expect(page.getByText("11–12 of 12 doctors", { exact: true })).toBeVisible();
    await page.getByLabel("Search", { exact: true }).fill(`${prefix} Doctor 00`);
    await expect(page.getByText("1–1 of 1 doctors", { exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.has("page")).toBe(false);
    await page.goBack();
    await expect(page.getByLabel("Search", { exact: true })).toHaveValue(prefix);
    await expect(page.getByText("11–12 of 12 doctors", { exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.getByLabel("Search", { exact: true })).toHaveValue(`${prefix} Doctor 00`);
    await page.locator("summary").filter({ hasText: "Filters" }).click();
    await page.getByLabel("Specialization", { exact: true }).fill("Neurology");
    await expect(page.getByRole("heading", { name: "No matching doctors" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await expect(page.getByLabel("Search", { exact: true })).toHaveValue("");
    await page.getByLabel("Sort by", { exact: true }).click();
    await page.getByRole("option", { name: "Name Z–A", exact: true }).click();
    await expect(page).toHaveURL(/sort=name%3Adesc/);
  });

  test("preserves doctor form values on conflict and server failure, then creates the record", async ({
    page,
  }) => {
    await signIn(page);
    const prefix = token();
    const existing = await seedDoctor(page, prefix);
    const trigger = page.getByRole("button", { name: "Add doctor", exact: true });
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add a doctor" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Full name").fill(`${prefix} New doctor`);
    await dialog.getByLabel("Specialization").fill("Neurology");
    await dialog.getByLabel("Hospital").fill(`${prefix} Practice`);
    await dialog.getByLabel("Phone").fill("+880 1700 123456");
    await dialog.getByLabel("Email").fill(existing.email);
    await dialog.getByRole("button", { name: "Create doctor" }).click();
    await expect(dialog.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByLabel("Full name")).toHaveValue(`${prefix} New doctor`);
    await dialog.getByLabel("Email").fill(`${prefix.toLowerCase()}-new@example.test`);
    await page.route("**/api/v1/doctors", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        });
      } else await route.continue();
    });
    await dialog.getByRole("button", { name: "Create doctor" }).click();
    await expect(dialog.getByRole("alert").filter({ hasText: "could not" })).toBeVisible();
    await expect(dialog.getByLabel("Hospital")).toHaveValue(`${prefix} Practice`);
    await page.unroute("**/api/v1/doctors");
    await dialog.getByRole("button", { name: "Create doctor" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.getByLabel("Search", { exact: true }).fill(`${prefix} New doctor`);
    await expect(
      page
        .getByRole("link", { name: `Open ${prefix} New doctor`, exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
  });

  test("adds and deletes scoped patients, retries failures, clamps empty pages and fits review widths", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const prefix = token();
    const doctor = await seedDoctor(page, prefix);
    // A maximal, unbroken hospital name also exercises wrapping in the identity header.
    const longResponse = await page.request.post("/api/v1/doctors", {
      headers: { Origin: origin },
      data: {
        name: `${prefix} ${"N".repeat(90)}`,
        specialization: "Cardiology",
        hospital: "H".repeat(160),
        email: `${prefix.toLowerCase()}-long@example.test`,
        phone: "+880 1700 000000",
      },
    });
    expect(longResponse.status()).toBe(201);
    const longDoctor = (await longResponse.json()).data;
    await page.goto(`/doctors?search=${prefix}`);
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(
        page
          .getByRole("link", { name: `Open ${doctor.name}`, exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
        `directory overflow at ${width}`,
      ).toBe(false);
      if (width === 360 || width === 1440)
        await page.screenshot({
          path: test.info().outputPath(`doctors-${width}.png`),
          fullPage: true,
        });
    }
    await page.goto(`/doctors/${longDoctor.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(longDoctor.name);
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
        `profile overflow at ${width}`,
      ).toBe(false);
    }
    await page.goto(`/doctors/${doctor.id}`);
    await expect(page.getByRole("heading", { name: "No patients assigned" })).toBeVisible();
    await page.getByRole("button", { name: "Add patient", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add a patient" });
    await dialog.getByLabel("Patient name").fill(`${prefix} Patient`);
    await dialog.getByRole("textbox", { name: "Condition", exact: true }).fill("Routine review");
    await dialog.getByRole("button", { name: "Create patient" }).click();
    await expect(
      dialog.getByText("Provide an email address or phone number.", { exact: true }).last(),
    ).toBeVisible();
    await dialog.getByLabel("Phone", { exact: false }).fill("+880 1700 111111");
    const patientsEndpoint = `**/api/v1/doctors/${doctor.id}/patients`;
    await page.route(patientsEndpoint, async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        });
      else await route.continue();
    });
    await dialog.getByRole("button", { name: "Create patient" }).click();
    await expect(dialog.getByRole("alert").filter({ hasText: "could not add" })).toBeVisible();
    await expect(dialog.getByLabel("Patient name")).toHaveValue(`${prefix} Patient`);
    await page.unroute(patientsEndpoint);
    await dialog.getByRole("button", { name: "Create patient" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel("Assigned patient count")).toHaveText("1");
    await page.getByLabel("Search", { exact: true }).fill("no-such-patient");
    await expect(page.getByRole("heading", { name: "No matching patients" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await page.locator("summary").filter({ hasText: "Filters" }).click();
    await page.getByLabel("Patient status", { exact: true }).click();
    await page.getByRole("option", { name: "Discharged", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching patients" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    // One record per page makes the final-record deletion exercise page correction.
    const seeded = await page.request.post(`/api/v1/doctors/${doctor.id}/patients`, {
      headers: { Origin: origin },
      data: {
        name: `${prefix} Second patient`,
        phone: "+880 1700 222222",
        condition: "Routine review",
        status: "active",
      },
    });
    expect(seeded.status()).toBe(201);
    await page.goto(`/doctors/${doctor.id}?limit=1&page=2&sort=name%3Aasc`);
    await expect(page.getByText("2–2 of 2 patients", { exact: true })).toBeVisible();
    const deleteTrigger = page
      .getByRole("button", { name: `Delete patient ${prefix} Second patient`, exact: true })
      .filter({ visible: true });
    await deleteTrigger.press("Enter");
    const confirm = page.getByRole("dialog", {
      name: `Delete ${prefix} Second patient?`,
      exact: true,
    });
    await page.route(`**/api/v1/doctors/${doctor.id}/patients/*`, async (route) => {
      if (route.request().method() === "DELETE")
        await route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        });
      else await route.continue();
    });
    await confirm.getByRole("button", { name: "Delete permanently" }).click();
    await expect(confirm.getByRole("alert")).toContainText("Deletion failed");
    await expect(page.getByLabel("Assigned patient count")).toHaveText("2");
    await page.unroute(`**/api/v1/doctors/${doctor.id}/patients/*`);
    await confirm.getByRole("button", { name: "Delete permanently" }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByLabel("Assigned patient count")).toHaveText("1");
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Patients", exact: true })).toBeFocused();
    await expect(page).toHaveURL((url) => !url.searchParams.has("page"));
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({
        path: test.info().outputPath(`doctor-patients-${width}.png`),
        fullPage: true,
      });
    }
    await page.goto(`/doctors?search=${prefix}`);
    await expect(
      page
        .getByRole("table", { name: "Doctors", exact: true })
        .getByRole("row")
        .filter({ hasText: doctor.name })
        .getByRole("cell")
        .nth(3),
    ).toHaveText("1");
    const refreshed = await page.request.get(`/api/v1/doctors/${doctor.id}`);
    expect((await refreshed.json()).data.patientCount).toBe(1);
  });

  test("recovers a failed directory request and provides a missing-doctor exit", async ({
    page,
  }) => {
    await signIn(page);
    await page.route("**/api/v1/doctors?**", (route) =>
      route.fulfill({
        status: 503,
        json: { error: { code: "UNAVAILABLE", message: "Temporary failure" } },
      }),
    );
    await page.goto(`/doctors?search=${token()}-missing`);
    await expect(page.getByRole("alert").filter({ hasText: "could not load" })).toBeVisible();
    await page.unroute("**/api/v1/doctors?**");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching doctors" })).toBeVisible();
    await page.goto("/doctors/000000000000000000000000");
    await expect(
      page.getByRole("heading", { name: "Doctor not found", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to doctors", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
  });
});
