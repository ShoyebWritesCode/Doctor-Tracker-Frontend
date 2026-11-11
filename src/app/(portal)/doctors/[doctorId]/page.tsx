import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DoctorDetail } from "@/features/doctors/doctor-detail";
import { ListLoading } from "@/components/layout/list-feedback";

export const metadata = { title: "Doctor profile" };
export default async function DoctorPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  if (!/^[a-f0-9]{24}$/.test(doctorId)) notFound();
  return (
    <Suspense fallback={<ListLoading label="Loading doctor" />}>
      <DoctorDetail doctorId={doctorId} />
    </Suspense>
  );
}
