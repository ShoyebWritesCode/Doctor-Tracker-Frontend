import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";

describe("public environment", () => {
  it("uses the versioned API path by default", () => {
    expect(parsePublicEnv({})).toEqual({ NEXT_PUBLIC_API_BASE_PATH: "/api/v1" });
  });

  it("accepts and freezes a relative API path", () => {
    const environment = parsePublicEnv({ NEXT_PUBLIC_API_BASE_PATH: "/api/v1" });

    expect(environment.NEXT_PUBLIC_API_BASE_PATH).toBe("/api/v1");
    expect(Object.isFrozen(environment)).toBe(true);
  });

  it("rejects absolute and protocol-relative API values", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_API_BASE_PATH: "https://api.example.com/api/v1" }),
    ).toThrow();
    expect(() => parsePublicEnv({ NEXT_PUBLIC_API_BASE_PATH: "//api.example.com" })).toThrow();
  });
});
