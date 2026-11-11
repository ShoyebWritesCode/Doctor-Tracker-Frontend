import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Doctor Tracker"
      className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:px-6"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="mt-4 h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <span className="sr-only" aria-live="polite">
        Loading Doctor Tracker…
      </span>
    </main>
  );
}
