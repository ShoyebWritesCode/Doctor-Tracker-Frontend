"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardKeys, getDashboardSummary } from "@/features/dashboard/api";
import {
  dashboardRangeSchema,
  formatCalendarDate,
  rangeQuery,
  readDashboardRange,
  type DashboardRange,
} from "@/features/dashboard/range";
import { RangeControls } from "@/features/dashboard/range-controls";
import { MetricSummary } from "@/features/dashboard/metric-summary";
import { PatientTrend } from "@/features/dashboard/patient-trend";
import { DoctorRanking } from "@/features/dashboard/doctor-ranking";

function ChartPanel({
  title,
  description,
  loading,
  unavailable,
  retry,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  unavailable: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="border-border bg-surface-raised rounded-panel grid min-h-[32rem] min-w-0 grid-cols-1 content-start gap-4 border p-4 sm:p-5"
    >
      <header>
        <h2 className="text-ink text-base font-semibold">{title}</h2>
        <p className="text-ink-muted mt-1 text-xs leading-5">{description}</p>
      </header>
      {loading ? (
        <div role="status" aria-label={`Loading ${title.toLowerCase()}`} className="grid gap-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : unavailable ? (
        <div className="grid min-h-80 content-center justify-items-start gap-3">
          <p className="text-ink-muted text-sm">
            This chart is unavailable. You can retry without leaving the workspace.
          </p>
          <Button variant="outline" onClick={retry}>
            Retry {title.toLowerCase()}
          </Button>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function DashboardView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [now] = useState(() => new Date());
  const raw = params.toString();
  const draft = useMemo(() => readDashboardRange(new URLSearchParams(raw), now), [raw, now]);
  const parsed = dashboardRangeSchema.safeParse(draft);
  const range = parsed.success ? parsed.data : null;
  const canonical = range ? rangeQuery(range) : "";
  useEffect(() => {
    if (canonical && raw !== canonical)
      router.replace(`${pathname}?${canonical}`, { scroll: false });
  }, [canonical, raw, pathname, router]);
  const result = useQuery({
    queryKey: dashboardKeys.summary(range ?? draft),
    queryFn: ({ signal }) => {
      if (!range) throw new Error("Apply a valid dashboard range first.");
      return getDashboardSummary(range, signal);
    },
    enabled: Boolean(range),
  });
  const data = result.data;
  const loading = Boolean(range && result.isPending);
  const retry = () => {
    void result.refetch();
  };
  function apply(next: DashboardRange) {
    const query = rangeQuery(next);
    if (query !== raw) router.push(`${pathname}?${query}`, { scroll: false });
  }
  const period = range
    ? `${formatCalendarDate(range.from)} to before ${formatCalendarDate(range.to)} · ${range.timezone}`
    : "Apply a valid creation period to load analytics.";
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A concise view of doctors, patients, and current patient records."
        actions={
          <Button variant="outline" disabled={!range || result.isFetching} onClick={retry}>
            Refresh data
          </Button>
        }
      />
      <RangeControls key={raw} range={draft} onApply={apply} />
      {!range ? (
        <p role="alert" className="text-danger text-sm">
          Correct the date range or time zone above. No dashboard request has been made for these
          invalid values.
        </p>
      ) : null}
      {result.isError ? (
        <div
          role="alert"
          className="border-danger/30 bg-danger-soft rounded-control flex flex-wrap items-center justify-between gap-3 border p-4"
        >
          <p className="text-danger text-sm">
            {data
              ? "We could not refresh the dashboard. The last successful result for this range is still shown."
              : "We could not load the dashboard. Your navigation and range controls remain available."}
          </p>
          <Button variant="outline" onClick={retry}>
            Retry dashboard
          </Button>
        </div>
      ) : null}
      <div aria-live="polite" role="status" className="text-ink-muted text-xs">
        {loading
          ? "Loading dashboard analytics…"
          : result.isFetching
            ? "Refreshing dashboard analytics…"
            : data
              ? `Creation period: ${period}`
              : period}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-6" aria-busy={result.isFetching}>
        <MetricSummary {...(data ? { totals: data.totals } : {})} loading={loading} />
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <ChartPanel
            title="Patients over time"
            description="Current patient records by their local creation date."
            loading={loading}
            unavailable={!data && Boolean(range)}
            retry={retry}
          >
            {data ? (
              <PatientTrend
                key={canonical}
                points={data.patientsByDate}
                timezone={data.range.timezone}
              />
            ) : !range ? (
              <p className="text-ink-muted text-sm">Apply a valid range above.</p>
            ) : null}
          </ChartPanel>
          <ChartPanel
            title="Patients by doctor"
            description="All-time patient load · up to ten doctors."
            loading={loading}
            unavailable={!data && Boolean(range)}
            retry={retry}
          >
            {data ? (
              <DoctorRanking doctors={data.patientsByDoctor} totalDoctors={data.totals.doctors} />
            ) : !range ? (
              <p className="text-ink-muted text-sm">Apply a valid range above.</p>
            ) : null}
          </ChartPanel>
        </div>
      </div>
      <footer className="text-ink-muted border-border flex flex-wrap justify-between gap-3 border-t pt-4 text-xs leading-5">
        <p>
          Live reads of current records. Deleted patients are not included; no previous-period
          comparison is implied.
        </p>
        {data ? (
          <p>
            Updated{" "}
            {new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            }).format(new Date(result.dataUpdatedAt))}{" "}
            UTC
          </p>
        ) : null}
      </footer>
    </div>
  );
}
