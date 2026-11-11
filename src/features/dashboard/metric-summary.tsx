import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/features/dashboard/api";

export const formatCount = (value: number) => new Intl.NumberFormat("en-GB").format(value);
const metrics = [
  {
    key: "doctors",
    label: "Total doctors",
    context: "All-time directory",
    help: "Every current doctor, regardless of the selected creation period.",
  },
  {
    key: "patients",
    label: "Total patients",
    context: "All-time records",
    help: "Every current patient record across all doctors.",
  },
  {
    key: "patientsCreatedInRange",
    label: "Patients added",
    context: "Selected period",
    help: "Current patient records created from the start date up to, but not including, the end date, in the selected time zone.",
  },
  {
    key: "averagePatientsPerDoctor",
    label: "Patients per doctor",
    context: "All-time mean",
    help: "The API's all-time patient-to-doctor average, rounded to two decimal places. Zero when there are no doctors.",
  },
] as const;
export function MetricSummary({
  totals,
  loading,
}: {
  totals?: DashboardSummary["totals"];
  loading: boolean;
}) {
  return (
    <dl
      aria-label="Dashboard metrics"
      className="border-border bg-surface-raised divide-border rounded-panel grid min-w-0 grid-cols-2 divide-x divide-y overflow-hidden border lg:grid-cols-4 lg:divide-y-0"
    >
      {metrics.map((metric) => (
        <div key={metric.key} className="grid min-h-36 min-w-0 content-start gap-3 p-4 sm:p-5">
          <dt className="flex items-start justify-between gap-2 text-sm font-semibold">
            <span>{metric.label}</span>
            <Tooltip content={metric.help}>
              <button
                type="button"
                aria-label={`About ${metric.label.toLowerCase()}`}
                className="text-ink-muted -mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-md"
              >
                <Info aria-hidden="true" className="size-4" />
              </button>
            </Tooltip>
          </dt>
          <dd className="text-ink -mt-2 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
            {loading ? (
              <Skeleton className="h-9 w-24 max-w-full" />
            ) : totals ? (
              metric.key === "averagePatientsPerDoctor" ? (
                new Intl.NumberFormat("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totals[metric.key])
              ) : (
                formatCount(totals[metric.key])
              )
            ) : (
              <span className="text-ink-muted text-base font-normal">Unavailable</span>
            )}
          </dd>
          <dd className="text-ink-muted text-xs">{metric.context}</dd>
        </div>
      ))}
    </dl>
  );
}
