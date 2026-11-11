import Link from "next/link";
import type { DashboardSummary } from "@/features/dashboard/api";
import { formatCount } from "@/features/dashboard/metric-summary";

export function DoctorRanking({
  doctors,
  totalDoctors,
}: {
  doctors: DashboardSummary["patientsByDoctor"];
  totalDoctors: number;
}) {
  const maximum = Math.max(0, ...doctors.map((doctor) => doctor.count));
  if (!doctors.length)
    return (
      <div className="grid min-h-80 content-center justify-items-start gap-3">
        <p className="font-semibold">No doctors to rank yet</p>
        <p className="text-ink-muted text-sm leading-6">
          Add a doctor to start building the directory.
        </p>
        <Link
          href="/doctors"
          className="text-action min-h-11 py-3 text-sm font-semibold hover:underline"
        >
          Go to doctors
        </Link>
      </div>
    );
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      <p className="text-ink-muted text-sm leading-6">
        {doctors.length} of {formatCount(totalDoctors)} {totalDoctors === 1 ? "doctor" : "doctors"}{" "}
        shown. Counts are all-time.
      </p>
      {maximum === 0 ? (
        <p className="text-ink-muted text-sm">No patients are assigned to these doctors yet.</p>
      ) : null}
      <ol
        aria-label="Doctors ranked by patient count"
        className="grid max-h-80 min-w-0 grid-cols-1 gap-5 overflow-y-auto pr-2"
      >
        {doctors.map((doctor, index) => (
          <li
            className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 gap-y-2"
            key={doctor.doctorId}
          >
            <span aria-hidden="true" className="text-ink-subtle pt-1 text-xs">
              {index + 1}
            </span>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <Link
                href={`/doctors/${doctor.doctorId}`}
                className="text-action min-w-0 text-sm leading-6 font-semibold [overflow-wrap:anywhere] hover:underline"
              >
                {doctor.doctorName}
              </Link>
              <span className="pt-1 text-sm font-semibold">
                {formatCount(doctor.count)}
                <span className="sr-only"> {doctor.count === 1 ? "patient" : "patients"}</span>
              </span>
            </div>
            <div
              aria-hidden="true"
              className="bg-surface-subtle col-start-2 h-2 overflow-hidden rounded-sm"
            >
              <div
                className="bg-action h-full rounded-sm"
                style={{ width: `${maximum ? (doctor.count / maximum) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
      <p className="text-ink-muted border-border border-t pt-3 text-xs leading-5">
        Ties follow the API&apos;s name/ID order. Bars share a zero baseline; width shows relative
        patient load, not a percentage of all patients.
      </p>
    </div>
  );
}
