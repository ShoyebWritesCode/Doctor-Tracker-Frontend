import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginationMeta } from "@/lib/api/client";

export function ListLoading({ label }: { label: string }) {
  return (
    <div className="grid gap-3" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      {[1, 2, 3, 4].map((row) => (
        <Skeleton className="h-16 w-full" key={row} />
      ))}
    </div>
  );
}
export function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-control border-danger/30 bg-danger-soft flex flex-wrap items-center justify-between gap-3 border p-4"
      role="alert"
    >
      <p className="text-danger text-sm">We could not load the records. Please try again.</p>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
export function ResultSummary({
  meta,
  busy,
  noun,
}: {
  meta: PaginationMeta;
  busy: boolean;
  noun: string;
}) {
  const start = meta.total === 0 ? 0 : Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  const end = Math.min(meta.page * meta.limit, meta.total);
  return (
    <p aria-live="polite" role="status" className="text-ink-muted text-sm">
      {busy ? "Updating results…" : `${start}–${end} of ${meta.total} ${noun}`}
    </p>
  );
}
export function RecordValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-muted text-xs">{label}</dt>
      <dd className="text-ink mt-1 text-sm break-words">{children}</dd>
    </div>
  );
}
