"use client";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section aria-labelledby="error-title" role="alert">
        <p className="text-sm font-semibold text-red-700">Unable to load this page</p>
        <h1 id="error-title" className="mt-2 text-2xl font-semibold text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Try the request again. If the problem continues, share the reference below with support.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-slate-500">Reference: {error.digest}</p>
        ) : null}
        <button
          className="mt-6 min-h-11 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
