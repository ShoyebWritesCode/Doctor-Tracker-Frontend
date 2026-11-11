"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import type { ListState } from "@/lib/list-state";

export function DebouncedField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 100,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    // Browser Back/Forward changes the external URL source of this draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value);
    return () => clearTimeout(timer.current);
  }, [value]);
  return (
    <TextField
      label={label}
      {...(placeholder ? { placeholder } : {})}
      maxLength={maxLength}
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onChange(next.trim()), 350);
      }}
    />
  );
}

type ListControlsProps = {
  state: ListState;
  onChange: (patch: Partial<ListState>, replace?: boolean) => void;
  clear: () => void;
  filters: ReactNode;
  activeFilters: string[];
  sorts: readonly { value: string; label: string }[];
  searchPlaceholder: string;
};

export function ListControls({
  state,
  onChange,
  clear,
  filters,
  activeFilters,
  sorts,
  searchPlaceholder,
}: ListControlsProps) {
  const datesActive = Boolean(state.createdFrom || state.createdTo);
  const count = activeFilters.length + Number(Boolean(state.search)) + Number(datesActive);
  const sizes = [10, 20, 50, 100];
  return (
    <section aria-label="Search and filters" className="grid gap-3">
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(12rem,1fr)_12rem_7rem]">
        <DebouncedField
          label="Search"
          value={state.search}
          placeholder={searchPlaceholder}
          onChange={(search) => onChange({ search })}
        />
        <SelectField
          label="Sort by"
          value={state.sort}
          options={sorts}
          onValueChange={(sort) => onChange({ sort })}
        />
        <SelectField
          label="Per page"
          value={String(state.limit)}
          options={(sizes.includes(state.limit) ? sizes : [state.limit, ...sizes]).map((value) => ({
            value: String(value),
            label: String(value),
          }))}
          onValueChange={(limit) => onChange({ limit: Number(limit) })}
        />
      </div>
      <details className="rounded-control border-border bg-surface border">
        <summary className="text-ink flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-semibold">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters
          {count ? (
            <span className="text-ink-muted ml-1 text-xs font-normal">{count} active</span>
          ) : null}
        </summary>
        <div className="border-border grid gap-4 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
          {filters}
          <TextField
            label="Created from (UTC)"
            type="date"
            value={state.createdFrom.slice(0, 10)}
            onChange={(event) =>
              onChange({
                createdFrom: event.target.value ? `${event.target.value}T00:00:00.000Z` : "",
              })
            }
          />
          <TextField
            label="Created before (UTC)"
            type="date"
            value={state.createdTo.slice(0, 10)}
            onChange={(event) =>
              onChange({
                createdTo: event.target.value ? `${event.target.value}T00:00:00.000Z` : "",
              })
            }
          />
        </div>
      </details>
      {count ? (
        <div
          className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          aria-label="Active filters"
        >
          <Search aria-hidden="true" className="size-3.5" />
          {state.search ? (
            <span className="max-w-full min-w-0 [overflow-wrap:anywhere]">
              Search: “{state.search}”
            </span>
          ) : null}
          {activeFilters.map((filter) => (
            <span className="max-w-full min-w-0 [overflow-wrap:anywhere]" key={filter}>
              {filter}
            </span>
          ))}
          {state.createdFrom ? <span>From {state.createdFrom.slice(0, 10)}</span> : null}
          {state.createdTo ? <span>Before {state.createdTo.slice(0, 10)}</span> : null}
          <Button variant="ghost" onClick={clear}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </section>
  );
}
