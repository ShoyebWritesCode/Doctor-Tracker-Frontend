import { PageHeader } from "@/components/layout/page-header";
export const metadata = { title: "Doctors" };
export default function DoctorsPage() {
  return (
    <PageHeader
      description="Create clinicians and manage their patient records."
      eyebrow="Directory"
      title="Doctors"
    />
  );
}
