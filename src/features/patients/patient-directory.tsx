"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { DebouncedField, ListControls } from "@/components/layout/list-controls";
import { ListLoading, ListError, ResultSummary } from "@/components/layout/list-feedback";
import {
  MobileRecordList,
  MobileRecord,
  MobileRecordField,
} from "@/components/layout/mobile-record-list";
import {
  TableShell,
  tableCellClassName as cell,
  tableHeaderClassName as head,
} from "@/components/layout/table-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DoctorFilter } from "@/features/patients/doctor-filter";
import { PatientEditDialog } from "@/features/patients/patient-edit-dialog";
import { PatientDeleteDialog } from "@/features/patients/patient-mutations";
import {
  listPatients,
  patientKeys,
  patientStatuses,
  readGlobalPatientState,
  type Patient,
} from "@/features/patients/api";
import { formatDate } from "@/lib/list-state";
import { useListUrl } from "@/lib/use-list-url";

type Selection = { action: "edit" | "delete"; patient: Patient; trigger: HTMLButtonElement | null };
type ChooseAction = (selection: Selection) => void;
function PatientActions({ patient, onSelect }: { patient: Patient; onSelect: ChooseAction }) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          size="icon"
          variant="ghost"
          aria-label={`Actions for ${patient.name}`}
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => onSelect({ action: "edit", patient, trigger: trigger.current })}
        >
          Edit patient
        </DropdownMenuItem>
        <DropdownMenuItem
          destructive
          onSelect={() => onSelect({ action: "delete", patient, trigger: trigger.current })}
        >
          Delete patient
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function Status({ patient }: { patient: Patient }) {
  return (
    <Badge
      tone={
        patient.status === "active"
          ? "success"
          : patient.status === "follow_up"
            ? "warning"
            : "neutral"
      }
    >
      {patientStatuses.find((option) => option.value === patient.status)?.label}
    </Badge>
  );
}
function DoctorLink({ patient }: { patient: Patient }) {
  return (
    <Link
      href={`/doctors/${patient.doctor.id}`}
      className="text-action [overflow-wrap:anywhere] hover:underline"
    >
      {patient.doctor.name}
    </Link>
  );
}
function Contact({ patient }: { patient: Patient }) {
  return (
    <>
      <span className="block break-all">{patient.email ?? "No email"}</span>
      <span className="text-ink-muted mt-1 block text-xs [overflow-wrap:anywhere]">
        {patient.phone ?? "No phone"}
      </span>
    </>
  );
}
function PatientRecords({ patients, onSelect }: { patients: Patient[]; onSelect: ChooseAction }) {
  return (
    <>
      <div className="hidden xl:block">
        <TableShell label="Patients">
          <thead>
            <tr>
              {[
                "Patient",
                "Doctor",
                "Condition",
                "Status",
                "Contact",
                "Last visit (UTC)",
                "Added (UTC)",
                "",
              ].map((label) => (
                <th scope="col" className={head} key={label}>
                  {label || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-surface-subtle/60">
                <td className={cell}>
                  <span className="block max-w-40 font-semibold [overflow-wrap:anywhere]">
                    {patient.name}
                  </span>
                </td>
                <td className={cell}>
                  <span className="block max-w-36">
                    <DoctorLink patient={patient} />
                  </span>
                </td>
                <td className={cell}>
                  <span className="block max-w-32 [overflow-wrap:anywhere]">
                    {patient.condition}
                  </span>
                </td>
                <td className={cell}>
                  <Status patient={patient} />
                </td>
                <td className={cell}>
                  <span className="block max-w-40">
                    <Contact patient={patient} />
                  </span>
                </td>
                <td className={cell}>
                  <span className="text-ink-muted text-xs">{formatDate(patient.lastVisitAt)}</span>
                </td>
                <td className={cell}>
                  <span className="text-ink-muted text-xs">{formatDate(patient.createdAt)}</span>
                </td>
                <td className={cell}>
                  <PatientActions patient={patient} onSelect={onSelect} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
      <MobileRecordList label="Patients" className="xl:hidden">
        {patients.map((patient) => (
          <MobileRecord
            key={patient.id}
            title={patient.name}
            actions={<PatientActions patient={patient} onSelect={onSelect} />}
          >
            <MobileRecordField label="Doctor">
              <DoctorLink patient={patient} />
            </MobileRecordField>
            <MobileRecordField label="Condition">{patient.condition}</MobileRecordField>
            <MobileRecordField label="Status">
              <Status patient={patient} />
            </MobileRecordField>
            <MobileRecordField label="Contact">
              <Contact patient={patient} />
            </MobileRecordField>
            <MobileRecordField label="Last visit">
              {formatDate(patient.lastVisitAt)}
            </MobileRecordField>
            <MobileRecordField label="Added (UTC)">
              {formatDate(patient.createdAt)}
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

export function PatientDirectory() {
  const { state, query, update, clear } = useListUrl(readGlobalPatientState);
  const [selection, setSelection] = useState<Selection | null>(null);
  const heading = useRef<HTMLDivElement>(null);
  const result = useQuery({
    queryKey: patientKeys.list(query),
    queryFn: ({ signal }) => listPatients(query, signal),
    placeholderData: keepPreviousData,
  });
  const correcting = Boolean(
    result.data &&
    !result.isPlaceholderData &&
    state.page > Math.max(1, result.data.meta.totalPages),
  );
  useEffect(() => {
    if (correcting && result.data && !result.isFetching)
      update({ page: Math.max(1, result.data.meta.totalPages) }, true);
  }, [correcting, result.data, result.isFetching, update]);
  const active = [
    state.doctorId ? "Assigned doctor selected" : "",
    state.condition ? `Condition: ${state.condition}` : "",
    state.status
      ? `Status: ${patientStatuses.find((option) => option.value === state.status)?.label}`
      : "",
  ].filter(Boolean);
  const filtered = Boolean(active.length || state.search || state.createdFrom || state.createdTo);
  function restoreFocus() {
    if (selection?.trigger?.isConnected) selection.trigger.focus();
    else heading.current?.focus();
  }
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <div ref={heading} tabIndex={-1} id="patient-directory-heading">
        <PageHeader
          eyebrow="Records"
          title="Patients"
          description="Review and maintain patient records across the doctor directory."
        />
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
            <DoctorFilter value={state.doctorId} onChange={(doctorId) => update({ doctorId })} />
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
      {result.isPending || correcting ? (
        <ListLoading label="Loading patients" />
      ) : result.isError ? (
        <ListError onRetry={() => void result.refetch()} />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4" aria-busy={result.isFetching}>
          <ResultSummary meta={result.data.meta} busy={result.isFetching} noun="patients" />
          {result.data.data.length ? (
            <PatientRecords patients={result.data.data} onSelect={setSelection} />
          ) : (
            <EmptyState
              icon={Users}
              title={filtered ? "No matching patients" : "No patients yet"}
              description={
                filtered
                  ? "Adjust the search or clear your filters to see more records."
                  : "Create a patient from their assigned doctor's profile to add the first record."
              }
              action={
                filtered ? (
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/doctors"
                    className="text-action text-sm font-semibold hover:underline"
                  >
                    Go to doctors
                  </Link>
                )
              }
            />
          )}
          <Pagination
            page={state.page}
            totalPages={result.data.meta.totalPages}
            busy={result.isPlaceholderData}
            onPageChange={(page) => update({ page })}
          />
        </div>
      )}
      {selection?.action === "edit" ? (
        <PatientEditDialog
          patientId={selection.patient.id}
          onClose={() => setSelection(null)}
          restoreFocus={restoreFocus}
        />
      ) : null}
      {selection?.action === "delete" ? (
        <PatientDeleteDialog
          patient={selection.patient}
          open
          onOpenChange={(open) => {
            if (!open) setSelection(null);
          }}
          onDeleted={() => heading.current?.focus()}
          restoreFocus={restoreFocus}
        />
      ) : null}
    </div>
  );
}
