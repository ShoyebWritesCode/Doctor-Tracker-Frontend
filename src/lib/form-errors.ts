import type { z } from "zod";
import { ApiError } from "@/lib/api/client";

/** Dismissal must not insert errors and move the button before its click completes. */
export function isFormDismissal(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-form-dismiss]") !== null;
}

export function validationFields(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    result[field] ??= issue.message;
  }
  return result;
}
export function serverFields(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    Object.entries(error.fieldErrors ?? {}).flatMap(([field, messages]) =>
      messages[0] ? [[field, messages[0]]] : [],
    ),
  );
}
