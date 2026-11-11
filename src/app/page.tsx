export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="page-title" className="border-l-4 border-teal-700 pl-6">
        <p className="mb-2 text-sm font-semibold tracking-wide text-teal-800 uppercase">
          Foundation ready
        </p>
        <h1 id="page-title" className="text-3xl font-semibold tracking-tight text-slate-950">
          Doctor Tracker
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
          The application foundation is running. Authentication and the administrative workspace are
          introduced in the next implementation phases.
        </p>
      </section>
    </main>
  );
}
