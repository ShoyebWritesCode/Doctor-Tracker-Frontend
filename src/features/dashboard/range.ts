import { z } from "zod";

export const DEFAULT_TIME_ZONE = "Asia/Dhaka";
export const MAX_RANGE_DAYS = 366;
const DAY_MS = 86_400_000;
function validZone(value: string) {
  if (!/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
export function addCalendarDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function calendarDayCount(from: string, to: string): number {
  // UTC is only a calendar-label counter here; the API converts local boundaries to instants.
  return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / DAY_MS;
}
export const dashboardRangeSchema = z
  .object({
    from: z.iso.date("Enter a valid start date."),
    to: z.iso.date("Enter a valid exclusive end date."),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(validZone, "Enter an IANA time zone, such as Asia/Dhaka.")
      .transform(
        (value) => new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone,
      ),
  })
  .superRefine(({ from, to }, context) => {
    const days = calendarDayCount(from, to);
    if (Number.isFinite(days) && (days < 1 || days > MAX_RANGE_DAYS))
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Choose an end date after the start, at most 366 calendar days later.",
      });
  });
export type DashboardRange = z.infer<typeof dashboardRangeSchema>;

export function recentRange(
  days: number,
  timezone = DEFAULT_TIME_ZONE,
  now = new Date(),
): DashboardRange {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  return { from: addCalendarDays(today, 1 - days), to: addCalendarDays(today, 1), timezone };
}
export function readDashboardRange(params: URLSearchParams, now: Date): DashboardRange {
  const zone = params.get("timezone") ?? DEFAULT_TIME_ZONE;
  const defaults = recentRange(30, validZone(zone) ? zone : DEFAULT_TIME_ZONE, now);
  return {
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
    timezone: zone,
  };
}
export function rangeQuery(range: DashboardRange): string {
  return new URLSearchParams(range).toString();
}
export function calendarDates(range: DashboardRange): string[] {
  const count = calendarDayCount(range.from, range.to);
  if (!Number.isInteger(count) || count < 1 || count > MAX_RANGE_DAYS) return [];
  return Array.from({ length: count }, (_, index) => addCalendarDays(range.from, index));
}
export function formatCalendarDate(value: string, short = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(short ? {} : { year: "numeric" }),
  }).format(new Date(`${value}T00:00:00Z`));
}
