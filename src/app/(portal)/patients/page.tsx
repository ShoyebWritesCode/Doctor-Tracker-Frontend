import { PageHeader } from "@/components/layout/page-header";
export const metadata = { title: "Patients" };
export default function PatientsPage() {
  return (
    <PageHeader
      description="Review and maintain patient records across the clinician directory."
      eyebrow="Records"
      title="Patients"
    />
  );
}
