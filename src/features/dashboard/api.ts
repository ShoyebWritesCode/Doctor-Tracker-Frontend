import { z } from "zod";
import { apiRequest, ApiError } from "@/lib/api/client";
import {
  calendarDates,
  dashboardRangeSchema,
  rangeQuery,
  type DashboardRange,
} from "@/features/dashboard/range";

const count = z.number().int().nonnegative();
export const dashboardSummarySchema = z
  .object({
    range: dashboardRangeSchema,
    totals: z.object({
      doctors: count,
      patients: count,
      patientsCreatedInRange: count,
      averagePatientsPerDoctor: z.number().finite().nonnegative(),
    }),
    patientsByDate: z
      .array(z.object({ date: z.iso.date(), count }))
      .min(1)
      .max(366),
    patientsByDoctor: z
      .array(
        z.object({
          doctorId: z.string().regex(/^[a-f0-9]{24}$/),
          doctorName: z.string().min(1).max(120),
          count,
        }),
      )
      .max(10),
  })
  .superRefine((summary, context) => {
    if (!dashboardRangeSchema.safeParse(summary.range).success) return;
    const dates = calendarDates(summary.range);
    if (
      dates.length !== summary.patientsByDate.length ||
      dates.some((date, index) => summary.patientsByDate[index]?.date !== date)
    )
      context.addIssue({
        code: "custom",
        path: ["patientsByDate"],
        message: "The server returned an incomplete date series.",
      });
    if (
      summary.patientsByDate.reduce((sum, point) => sum + point.count, 0) !==
      summary.totals.patientsCreatedInRange
    )
      context.addIssue({
        code: "custom",
        path: ["totals"],
        message: "The server returned inconsistent range counts.",
      });
  });
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (range: DashboardRange) => ["dashboard", "summary", range] as const,
};
export async function getDashboardSummary(
  range: DashboardRange,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  const result = dashboardSummarySchema.safeParse(
    await apiRequest<unknown>(`/dashboard/summary?${rangeQuery(range)}`, signal ? { signal } : {}),
  );
  if (!result.success || rangeQuery(result.data.range) !== rangeQuery(range))
    throw new ApiError({
      status: 200,
      code: "UNEXPECTED_RESPONSE",
      message: "The dashboard response could not be verified. Try again.",
    });
  return result.data;
}
