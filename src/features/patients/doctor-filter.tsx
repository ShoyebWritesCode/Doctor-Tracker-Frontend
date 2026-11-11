"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { DebouncedField } from "@/components/layout/list-controls";
import { ListLoading, ListError, ResultSummary } from "@/components/layout/list-feedback";
import { doctorKeys, getDoctor, listDoctors } from "@/features/doctors/api";
import { ApiError } from "@/lib/api/client";

export function DoctorFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({
    limit: "10",
    page: String(page),
    sort: "name:asc",
    ...(search ? { search } : {}),
  }).toString();
  const selected = useQuery({
    queryKey: doctorKeys.detail(value),
    queryFn: ({ signal }) => getDoctor(value, signal),
    enabled: Boolean(value),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  });
  const result = useQuery({
    queryKey: doctorKeys.list(query),
    queryFn: ({ signal }) => listDoctors(query, signal),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-ink text-sm font-semibold" id="doctor-filter-label">
        Doctor
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            aria-labelledby="doctor-filter-label doctor-filter-value"
            className="min-w-0 justify-start text-left"
          >
            <span id="doctor-filter-value" className="truncate">
              {value
                ? (selected.data?.name ??
                  (selected.isError ? "Unavailable doctor" : "Loading doctor…"))
                : "All doctors"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter by doctor</DialogTitle>
            <DialogDescription>
              Search the full doctor directory, then choose an assigned clinician.
            </DialogDescription>
          </DialogHeader>
          <DebouncedField
            label="Find a doctor"
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            placeholder="Name, email, or hospital"
          />
          <Button
            variant="outline"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            All doctors
          </Button>
          {result.isPending ? (
            <ListLoading label="Loading doctors" />
          ) : result.isError ? (
            <ListError onRetry={() => void result.refetch()} />
          ) : (
            <div className="grid gap-3" aria-busy={result.isFetching}>
              <ResultSummary meta={result.data.meta} busy={result.isFetching} noun="doctors" />
              {result.data.data.length ? (
                <ul className="divide-border divide-y">
                  {result.data.data.map((doctor) => (
                    <li key={doctor.id}>
                      <Button
                        variant="ghost"
                        className="h-auto w-full min-w-0 flex-col items-start py-3 text-left"
                        aria-label={`Select ${doctor.name}`}
                        disabled={result.isPlaceholderData}
                        onClick={() => {
                          onChange(doctor.id);
                          setOpen(false);
                        }}
                      >
                        <span className="max-w-full [overflow-wrap:anywhere]">{doctor.name}</span>
                        <span className="text-ink-muted max-w-full text-xs font-normal [overflow-wrap:anywhere]">
                          {doctor.specialization} · {doctor.hospital}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted text-sm">No matching doctors. Try another search.</p>
              )}
              <Pagination
                page={page}
                totalPages={result.data.meta.totalPages}
                busy={result.isPlaceholderData}
                onPageChange={setPage}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
