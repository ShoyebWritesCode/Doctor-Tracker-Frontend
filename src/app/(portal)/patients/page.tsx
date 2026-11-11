import { Suspense } from "react";
import { ListLoading } from "@/components/layout/list-feedback";
import { PatientDirectory } from "@/features/patients/patient-directory";
export const metadata = { title: "Patients" };
export default function PatientsPage() {
  return (
    <Suspense fallback={<ListLoading label="Loading patients" />}>
      <PatientDirectory />
    </Suspense>
  );
}
