import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-action text-sm font-semibold">404</p>
      <h1 className="text-ink mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="text-ink-muted mt-3 text-sm leading-6">
        The requested Doctor Tracker page does not exist.
      </p>
      <Link className={buttonVariants({ className: "mt-6", variant: "outline" })} href="/">
        Return home
      </Link>
    </main>
  );
}
