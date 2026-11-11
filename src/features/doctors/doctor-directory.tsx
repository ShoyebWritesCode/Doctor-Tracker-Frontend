"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { DebouncedField, ListControls } from "@/components/layout/list-controls";
import { ListError, ListLoading, ResultSummary } from "@/components/layout/list-feedback";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { DoctorForm } from "@/features/doctors/doctor-form";
import { doctorKeys, listDoctors, readDoctorState, type Doctor } from "@/features/doctors/api";
import { formatDate } from "@/lib/list-state";
import { useListUrl } from "@/lib/use-list-url";

const sorts = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];
function DoctorRecords({ records }: { records: Doctor[] }) {
  return (
    <>
      <div className="hidden xl:block">
        <TableShell label="Doctors">
          <thead>
            <tr>
              {["Doctor", "Hospital", "Contact", "Patients", "Added (UTC)", ""].map((label) => (
                <th className={head} key={label} scope="col">
                  {label || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-surface-subtle/60">
                <td className={cell}>
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="text-action block max-w-64 font-semibold break-words hover:underline"
                  >
                    {doctor.name}
                  </Link>
                  <span className="text-ink-muted mt-1 block text-xs">{doctor.specialization}</span>
                </td>
                <td className={cell}>
                  <span className="block max-w-48 break-words">{doctor.hospital}</span>
                </td>
                <td className={cell}>
                  <a
                    className="text-action block max-w-56 break-all hover:underline"
                    href={`mailto:${doctor.email}`}
                  >
                    {doctor.email}
                  </a>
                  <a
                    className="text-ink-muted mt-1 block text-xs hover:underline"
                    href={`tel:${doctor.phone}`}
                  >
                    {doctor.phone}
                  </a>
                </td>
                <td className={cell}>{doctor.patientCount}</td>
                <td className={cell}>
                  <time
                    dateTime={doctor.createdAt}
                    className="text-ink-muted text-xs whitespace-nowrap"
                  >
                    {formatDate(doctor.createdAt)}
                  </time>
                </td>
                <td className={cell}>
                  <Link
                    className={buttonVariants({ variant: "ghost" })}
                    href={`/doctors/${doctor.id}`}
                    aria-label={`Open ${doctor.name}`}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
      <MobileRecordList className="xl:hidden" label="Doctors">
        {records.map((doctor) => (
          <MobileRecord
            key={doctor.id}
            title={doctor.name}
            actions={
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href={`/doctors/${doctor.id}`}
                aria-label={`Open ${doctor.name}`}
              >
                Open
              </Link>
            }
          >
            <MobileRecordField label="Specialization">{doctor.specialization}</MobileRecordField>
            <MobileRecordField label="Hospital">{doctor.hospital}</MobileRecordField>
            <MobileRecordField label="Contact">
              <a className="text-action break-all hover:underline" href={`mailto:${doctor.email}`}>
                {doctor.email}
              </a>
              <a className="text-ink-muted mt-1 block" href={`tel:${doctor.phone}`}>
                {doctor.phone}
              </a>
            </MobileRecordField>
            <MobileRecordField label="Patients">{doctor.patientCount}</MobileRecordField>
            <MobileRecordField label="Added (UTC)">
              {formatDate(doctor.createdAt)}
            </MobileRecordField>
          </MobileRecord>
        ))}
      </MobileRecordList>
    </>
  );
}

export function DoctorDirectory() {
  const { state, query, update, clear } = useListUrl(readDoctorState);
  const result = useQuery({
    queryKey: doctorKeys.list(query),
    queryFn: ({ signal }) => listDoctors(query, signal),
    placeholderData: keepPreviousData,
  });
  useEffect(() => {
    if (
      result.data &&
      !result.isPlaceholderData &&
      !result.isFetching &&
      state.page > Math.max(1, result.data.meta.totalPages)
    )
      update({ page: Math.max(1, result.data.meta.totalPages) }, true);
  }, [result.data, result.isFetching, result.isPlaceholderData, state.page, update]);
  const active = [
    state.specialization ? `Specialization: ${state.specialization}` : "",
    state.hospital ? `Hospital: ${state.hospital}` : "",
  ].filter(Boolean);
  const filtered = Boolean(active.length || state.search || state.createdFrom || state.createdTo);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <PageHeader
        eyebrow="Directory"
        title="Doctors"
        description="Clinician records and the patients in their care."
        actions={<DoctorForm />}
      />
      <ListControls
        state={state}
        onChange={update}
        clear={clear}
        activeFilters={active}
        sorts={sorts}
        searchPlaceholder="Name, email, or hospital"
        filters={
          <>
            <DebouncedField
              label="Specialization"
              value={state.specialization}
              onChange={(specialization) => update({ specialization })}
              placeholder="Exact specialization"
            />
            <DebouncedField
              label="Hospital"
              value={state.hospital}
              maxLength={160}
              onChange={(hospital) => update({ hospital })}
              placeholder="Exact hospital name"
            />
          </>
        }
      />
      {result.isPending ? (
        <ListLoading label="Loading doctors" />
      ) : result.isError ? (
        <ListError onRetry={() => void result.refetch()} />
      ) : (
        <div className="grid gap-4" aria-busy={result.isFetching}>
          <ResultSummary meta={result.data.meta} busy={result.isFetching} noun="doctors" />
          {result.data.data.length ? (
            <DoctorRecords records={result.data.data} />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title={filtered ? "No matching doctors" : "No doctors yet"}
              description={
                filtered
                  ? "Try a different search or clear the current filters."
                  : "Add the first clinician to start building your directory."
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
            totalPages={result.data.meta.totalPages}
            busy={result.isPlaceholderData}
            onPageChange={(page) => update({ page })}
          />
        </div>
      )}
    </div>
  );
}
