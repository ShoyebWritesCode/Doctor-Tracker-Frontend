import { describe, expect, it } from "vitest";
import { readDoctorState } from "@/features/doctors/api";
import { readPatientState } from "@/features/patients/api";
import { serializeListState, formatDate } from "@/lib/list-state";

describe("directory URL contract", () => {
  it("omits defaults and round-trips meaningful filters", () => {
    const defaults = readDoctorState(new URLSearchParams());
    expect(serializeListState(defaults)).toBe("");
    const state = readDoctorState(
      new URLSearchParams("page=2&limit=10&search=Samira&hospital=Central&sort=name:asc"),
    );
    expect(readDoctorState(new URLSearchParams(serializeListState(state)))).toEqual(state);
  });
  it("normalizes unsafe pagination, unsupported sorts, impossible dates, and unknown filters", () => {
    const state = readDoctorState(
      new URLSearchParams(
        "page=1e2&limit=101&sort=password:asc&createdFrom=2026-02-30T00:00:00Z&operator=bad",
      ),
    );
    expect(state).toMatchObject({ page: 1, limit: 20, sort: "createdAt:desc", createdFrom: "" });
    expect(serializeListState(state)).toBe("");
    expect(readPatientState(new URLSearchParams("status=invalid"))).toMatchObject({ status: "" });
  });
  it("renders dates in UTC independently of the browser timezone", () => {
    expect(formatDate("2026-01-01T23:30:00.000Z")).toBe("1 Jan 2026");
    expect(formatDate(null)).toBe("Not recorded");
  });
});
