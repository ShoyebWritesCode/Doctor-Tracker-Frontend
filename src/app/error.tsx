"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto grid max-w-lg justify-items-center gap-4 px-4 py-16 text-center">
      <span className="rounded-control bg-danger-soft text-danger grid size-12 place-items-center">
        <CircleAlert aria-hidden="true" />
      </span>
      <section aria-labelledby="error-title" role="alert">
        <h1 id="error-title" className="text-ink text-xl font-semibold">
          Unable to load this page
        </h1>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Try the request again. If the problem continues, share the reference below with support.
        </p>
        {error.digest ? (
          <p className="text-ink-subtle mt-3 font-mono text-xs">Reference: {error.digest}</p>
        ) : null}
        <Button className="mt-6" onClick={reset} variant="outline">
          Try again
        </Button>
      </section>
    </main>
  );
}
