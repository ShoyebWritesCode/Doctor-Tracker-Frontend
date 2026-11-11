import { describe, expect, it } from "vitest";
import { getPaginationItems } from "@/components/ui/pagination";

describe("getPaginationItems", () => {
  it("returns every page when the result set is short", () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the current page and both boundaries visible", () => {
    expect(getPaginationItems(9, 18)).toEqual([1, "ellipsis-start", 8, 9, 10, "ellipsis-end", 18]);
  });

  it("does not add a leading ellipsis near the beginning", () => {
    expect(getPaginationItems(2, 18)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 18]);
  });
});
