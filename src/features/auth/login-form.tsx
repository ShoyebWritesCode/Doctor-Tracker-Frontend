"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authKeys, login } from "@/features/auth/api";
import { safeNextPath } from "@/features/auth/safe-redirect";
import { ApiError } from "@/lib/api/client";
import { useHydrated } from "@/lib/use-hydrated";

const credentialsSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Password must be 128 characters or fewer."),
});

export function LoginForm() {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const mutation = useMutation({
    mutationFn: (input: { email: string; password: string }) => login(input),
    onSuccess: (admin) => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.current, admin);
      router.replace(safeNextPath(searchParams.get("next")));
      router.refresh();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      setFieldErrors({
        ...(errors.email?.[0] ? { email: errors.email[0] } : {}),
        ...(errors.password?.[0] ? { password: errors.password[0] } : {}),
      });
      event.currentTarget
        .querySelector<HTMLInputElement>(errors.email ? '[name="email"]' : '[name="password"]')
        ?.focus();
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  const message =
    mutation.error instanceof ApiError && mutation.error.code === "INVALID_CREDENTIALS"
      ? "The email or password is incorrect."
      : mutation.error
        ? "We could not sign you in. Try again."
        : undefined;

  return (
    <form className="grid gap-5" method="post" noValidate onSubmit={submit}>
      {message ? (
        <div
          className="rounded-control border-danger/30 bg-danger-soft text-danger border p-3 text-sm"
          role="alert"
        >
          {message}
        </div>
      ) : null}
      <TextField
        autoComplete="username"
        {...(fieldErrors.email ? { error: fieldErrors.email } : {})}
        label="Email address"
        name="email"
        placeholder="admin@example.com"
        required
        type="email"
      />
      <div className="grid gap-2">
        <label className="text-ink text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            aria-invalid={fieldErrors.password ? true : undefined}
            autoComplete="current-password"
            className="rounded-control border-border bg-surface-raised text-ink hover:border-border-strong min-h-11 w-full border py-2 pr-12 pl-3 text-base shadow-sm md:text-sm"
            id="password"
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="rounded-control text-ink-muted hover:text-ink absolute inset-y-0 right-0 grid w-11 place-items-center"
            onClick={() => setShowPassword((shown) => !shown)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-danger text-xs" id="password-error" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <Button className="w-full" disabled={!hydrated} loading={mutation.isPending} type="submit">
        <LockKeyhole aria-hidden="true" className="size-4" />
        Sign in
      </Button>
      {!hydrated ? (
        <p className="text-ink-muted text-sm">Enable JavaScript to sign in securely.</p>
      ) : null}
    </form>
  );
}
