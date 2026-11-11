"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageError } from "@/components/feedback/page-error";
import { PageHeader } from "@/components/layout/page-header";
import { DebouncedField, ListControls } from "@/components/layout/list-controls";
import {
  ListError,
  ListLoading,
  RecordValue,
  ResultSummary,
} from "@/components/layout/list-feedback";
import {
  TableShell,
  tableCellClassName as cell,
  tableHeaderClassName as head,
} from "@/components/layout/table-shell";
import {
  MobileRecordList,
  MobileRecord,
  MobileRecordField,
} from "@/components/layout/mobile-record-list";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { doctorKeys, getDoctor } from "@/features/doctors/api";
import {
  patientKeys,
  listDoctorPatients,
  readPatientState,
  patientStatuses,
  type Patient,
} from "@/features/patients/api";
import { AddPatient, DeletePatient } from "@/features/patients/patient-mutations";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/list-state";
import { useListUrl } from "@/lib/use-list-url";

function Status({ value }: { value: Patient["status"] }) {
  return (
    <Badge tone={value === "active" ? "success" : value === "follow_up" ? "warning" : "neutral"}>
      {patientStatuses.find((option) => option.value === value)?.label}
    </Badge>
  );
}
function PatientRecords({
  patients,
  doctorId,
  onDeleted,
}: {
  patients: Patient[];
  doctorId: string;
  onDeleted: () => void;
}) {
  return (
    <>
      <div className="hidden xl:block">
        <TableShell label="Doctor patients">
          <thead>
            <tr>
              {["Patient", "Condition", "Contact", "Status", "Last visit (UTC)", ""].map(
                (label) => (
                  <th scope="col" className={head} key={label}>
                    {label || <span className="sr-only">Actions</span>}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-surface-subtle/60">
                <td className={cell}>
                  <span className="block max-w-56 font-semibold break-words">{patient.name}</span>
                </td>
                <td className={cell}>
                  <span className="block max-w-48 break-words">{patient.condition}</span>
                </td>
                <td className={cell}>
                  <span className="block max-w-56 break-all">{patient.email ?? "No email"}</span>
                  <span className="text-ink-muted mt-1 block text-xs">
                    {patient.phone ?? "No phone"}
                  </span>
                </td>
                <td className={cell}>
                  <Status value={patient.status} />
                </td>
                <td className={cell}>
                  <span className="text-ink-muted text-xs whitespace-nowrap">
                    {formatDate(patient.lastVisitAt)}
                  </span>
                </td>
                <td className={cell}>
                  <DeletePatient patient={patient} doctorId={doctorId} onDeleted={onDeleted} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
      <MobileRecordList label="Doctor patients" className="xl:hidden">
        {patients.map((patient) => (
          <MobileRecord
            headingLevel={3}
            title={patient.name}
            key={patient.id}
            actions={<Status value={patient.status} />}
          >
            <MobileRecordField label="Condition">{patient.condition}</MobileRecordField>
            <MobileRecordField label="Contact">
              <span className="break-all">{patient.email ?? "No email"}</span>
              <span className="mt-1 block">{patient.phone ?? "No phone"}</span>
            </MobileRecordField>
            <MobileRecordField label="Last visit">
              {formatDate(patient.lastVisitAt)}
            </MobileRecordField>
            <MobileRecordField label="Actions">
              <DeletePatient patient={patient} doctorId={doctorId} onDeleted={onDeleted} />
            </MobileRecordField>
          </MobileRecord>
        ))}
      </MobileRecordList>
    </>
  );
}

const sorts = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "lastVisitAt:desc", label: "Last visit: newest" },
  { value: "lastVisitAt:asc", label: "Last visit: oldest" },
];

export function DoctorDetail({ doctorId }: { doctorId: string }) {
  const patientsHeading = useRef<HTMLHeadingElement>(null);
  const { state, query, update, clear } = useListUrl(readPatientState);
  const doctor = useQuery({
    queryKey: doctorKeys.detail(doctorId),
    queryFn: ({ signal }) => getDoctor(doctorId, signal),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  });
  const patients = useQuery({
    queryKey: patientKeys.scoped(doctorId, query),
    queryFn: ({ signal }) => listDoctorPatients(doctorId, query, signal),
    enabled: doctor.isSuccess,
    placeholderData: keepPreviousData,
  });
  useEffect(() => {
    if (
      patients.data &&
      !patients.isPlaceholderData &&
      !patients.isFetching &&
      state.page > Math.max(1, patients.data.meta.totalPages)
    )
      update({ page: Math.max(1, patients.data.meta.totalPages) }, true);
  }, [patients.data, patients.isPlaceholderData, patients.isFetching, state.page, update]);
  if (doctor.isPending) return <ListLoading label="Loading doctor" />;
  if (doctor.isError)
    return (
      <div className="grid gap-4">
        <Link href="/doctors" className="text-action text-sm hover:underline">
          Back to doctors
        </Link>
        <PageError
          title={
            doctor.error instanceof ApiError && doctor.error.status === 404
              ? "Doctor not found"
              : "Unable to load doctor"
          }
          description="The record may be unavailable. Return to the directory or try again."
          onRetry={() => void doctor.refetch()}
        />
      </div>
    );
  const record = doctor.data;
  const active = [
    state.condition ? `Condition: ${state.condition}` : "",
    state.status
      ? `Status: ${patientStatuses.find((option) => option.value === state.status)?.label}`
      : "",
  ].filter(Boolean);
  const filtered = Boolean(active.length || state.search || state.createdFrom || state.createdTo);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/doctors" className="text-action underline underline-offset-4">
          Doctors
        </Link>
        <span aria-hidden="true" className="text-ink-subtle mx-2">
          /
        </span>
        <span className="text-ink-muted">Doctor profile</span>
      </nav>
      <PageHeader
        eyebrow={record.specialization}
        title={record.name}
        description={record.hospital}
        actions={<AddPatient doctorId={doctorId} doctorName={record.name} />}
      />
      <dl className="border-border grid gap-4 border-b pb-6 sm:grid-cols-2 xl:grid-cols-4">
        <RecordValue label="Email">
          <a className="text-action break-all hover:underline" href={`mailto:${record.email}`}>
            {record.email}
          </a>
        </RecordValue>
        <RecordValue label="Phone">
          <a className="text-action hover:underline" href={`tel:${record.phone}`}>
            {record.phone}
          </a>
        </RecordValue>
        <RecordValue label="Assigned patients">
          <output aria-label="Assigned patient count" className="font-semibold">
            {record.patientCount}
          </output>
        </RecordValue>
        <RecordValue label="Added (UTC)">{formatDate(record.createdAt)}</RecordValue>
      </dl>
      <section aria-labelledby="patients-heading" className="grid min-w-0 grid-cols-1 gap-4">
        <div>
          <h2
            id="patients-heading"
            ref={patientsHeading}
            tabIndex={-1}
            className="text-ink text-lg font-semibold"
          >
            Patients
          </h2>
          <p className="text-ink-muted mt-1 text-sm">Records assigned to this doctor.</p>
        </div>
        <ListControls
          state={state}
          onChange={update}
          clear={clear}
          activeFilters={active}
          sorts={sorts}
          searchPlaceholder="Patient name, email, or phone"
          filters={
            <>
              <DebouncedField
                label="Condition"
                value={state.condition}
                maxLength={120}
                placeholder="Exact condition"
                onChange={(condition) => update({ condition })}
              />
              <SelectField
                label="Patient status"
                value={state.status || "all"}
                options={[{ value: "all", label: "All statuses" }, ...patientStatuses]}
                onValueChange={(status) => update({ status: status === "all" ? "" : status })}
              />
            </>
          }
        />
        {patients.isPending ? (
          <ListLoading label="Loading patients" />
        ) : patients.isError ? (
          <ListError onRetry={() => void patients.refetch()} />
        ) : (
          <div className="grid gap-4" aria-busy={patients.isFetching}>
            <ResultSummary meta={patients.data.meta} busy={patients.isFetching} noun="patients" />
            {patients.data.data.length ? (
              <PatientRecords
                patients={patients.data.data}
                doctorId={doctorId}
                onDeleted={() => patientsHeading.current?.focus()}
              />
            ) : (
              <EmptyState
                icon={Users}
                title={filtered ? "No matching patients" : "No patients assigned"}
                description={
                  filtered
                    ? "Adjust the search or clear your filters to see more records."
                    : "Use Add patient to create this doctor's first patient record."
                }
                action={
                  filtered ? (
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            )}
            <Pagination
              page={state.page}
              totalPages={patients.data.meta.totalPages}
              busy={patients.isPlaceholderData}
              onPageChange={(page) => update({ page })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
