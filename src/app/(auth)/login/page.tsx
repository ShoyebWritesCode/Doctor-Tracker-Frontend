import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="rounded-panel border-border bg-surface-raised shadow-panel w-full max-w-md border p-6 sm:p-8"
      >
        <div className="border-border mb-7 border-b pb-5">
          <p className="text-action text-xs font-semibold tracking-wide uppercase">
            Doctor Tracker
          </p>
          <h1 className="text-ink mt-2 text-2xl font-semibold tracking-tight" id="login-title">
            Administrator sign in
          </h1>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Use your administrator credentials to access the operations workspace.
          </p>
        </div>
        <Suspense fallback={<div className="h-72" aria-label="Loading sign-in form" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
