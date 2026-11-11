import { Suspense } from "react";
import { ListLoading } from "@/components/layout/list-feedback";
import { DashboardView } from "@/features/dashboard/dashboard-view";
export const metadata = { title: "Dashboard" };
export default function DashboardPage() {
  return (
    <Suspense fallback={<ListLoading label="Loading dashboard" />}>
      <DashboardView />
    </Suspense>
  );
}
