import { z } from "zod";

export type ListState = {
  page: number;
  limit: number;
  search: string;
  sort: string;
  createdFrom: string;
  createdTo: string;
};

const positiveInteger = (value: string | null, fallback: number, maximum: number) =>
  value &&
  /^[1-9]\d*$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) <= maximum
    ? Number(value)
    : fallback;
const timestamp = (value: string | null) =>
  z.iso.datetime({ offset: true }).safeParse(value).success ? new Date(value!).toISOString() : "";

export function readListState(params: URLSearchParams, sorts: readonly string[]): ListState {
  const limit = positiveInteger(params.get("limit"), 20, 100);
  const page = positiveInteger(params.get("page"), 1, Math.floor(Number.MAX_SAFE_INTEGER / limit));
  const createdFrom = timestamp(params.get("createdFrom"));
  const createdTo = timestamp(params.get("createdTo"));
  return {
    page,
    limit,
    search: (params.get("search") ?? "").trim().slice(0, 100),
    sort: sorts.includes(params.get("sort") ?? "") ? params.get("sort")! : "createdAt:desc",
    createdFrom,
    createdTo:
      createdFrom && createdTo && Date.parse(createdFrom) >= Date.parse(createdTo) ? "" : createdTo,
  };
}

export function serializeListState(state: ListState & Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (
      !value ||
      (key === "page" && value === 1) ||
      (key === "limit" && value === 20) ||
      (key === "sort" && value === "createdAt:desc")
    )
      continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Not recorded";
}
