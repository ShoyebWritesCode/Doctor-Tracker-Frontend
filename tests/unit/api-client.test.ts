import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, apiList } from "@/lib/api/client";
import { sessionExpiredEvent } from "@/features/auth/session-events";

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("preserves server pagination metadata and rejects malformed list envelopes", async () => {
    const page = {
      data: [{ id: "doctor-1" }],
      meta: { page: 2, limit: 20, total: 21, totalPages: 2 },
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(page)))
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }))),
    );
    await expect(apiList("/doctors?page=2")).resolves.toEqual(page);
    await expect(apiList("/doctors")).rejects.toMatchObject({ code: "UNEXPECTED_RESPONSE" });
  });
  it("sends JSON with credentials, request headers, and the abort signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "admin-1" } }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await expect(
      apiRequest<{ id: string }>("/auth/login", {
        body: { email: "admin@example.test" },
        method: "POST",
        signal: controller.signal,
      }),
    ).resolves.toEqual({ id: "admin-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({ credentials: "include", signal: controller.signal }),
    );
  });

  it("maps structured validation failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              fieldErrors: { email: ["Invalid email"] },
              message: "Invalid fields",
              requestId: "request-42",
            },
          }),
          { headers: { "Content-Type": "application/json" }, status: 400 },
        ),
      ),
    );
    const error = await apiRequest("/auth/login").catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: { email: ["Invalid email"] },
      requestId: "request-42",
      status: 400,
    });
  });

  it("normalizes authentication and malformed server responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("not-json", { headers: { "X-Request-Id": "bad-json" }, status: 500 }),
        )
        .mockResolvedValueOnce(new Response("not-json", { status: 401 })),
    );
    await expect(apiRequest("/broken")).rejects.toMatchObject({
      code: "UNEXPECTED_RESPONSE",
      requestId: "bad-json",
      status: 500,
    });
    await expect(apiRequest("/auth/me")).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
      status: 401,
    });
  });

  it("hides internal server details and preserves aborts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "INTERNAL_ERROR", message: "secret database failure" },
          }),
          { status: 500 },
        ),
      ),
    );
    await expect(apiRequest("/broken")).rejects.toMatchObject({
      message: "We could not complete the request. Try again.",
    });
    const abortError = new DOMException("Aborted", "AbortError");
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(apiRequest("/auth/me", { signal: controller.signal })).rejects.toBe(abortError);
    await expect(apiRequest("/auth/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });

  it("notifies protected consumers on 401 without treating an invalid login as session expiry", async () => {
    const expired = vi.fn();
    window.addEventListener(sessionExpiredEvent, expired);
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => Promise.resolve(new Response("{}", { status: 401 }))),
      );
      await expect(apiRequest("/auth/login")).rejects.toBeInstanceOf(ApiError);
      expect(expired).not.toHaveBeenCalled();
      await expect(apiRequest("/patients")).rejects.toBeInstanceOf(ApiError);
      expect(expired).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(sessionExpiredEvent, expired);
    }
  });
});
