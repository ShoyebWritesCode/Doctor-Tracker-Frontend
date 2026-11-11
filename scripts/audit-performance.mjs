import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

// Keep one-off profiling dependencies outside the application dependency tree.
// Run only against the managed disposable fixture documented in docs/quality-audit.md.
const origin = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3002");
assert.equal(origin.protocol, "http:");
assert.equal(origin.hostname, "localhost");
assert.equal(origin.pathname, "/");
assert(!origin.username && !origin.password && !origin.search && !origin.hash);
assert(
  process.env.LIGHTHOUSE_MODULE_PATH,
  "Set LIGHTHOUSE_MODULE_PATH to an isolated Lighthouse ESM entry.",
);
const { default: lighthouse } = await import(
  pathToFileURL(resolve(process.env.LIGHTHOUSE_MODULE_PATH)).href
);
const directory = await mkdtemp(join(tmpdir(), "doctor-tracker-performance-"));
const output = resolve("test-results/performance");
await mkdir(output, { recursive: true });
const context = await chromium.launchPersistentContext(directory, {
  headless: true,
  args: ["--remote-debugging-port=9224", "--remote-debugging-address=127.0.0.1"],
});
try {
  const page = await context.newPage();
  await page.goto(new URL("/login?next=%2Fdoctors", origin).href);
  await page.getByLabel("Email address").fill("browser-test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fictional-browser-verification-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Doctors", exact: true }).waitFor();
  const headers = { Origin: origin.origin };
  // Enough fictional records to exercise real table, status and chart rendering.
  for (let index = 0; index < 12; index++) {
    const response = await page.request.post(new URL("/api/v1/doctors", origin).href, {
      headers,
      data: {
        name: `Performance Doctor ${index}`,
        specialization: index % 2 ? "Cardiology" : "Neurology",
        hospital: "Fictional Performance Practice",
        email: `performance-${Date.now()}-${index}@example.test`,
        phone: "+880 1700 000000",
      },
    });
    assert.equal(response.status(), 201);
    const doctor = (await response.json()).data;
    for (let patient = 0; patient < 5; patient++) {
      const created = await page.request.post(
        new URL(`/api/v1/doctors/${doctor.id}/patients`, origin).href,
        {
          headers,
          data: {
            name: `Performance Patient ${index}-${patient}`,
            condition: "Routine review",
            status: ["active", "follow_up", "discharged"][patient % 3],
            phone: "+880 1700 111111",
          },
        },
      );
      assert.equal(created.status(), 201);
    }
  }
  const summaries = [];
  for (const path of ["/login", "/dashboard", "/doctors", "/patients"]) {
    const result = await lighthouse(new URL(path, origin).href, {
      port: 9224,
      hostname: "127.0.0.1",
      disableStorageReset: true,
      onlyCategories: ["performance", "accessibility", "best-practices"],
      output: "json",
      logLevel: "error",
    });
    assert(result && !result.lhr.runtimeError, result?.lhr.runtimeError?.message);
    assert.equal(
      new URL(result.lhr.finalDisplayedUrl).pathname,
      path,
      "Audit must not measure a login redirect instead of the portal.",
    );
    await writeFile(join(output, `${path.slice(1)}.json`), result.report);
    summaries.push({
      path,
      version: result.lhr.lighthouseVersion,
      userAgent: result.lhr.environment.hostUserAgent,
      settings: result.lhr.configSettings,
      scores: Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [key, value.score]),
      ),
      metrics: Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ].map((key) => [key, result.lhr.audits[key]?.numericValue]),
      ),
      warnings: result.lhr.runWarnings,
    });
  }
  await writeFile(join(output, "summary.json"), JSON.stringify(summaries, null, 2));
  process.stdout.write(`${JSON.stringify(summaries, null, 2)}\n`);
} finally {
  await context.close();
  // This is the temporary browser profile created above, never a user profile.
  await rm(directory, { recursive: true, force: true });
}
