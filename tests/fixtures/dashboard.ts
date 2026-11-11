import type { DashboardSummary } from "@/features/dashboard/api";

export const dashboardFixture: DashboardSummary = {
  range: { from: "2026-01-01", to: "2026-01-04", timezone: "Asia/Dhaka" },
  totals: { doctors: 3, patients: 9, patientsCreatedInRange: 3, averagePatientsPerDoctor: 3 },
  patientsByDate: [
    { date: "2026-01-01", count: 0 },
    { date: "2026-01-02", count: 2 },
    { date: "2026-01-03", count: 1 },
  ],
  patientsByDoctor: [
    { doctorId: "000000000000000000000001", doctorName: "Dr. Fictional A", count: 5 },
    { doctorId: "000000000000000000000002", doctorName: "Dr. Fictional B", count: 4 },
    { doctorId: "000000000000000000000003", doctorName: "Dr. Fictional C", count: 0 },
  ],
};
