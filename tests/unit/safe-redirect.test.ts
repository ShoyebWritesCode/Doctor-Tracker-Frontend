import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/features/auth/safe-redirect";

describe("safeNextPath", () => {
  it("preserves internal destinations", () => {
    expect(safeNextPath("/doctors?page=2#results")).toBe("/doctors?page=2#results");
  });
  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example/path",
    "javascript:alert(1)",
    "/login",
    "/api/v1/auth/logout",
    "/\\evil.example/doctors",
  ])("rejects unsafe destination %s", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });
});
