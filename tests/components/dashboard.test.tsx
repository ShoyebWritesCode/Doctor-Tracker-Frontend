import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PatientTrend } from "@/features/dashboard/patient-trend";
import { DoctorRanking } from "@/features/dashboard/doctor-ranking";
import { MetricSummary } from "@/features/dashboard/metric-summary";
import { RangeControls } from "@/features/dashboard/range-controls";
import { TooltipProvider } from "@/components/ui/tooltip";
import { dashboardFixture } from "../fixtures/dashboard";

describe("dashboard presentation", () => {
  it("renders exact API metrics, including large values and a fixed two-place average", () => {
    render(
      <TooltipProvider>
        <MetricSummary
          totals={{
            ...dashboardFixture.totals,
            patients: 1_250_000,
            averagePatientsPerDoctor: 2.5,
          }}
          loading={false}
        />
      </TooltipProvider>,
    );
    expect(screen.getByText("1,250,000")).toBeVisible();
    expect(screen.getByText("2.50")).toBeVisible();
    expect(screen.getByRole("button", { name: "About patients per doctor" })).toBeVisible();
  });
  it("allows keyboard inspection and exposes every daily count in a table", async () => {
    const user = userEvent.setup();
    render(<PatientTrend points={dashboardFixture.patientsByDate} timezone="Asia/Dhaka" />);
    const slider = screen.getByRole("slider", { name: "Inspect daily patient count" });
    slider.focus();
    // Native range keyboard behavior is verified in Playwright; the DOM exposes the full value here.
    expect(slider).toHaveAttribute("aria-valuetext", "3 Jan 2026: 1 patient");
    await user.click(screen.getByText("View daily data"));
    const table = screen.getByRole("table", { name: "Daily patient creation data" });
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(
      screen.getByText("3 patients were added across 2 dates with new records."),
    ).toBeVisible();
  });
  it("renders one zero-count day truthfully without an interactive range or fake positive load", () => {
    render(<PatientTrend points={[{ date: "2026-01-01", count: 0 }]} timezone="UTC" />);
    expect(screen.getByText("No patients were added in this period.")).toBeVisible();
    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.getByRole("img", { name: "Daily patient creation chart" })).toBeVisible();
  });
  it("handles no doctors, zero loads and tied ranking values without calculating false percentages", () => {
    const { rerender } = render(<DoctorRanking doctors={[]} totalDoctors={0} />);
    expect(screen.getByRole("link", { name: "Go to doctors" })).toHaveAttribute("href", "/doctors");
    rerender(
      <DoctorRanking
        doctors={dashboardFixture.patientsByDoctor.map((doctor) => ({ ...doctor, count: 0 }))}
        totalDoctors={3}
      />,
    );
    expect(screen.getAllByText((_, element) => element?.textContent === "0 patients")).toHaveLength(
      3,
    );
    expect(screen.getByText("No patients are assigned to these doctors yet.")).toBeVisible();
    rerender(
      <DoctorRanking
        doctors={dashboardFixture.patientsByDoctor.map((doctor) => ({ ...doctor, count: 5 }))}
        totalDoctors={3}
      />,
    );
    expect(screen.getAllByText((_, element) => element?.textContent === "5 patients")).toHaveLength(
      3,
    );
  });
  it("keeps invalid range edits local, focuses the problem and never applies them", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<RangeControls range={dashboardFixture.range} onApply={onApply} />);
    await user.clear(screen.getByLabelText("Time zone"));
    await user.type(screen.getByLabelText("Time zone"), "Invalid/Zone");
    await user.click(screen.getByRole("button", { name: "Apply range" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Time zone")).toHaveFocus();
    expect(screen.getByLabelText("Time zone")).toHaveValue("Invalid/Zone");
  });
  it("shows one doctor and a single positive day without misleading proportions", () => {
    const doctor = dashboardFixture.patientsByDoctor[0]!;
    render(<DoctorRanking doctors={[doctor]} totalDoctors={1} />);
    expect(screen.getByText("1 of 1 doctor shown. Counts are all-time.")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    render(<PatientTrend points={[{ date: "2026-01-01", count: 1 }]} timezone="UTC" />);
    expect(screen.getByText("1 patient was added across 1 date with new records.")).toBeVisible();
    expect(screen.getByRole("slider")).toBeDisabled();
  });
});
