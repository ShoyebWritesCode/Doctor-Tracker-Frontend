import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin as origin } from "./helpers/environment";

const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;
test.describe("real backend global patient workflows", () => {
  test.skip(!email || !password, "Requires the explicitly seeded disposable backend.");
  async function signIn(page: Page) {
    await page.goto("/login?next=%2Fpatients");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Patients", exact: true })).toBeVisible();
  }
  const token = () => `Patients${Date.now()}${test.info().parallelIndex}`;
  async function doctor(page: Page, prefix: string, index = 0) {
    const response = await page.request.post("/api/v1/doctors", {
      headers: { Origin: origin },
      data: {
        name: `${prefix} Doctor ${String(index).padStart(2, "0")}`,
        specialization: "Cardiology",
        hospital: "Fictional Practice",
        email: `${prefix.toLowerCase()}-${index}@example.test`,
        phone: "+880 1700 000000",
      },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).data as { id: string; name: string };
  }
  async function patient(
    page: Page,
    doctorId: string,
    name: string,
    extra: Record<string, string> = {},
  ) {
    const response = await page.request.post(`/api/v1/doctors/${doctorId}/patients`, {
      headers: { Origin: origin },
      data: {
        name,
        condition: "Routine review",
        status: "active",
        phone: "+880 1700 111111",
        ...extra,
      },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).data as { id: string; name: string };
  }
  async function actions(page: Page, name: string, action: "Edit patient" | "Delete patient") {
    await page
      .getByRole("button", { name: `Actions for ${name}`, exact: true })
      .filter({ visible: true })
      .press("Enter");
    await page.getByRole("menuitem", { name: action, exact: true }).press("Enter");
  }

  test("combines server filters with a searchable paginated doctor picker and URL history", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const prefix = token();
    const doctors: { id: string; name: string }[] = [];
    for (let index = 0; index < 11; index++) doctors.push(await doctor(page, prefix, index));
    for (let index = 0; index < 12; index++)
      await patient(page, doctors[0]!.id, `${prefix} A${String(index).padStart(2, "0")}`, {
        status: index === 11 ? "follow_up" : "active",
      });
    await patient(page, doctors[10]!.id, `${prefix} B00`, { status: "follow_up" });
    await page.goto(`/patients?search=${prefix}&limit=10&sort=name%3Aasc`);
    await expect(page.getByText("1–10 of 13 patients", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.getByText("11–13 of 13 patients", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("11–13 of 13 patients", { exact: true })).toBeVisible();
    await page.getByLabel("Search", { exact: true }).fill(`${prefix} A00`);
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await expect(page).toHaveURL((url) => !url.searchParams.has("page"));
    await page.goBack();
    await expect(page.getByLabel("Search", { exact: true })).toHaveValue(prefix);
    await expect(page.getByText("11–13 of 13 patients", { exact: true })).toBeVisible();
    await page.locator("summary").filter({ hasText: "Filters" }).click();
    await page.getByLabel("Condition", { exact: true }).fill("Routine review");
    await expect(page).toHaveURL(/condition=Routine\+review/);
    await page.getByLabel("Patient status", { exact: true }).click();
    await page.getByRole("option", { name: "Follow-up", exact: true }).click();
    await expect(page.getByText("1–2 of 2 patients", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Doctor All doctors", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Filter by doctor" });
    await picker.getByLabel("Find a doctor").fill(prefix);
    await expect(picker.getByText("1–10 of 11 doctors", { exact: true })).toBeVisible();
    await picker.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(picker.getByText("11–11 of 11 doctors", { exact: true })).toBeVisible();
    await picker.getByRole("button", { name: `Select ${doctors[10]!.name}`, exact: true }).click();
    await expect(picker).toBeHidden();
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await expect(page).toHaveURL((url) => url.searchParams.get("doctorId") === doctors[10]!.id);
    await page.getByLabel("Created from (UTC)").fill("2000-01-01");
    await page.getByLabel("Created before (UTC)").fill("2100-01-01");
    await expect(page).toHaveURL(/createdTo=2100/);
    await page.reload();
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await page.locator("summary").filter({ hasText: "Filters" }).click();
    await expect(
      page.getByRole("button", { name: `Doctor ${doctors[10]!.name}`, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await expect(page).toHaveURL("/patients");
  });

  test("reuses scoped creation, saves only edited fields, recovers failures and corrects deletion pages", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const prefix = token();
    const clinician = await doctor(page, prefix);
    const name = `${prefix} Target`;
    await page.goto(`/doctors/${clinician.id}`);
    await page.getByRole("button", { name: "Add patient", exact: true }).click();
    const create = page.getByRole("dialog", { name: "Add a patient" });
    await create.getByLabel("Patient name").fill(name);
    await create.getByLabel("Phone (optional)").fill("+880 1700 111111");
    await create.getByLabel("Email (optional)").fill(`${prefix.toLowerCase()}@example.test`);
    await create.getByRole("textbox", { name: "Condition", exact: true }).fill("Routine review");
    await create.getByRole("button", { name: "Create patient" }).click();
    await expect(create).toBeHidden();
    await page.goto(`/patients?search=${prefix}&status=active`);
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await actions(page, name, "Edit patient");
    const edit = page.getByRole("dialog", { name: "Edit patient", exact: true });
    await expect(edit.getByRole("textbox", { name: "Patient name" })).toHaveValue(name);
    await edit.getByRole("textbox", { name: "Condition", exact: true }).fill("Aftercare");
    await edit.getByLabel("Email (optional)").fill("");
    await edit.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: "Follow-up", exact: true }).click();
    await page.route("**/api/v1/patients/*", async (route) => {
      if (route.request().method() === "PATCH")
        await route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        });
      else await route.continue();
    });
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(edit.getByRole("alert").filter({ hasText: "could not save" })).toBeVisible();
    await expect(edit.getByRole("textbox", { name: "Condition", exact: true })).toHaveValue(
      "Aftercare",
    );
    await page.unroute("**/api/v1/patients/*");
    const request = page.waitForRequest(
      (request) => request.method() === "PATCH" && request.url().includes("/api/v1/patients/"),
    );
    await edit.getByRole("button", { name: "Save changes" }).click();
    expect((await request).postDataJSON()).toEqual({
      condition: "Aftercare",
      status: "follow_up",
      email: null,
    });
    await expect(edit).toBeHidden();
    await expect(page.getByRole("heading", { name: "No matching patients" })).toBeVisible();
    await expect(page.locator("#patient-directory-heading")).toBeFocused();
    await patient(page, clinician.id, `${prefix} AAA`);
    await page.goto(`/patients?search=${prefix}&limit=1&page=2&sort=name%3Aasc`);
    await expect(page.getByText("2–2 of 2 patients", { exact: true })).toBeVisible();
    await actions(page, name, "Delete patient");
    const confirm = page.getByRole("dialog", { name: `Delete ${name}?`, exact: true });
    await page.route("**/api/v1/patients/*", async (route) => {
      if (route.request().method() === "DELETE")
        await route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        });
      else await route.continue();
    });
    await confirm.getByRole("button", { name: "Delete permanently" }).click();
    await expect(confirm.getByRole("alert")).toContainText("Deletion failed");
    await page.unroute("**/api/v1/patients/*");
    await confirm.getByRole("button", { name: "Delete permanently" }).click();
    await expect(confirm).toBeHidden();
    await expect(page).toHaveURL((url) => !url.searchParams.has("page"));
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await expect(page.locator("#patient-directory-heading")).toBeFocused();
    await page.goto(`/doctors/${clinician.id}`);
    await expect(page.getByLabel("Assigned patient count")).toHaveText("1");
    await expect(
      page.getByText(`${prefix} AAA`, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
  });

  test("recovers list failures and missing records before and during editing", async ({ page }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const prefix = token();
    const clinician = await doctor(page, prefix);
    const first = await patient(page, clinician.id, `${prefix} Before`);
    const second = await patient(page, clinician.id, `${prefix} During`);
    await page.route("**/api/v1/patients?**", (route) =>
      route.fulfill({
        status: 503,
        json: { error: { code: "UNAVAILABLE", message: "Temporary failure" } },
      }),
    );
    await page.goto(`/patients?search=${prefix}`);
    await expect(page.getByRole("alert").filter({ hasText: "could not load" })).toBeVisible();
    await page.unroute("**/api/v1/patients?**");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByText("1–2 of 2 patients", { exact: true })).toBeVisible();
    expect(
      (
        await page.request.delete(`/api/v1/patients/${first.id}`, { headers: { Origin: origin } })
      ).status(),
    ).toBe(204);
    await actions(page, first.name, "Edit patient");
    let edit = page.getByRole("dialog", { name: "Edit patient", exact: true });
    await expect(edit.getByRole("alert")).toContainText("no longer available");
    await edit.getByRole("button", { name: "Close", exact: true }).click();
    await expect(edit).toBeHidden();
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    await actions(page, second.name, "Edit patient");
    edit = page.getByRole("dialog", { name: "Edit patient", exact: true });
    await expect(edit.getByRole("textbox", { name: "Patient name" })).toHaveValue(second.name);
    expect(
      (
        await page.request.delete(`/api/v1/patients/${second.id}`, { headers: { Origin: origin } })
      ).status(),
    ).toBe(204);
    await edit.getByRole("textbox", { name: "Condition", exact: true }).fill("Aftercare");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(edit.getByRole("alert")).toContainText("no longer available");
    await edit.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching patients" })).toBeVisible();
  });

  test("wraps long values at review widths and restores keyboard focus after cancel", async ({
    page,
  }) => {
    await signIn(page);
    const prefix = token();
    const clinician = await doctor(page, prefix);
    const record = await patient(page, clinician.id, `${prefix} ${"N".repeat(85)}`, {
      condition: "C".repeat(120),
      phone: "+" + "1".repeat(31),
    });
    await page.goto(`/patients?search=${prefix}`);
    await expect(page.getByText("1–1 of 1 patients", { exact: true })).toBeVisible();
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
        `overflow at ${width}`,
      ).toBe(false);
      if (width === 360 || width === 1440)
        await page.screenshot({
          path: test.info().outputPath(`patients-${width}.png`),
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 360, height: 900 });
    const trigger = page
      .getByRole("button", { name: `Actions for ${record.name}`, exact: true })
      .filter({ visible: true });
    await actions(page, record.name, "Edit patient");
    const edit = page.getByRole("dialog", { name: "Edit patient", exact: true });
    await expect(edit.getByRole("textbox", { name: "Patient name" })).toHaveValue(record.name);
    await expect(edit).toBeVisible();
    expect(await edit.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
    await edit.locator("summary").filter({ hasText: "Additional details" }).click();
    expect(await edit.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
    await page.screenshot({ path: test.info().outputPath("patient-edit-360.png"), fullPage: true });
    await edit.getByRole("button", { name: "Cancel", exact: true }).press("Enter");
    await expect(edit).toBeHidden();
    await expect(trigger).toBeFocused();
    await actions(page, record.name, "Delete patient");
    const confirm = page.getByRole("dialog", { name: `Delete ${record.name}?`, exact: true });
    await expect(confirm).toBeVisible();
    expect(await confirm.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      false,
    );
    await page.keyboard.press("Escape");
    await expect(confirm).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
