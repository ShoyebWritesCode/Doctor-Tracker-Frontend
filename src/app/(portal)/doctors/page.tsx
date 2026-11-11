import { Suspense } from "react";
import { DoctorDirectory } from "@/features/doctors/doctor-directory";
import { ListLoading } from "@/components/layout/list-feedback";
export const metadata = { title: "Doctors" };
export default function DoctorsPage() {
  return (
    <Suspense fallback={<ListLoading label="Loading directory" />}>
      <DoctorDirectory />
    </Suspense>
  );
}
