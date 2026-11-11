import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addCalendarDays,
  calendarDates,
  calendarDayCount,
  dashboardRangeSchema,
  rangeQuery,
  readDashboardRange,
  recentRange,
} from "@/features/dashboard/range";
import { chartPoint, chartScale, nearestPoint } from "@/features/dashboard/chart-math";
import { dashboardSummarySchema, getDashboardSummary } from "@/features/dashboard/api";
import { dashboardFixture } from "../fixtures/dashboard";

afterEach(() => vi.unstubAllGlobals());
describe("dashboard calendar state", () => {
  it("uses thirty local calendar days including today and preserves explicit URL dates", () => {
    const now = new Date("2026-01-31T23:00:00Z");
    const range = recentRange(30, "Asia/Dhaka", now);
    expect(range).toEqual({ from: "2026-01-03", to: "2026-02-02", timezone: "Asia/Dhaka" });
    expect(calendarDayCount(range.from, range.to)).toBe(30);
    expect(
      readDashboardRange(new URLSearchParams(rangeQuery(range)), new Date("2027-01-01")),
    ).toEqual(range);
  });
  it("counts labels across leap day and DST without local browser offset arithmetic", () => {
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(
      calendarDates({ from: "2026-03-08", to: "2026-03-10", timezone: "America/New_York" }),
    ).toEqual(["2026-03-08", "2026-03-09"]);
    expect(calendarDates({ from: "2024-01-01", to: "2025-01-01", timezone: "UTC" })).toHaveLength(
      366,
    );
  });
  it.each([
    { from: "2026-02-30" },
    { to: "2026-01-01" },
    { to: "2027-01-04" },
    { timezone: "+06:00" },
    { timezone: "Not/AZone" },
  ])("rejects invalid ranges %j", (patch) => {
    expect(dashboardRangeSchema.safeParse({ ...dashboardFixture.range, ...patch }).success).toBe(
      false,
    );
  });
  it("retains invalid URL input for correction instead of silently fetching a different period", () => {
    expect(
      readDashboardRange(
        new URLSearchParams("from=bad&timezone=Not/AZone"),
        new Date("2026-01-01"),
      ),
    ).toMatchObject({ from: "bad", timezone: "Not/AZone" });
  });
});
describe("chart geometry", () => {
  it("uses an integer zero baseline and finite geometry for zero and single-point data", () => {
    expect(chartScale([0, 0]).ticks).toEqual([4, 3, 2, 1, 0]);
    expect(chartPoint(0, 0, 1, 4)).toEqual({ x: 360, y: 232 });
    expect(chartPoint(0, 4, 1, 4).y).toBe(8);
    expect(chartScale([1_250_001]).maximum).toBeGreaterThanOrEqual(1_250_001);
  });
  it("clamps pointer selection to actual points", () => {
    expect(nearestPoint(-1, 30)).toBe(0);
    expect(nearestPoint(2, 30)).toBe(29);
    expect(nearestPoint(0.5, 1)).toBe(0);
  });
});
describe("dashboard API boundary", () => {
  it("accepts a reconciled API result but rejects missing or inconsistent daily values", () => {
    expect(dashboardSummarySchema.safeParse(dashboardFixture).success).toBe(true);
    expect(
      dashboardSummarySchema.safeParse({
        ...dashboardFixture,
        patientsByDate: dashboardFixture.patientsByDate.slice(1),
      }).success,
    ).toBe(false);
    expect(
      dashboardSummarySchema.safeParse({
        ...dashboardFixture,
        totals: { ...dashboardFixture.totals, patientsCreatedInRange: 100 },
      }).success,
    ).toBe(false);
    expect(
      dashboardSummarySchema.safeParse({
        ...dashboardFixture,
        patientsByDoctor: [{ ...dashboardFixture.patientsByDoctor[0], count: -1 }],
      }).success,
    ).toBe(false);
  });
  it("verifies the response belongs to the requested range and sends cancellation through", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: dashboardFixture })));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(getDashboardSummary(dashboardFixture.range, signal)).resolves.toEqual(
      dashboardFixture,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/summary?from=2026-01-01"),
      expect.objectContaining({ signal, credentials: "include", cache: "no-store" }),
    );
    fetch.mockResolvedValue(new Response(JSON.stringify({ data: dashboardFixture })));
    await expect(
      getDashboardSummary({ ...dashboardFixture.range, to: "2026-01-05" }),
    ).rejects.toMatchObject({ code: "UNEXPECTED_RESPONSE" });
  });
});
