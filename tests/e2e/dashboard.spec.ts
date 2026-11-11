import { expect, test, type Page } from "@playwright/test";
import { dashboardSummarySchema } from "../../src/features/dashboard/api";
import { formatCalendarDate } from "../../src/features/dashboard/range";
import { e2eOrigin } from "./helpers/environment";

const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;
const summaryRoute = "**/api/v1/dashboard/summary?*";
const isSummary = (url: string) => new URL(url).pathname === "/api/v1/dashboard/summary";

test.describe("real backend dashboard analytics", () => {
  test.skip(!email || !password, "Requires the explicitly seeded disposable backend.");

  async function signIn(page: Page) {
    await page.goto("/login?next=%2Fdoctors");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Doctors", exact: true })).toBeVisible();
  }

  async function openSummary(page: Page, path = "/dashboard") {
    const response = page.waitForResponse((response) => isSummary(response.url()) && response.ok());
    await page.goto(path);
    return dashboardSummarySchema.parse((await (await response).json()).data);
  }

  test("reconciles real counts, supports keyboard inspection and fits review widths", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await signIn(page);
    const name = `Dashboard ${Date.now()} ${"Longname ".repeat(9)}`.trim();
    const created = await page.request.post("/api/v1/doctors", {
      headers: { Origin: e2eOrigin },
      data: {
        name,
        specialization: "Cardiology",
        hospital: "Fictional Practice",
        email: `dashboard-${Date.now()}@example.test`,
        phone: "+880 1700 000000",
      },
    });
    expect(created.status()).toBe(201);
    const doctor = (await created.json()).data as { id: string };
    for (let index = 0; index < 20; index++) {
      const patient = await page.request.post(`/api/v1/doctors/${doctor.id}/patients`, {
        headers: { Origin: e2eOrigin },
        data: {
          name: `Dashboard patient ${index}`,
          condition: "Routine review",
          status: "active",
          phone: "+880 1700 111111",
        },
      });
      expect(patient.status()).toBe(201);
    }
    const summary = await openSummary(page);
    for (const [label, value] of [
      ["Total doctors", summary.totals.doctors],
      ["Total patients", summary.totals.patients],
      ["Patients added", summary.totals.patientsCreatedInRange],
    ] as const) {
      const metric = page
        .locator('dl[aria-label="Dashboard metrics"] > div')
        .filter({ has: page.getByText(label, { exact: true }) });
      await expect(metric.locator("dd").first()).toHaveText(
        new Intl.NumberFormat("en-GB").format(value),
      );
    }
    const doctors = await page.request.get("/api/v1/doctors?limit=1");
    const patients = await page.request.get("/api/v1/patients?limit=1");
    expect((await doctors.json()).meta.total).toBe(summary.totals.doctors);
    expect((await patients.json()).meta.total).toBe(summary.totals.patients);
    const average = page
      .locator('dl[aria-label="Dashboard metrics"] > div')
      .filter({ has: page.getByText("Patients per doctor", { exact: true }) });
    await expect(average.locator("dd").first()).toHaveText(
      new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        summary.totals.averagePatientsPerDoctor,
      ),
    );
    const ranking = page.getByRole("list", { name: "Doctors ranked by patient count" });
    for (const [index, doctor] of summary.patientsByDoctor.entries()) {
      const row = ranking.getByRole("listitem").nth(index);
      await expect(row.getByRole("link")).toHaveText(doctor.doctorName);
      await expect(
        row.getByLabel(
          `${new Intl.NumberFormat("en-GB").format(doctor.count)} ${doctor.count === 1 ? "patient" : "patients"}`,
        ),
      ).toBeVisible();
    }
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    const slider = page.getByRole("slider", { name: "Inspect daily patient count" });
    await slider.focus();
    await slider.press("Home");
    await expect(slider).toHaveValue("0");
    await slider.press("ArrowRight");
    await expect(slider).toHaveValue("1");
    await page.getByText("View daily data", { exact: true }).click();
    await expect(
      page.getByRole("table", { name: "Daily patient creation data" }).getByRole("row"),
    ).toHaveCount(summary.patientsByDate.length + 1);
    for (const point of summary.patientsByDate) {
      const row = page
        .getByRole("table", { name: "Daily patient creation data" })
        .getByRole("row")
        .filter({
          has: page.getByRole("rowheader", { name: formatCalendarDate(point.date), exact: true }),
        });
      await expect(row.getByRole("cell")).toHaveText(
        new Intl.NumberFormat("en-GB").format(point.count),
      );
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
        `overflow at ${width}px`,
      ).toBe(false);
      if (width === 360 || width === 1440) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({
          path: test.info().outputPath(`dashboard-${width}.png`),
          fullPage: true,
        });
      }
    }
    await page.getByText("View daily data", { exact: true }).click();
    // Returning to the same cached range must re-fetch after a real UI mutation.
    await page.getByRole("link", { name, exact: true }).click();
    await page.getByRole("button", { name: "Add patient", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add a patient" });
    await dialog.getByLabel("Patient name").fill("Dashboard invalidation check");
    await dialog.getByLabel("Phone (optional)").fill("+880 1700 111111");
    await dialog.getByRole("textbox", { name: "Condition", exact: true }).fill("Review");
    await dialog.getByRole("button", { name: "Create patient" }).click();
    await expect(dialog).toBeHidden();
    if (test.info().project.name === "mobile-chromium")
      await page.setViewportSize({ width: 1440, height: 1000 });
    const refreshed = page.waitForResponse(
      (response) => isSummary(response.url()) && response.ok(),
    );
    await page
      .getByRole("link", { name: "Dashboard", exact: true })
      .filter({ visible: true })
      .click();
    const next = dashboardSummarySchema.parse((await (await refreshed).json()).data);
    expect(next.totals.patients).toBe(summary.totals.patients + 1);
  });

  test("persists ranges and time zones, rejects invalid URLs, and renders a zero single-day series", async ({
    page,
  }) => {
    await signIn(page);
    await openSummary(page);
    let requests = 0;
    page.on("request", (request) => {
      if (isSummary(request.url())) requests++;
    });
    await page.goto("/dashboard?from=1980-01-02&to=1980-01-01&timezone=Invalid%2FZone");
    await expect(page.getByRole("alert").filter({ hasText: "No dashboard request" })).toBeVisible();
    expect(requests).toBe(0);
    await expect(page.getByRole("button", { name: "Retry dashboard" })).toBeHidden();
    await page.getByLabel("Created from").fill("1980-01-01");
    await page.getByLabel("Created before (exclusive)").fill("1980-01-02");
    await page.getByLabel("Time zone", { exact: true }).fill("America/New_York");
    const response = page.waitForResponse((response) => isSummary(response.url()) && response.ok());
    await page.getByRole("button", { name: "Apply range" }).click();
    const summary = dashboardSummarySchema.parse((await (await response).json()).data);
    expect(summary.patientsByDate).toEqual([{ date: "1980-01-01", count: 0 }]);
    await expect(page.getByRole("slider", { name: "Inspect daily patient count" })).toBeDisabled();
    await expect(
      page.getByText("No patients were added in this period.", { exact: true }),
    ).toBeVisible();
    const selectedUrl = page.url();
    await page.reload();
    await expect(page.getByLabel("Time zone", { exact: true })).toHaveValue("America/New_York");
    await expect(page).toHaveURL(selectedUrl);
    await page.getByRole("button", { name: "Last 7 days" }).click();
    await expect(page).not.toHaveURL(selectedUrl);
    await page.goBack();
    await expect(page).toHaveURL(selectedUrl);
    await expect(page.getByLabel("Created from")).toHaveValue("1980-01-01");
  });

  test("holds chart space while loading and recovers initial and refresh failures", async ({
    page,
  }) => {
    await signIn(page);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(summaryRoute, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/dashboard");
    await expect(page.getByRole("status", { name: "Loading patients over time" })).toBeVisible();
    release();
    await expect(page.getByRole("slider", { name: "Inspect daily patient count" })).toBeVisible();
    await page.unroute(summaryRoute);
    const fail = async () => {
      await page.route(summaryRoute, (route) =>
        route.fulfill({
          status: 500,
          json: { error: { code: "INTERNAL_ERROR", message: "Temporary failure" } },
        }),
      );
    };
    await fail();
    await page.getByRole("button", { name: "Refresh data" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "last successful result" }),
    ).toBeVisible();
    await expect(page.getByRole("slider")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Retry patients over time" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry patients by doctor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply range" })).toBeEnabled();
    await page.unroute(summaryRoute);
    await page.getByRole("button", { name: "Retry patients over time" }).click();
    await expect(page.getByRole("slider")).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "could not load" })).toBeHidden();
  });
});
