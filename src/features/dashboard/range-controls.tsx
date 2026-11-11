"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { FormErrorSummary } from "@/components/feedback/form-error-summary";
import { validationFields } from "@/lib/form-errors";
import { dashboardRangeSchema, recentRange, type DashboardRange } from "@/features/dashboard/range";

export function RangeControls({
  range,
  onApply,
}: {
  range: DashboardRange;
  onApply: (range: DashboardRange) => void;
}) {
  const [draft, setDraft] = useState(range);
  const [errors, setErrors] = useState<Record<string, string>>(() => {
    const parsed = dashboardRangeSchema.safeParse(range);
    return parsed.success ? {} : validationFields(parsed.error);
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = dashboardRangeSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(validationFields(parsed.error));
      document
        .getElementById(`dashboard-${String(parsed.error.issues[0]?.path[0] ?? "from")}`)
        ?.focus();
      return;
    }
    setErrors({});
    onApply(parsed.data);
  }
  return (
    <form
      aria-label="Dashboard date range"
      className="border-border grid min-w-0 grid-cols-1 gap-4 border-b pb-6"
      method="post"
      noValidate
      onSubmit={submit}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-muted mr-1 text-xs font-semibold">Quick range</span>
        {[7, 30, 90].map((days) => (
          <Button
            key={days}
            variant="outline"
            onClick={() => {
              const zone = dashboardRangeSchema.shape.timezone.safeParse(draft.timezone);
              if (!zone.success) {
                setErrors({ timezone: "Enter a valid time zone before choosing a quick range." });
                return;
              }
              const next = recentRange(days, zone.data);
              setDraft(next);
              setErrors({});
              onApply(next);
            }}
          >
            Last {days} days
          </Button>
        ))}
      </div>
      <FormErrorSummary
        errors={Object.entries(errors).map(([field, message]) => ({
          fieldId: `dashboard-${field}`,
          message,
        }))}
      />
      <div className="grid min-w-0 items-start gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
        <TextField
          label="Created from"
          id="dashboard-from"
          type="date"
          required
          value={draft.from}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          {...(errors.from ? { error: errors.from } : {})}
        />
        <TextField
          label="Created before (exclusive)"
          id="dashboard-to"
          type="date"
          required
          value={draft.to}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          {...(errors.to ? { error: errors.to } : {})}
        />
        <TextField
          label="Time zone"
          id="dashboard-timezone"
          value={draft.timezone}
          maxLength={100}
          list="dashboard-timezones"
          onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
          {...(errors.timezone ? { error: errors.timezone } : {})}
        />
        <Button type="submit" className="self-start sm:mt-7">
          Apply range
        </Button>
      </div>
      <datalist id="dashboard-timezones">
        {[
          "Asia/Dhaka",
          "UTC",
          "America/New_York",
          "Europe/London",
          "Asia/Tokyo",
          "Australia/Sydney",
        ].map((zone) => (
          <option value={zone} key={zone} />
        ))}
      </datalist>
      <p className="text-ink-muted text-xs leading-5">
        Dates are local to the IANA time zone above, up to 366 days. The period affects new-patient
        counts and the daily trend only; totals and doctor ranking are all-time.
      </p>
    </form>
  );
}
