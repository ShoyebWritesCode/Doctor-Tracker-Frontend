import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold text-teal-800">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">Page not found</h1>
      <p className="mt-3 text-slate-600">The requested Doctor Tracker page does not exist.</p>
      <Link className="mt-6 inline-block font-semibold text-teal-800 underline" href="/">
        Return home
      </Link>
    </main>
  );
}
