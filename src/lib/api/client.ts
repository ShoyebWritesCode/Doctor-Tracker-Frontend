import { publicEnv } from "@/lib/env";
import { notifySessionExpired } from "@/features/auth/session-events";
import { z } from "zod";

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class ApiError extends Error {
  readonly code: string;
  readonly fieldErrors: FieldErrors | undefined;
  readonly requestId: string | undefined;
  readonly status: number;

  constructor(options: {
    code: string;
    fieldErrors?: FieldErrors;
    message: string;
    requestId?: string;
    status: number;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const errorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

function fallbackError(status: number, requestId?: string) {
  return new ApiError({
    code: status === 401 ? "AUTHENTICATION_REQUIRED" : "UNEXPECTED_RESPONSE",
    message:
      status === 401
        ? "Authentication is required."
        : "The server returned an unexpected response.",
    ...(requestId ? { requestId } : {}),
    status,
  });
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("X-Request-Id")) headers.set("X-Request-Id", crypto.randomUUID());
  if (body !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${publicEnv.NEXT_PUBLIC_API_BASE_PATH}${path}`, {
      ...requestOptions,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: "include",
      cache: "no-store",
      headers,
    });
  } catch (error) {
    if (requestOptions.signal?.aborted) throw error;
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your connection and try again.",
      status: 0,
    });
  }
  const requestId = response.headers.get("X-Request-Id") ?? undefined;
  if (response.status === 401 && path !== "/auth/login") notifySessionExpired();
  if (response.ok && response.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw fallbackError(response.status, requestId);
  }
  if (!response.ok) {
    const parsed = errorEnvelope.safeParse(payload);
    if (parsed.success) {
      const error = parsed.data.error;
      const errorRequestId = error.requestId ?? requestId;
      throw new ApiError({
        code: error.code,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        message:
          response.status >= 500 ? "We could not complete the request. Try again." : error.message,
        ...(errorRequestId ? { requestId: errorRequestId } : {}),
        status: response.status,
      });
    }
    throw fallbackError(response.status, requestId);
  }
  if (typeof payload !== "object" || payload === null || !("data" in payload))
    throw fallbackError(response.status, requestId);
  return payload.data as T;
}
