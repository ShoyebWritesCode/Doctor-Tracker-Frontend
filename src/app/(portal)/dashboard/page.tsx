import { PageHeader } from "@/components/layout/page-header";
export const metadata = { title: "Dashboard" };
export default function DashboardPage() {
  return (
    <PageHeader
      description="A concise view of doctors, patients, and recent operational activity."
      eyebrow="Workspace"
      title="Dashboard"
    />
  );
}
