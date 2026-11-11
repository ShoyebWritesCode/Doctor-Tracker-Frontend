"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { SelectField } from "@/components/ui/select-field";
import { DialogFooter } from "@/components/ui/dialog";
import { FormErrorSummary } from "@/components/feedback/form-error-summary";
import { InlineError } from "@/components/feedback/inline-error";
import { patientFormSchema, patientStatuses, type PatientInput } from "@/features/patients/api";
import { serverFields, validationFields } from "@/lib/form-errors";

function formValue(field: string, value: string): string {
  if (field !== "lastVisitAt" || !value) return value;
  const date = new Date(`${value}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function PatientForm({
  onSubmit,
  onCancel,
  pending,
  error,
  initialValues,
  submitLabel = "Create patient",
}: {
  onSubmit: (input: PatientInput) => void;
  onCancel: () => void;
  pending: boolean;
  error: unknown;
  initialValues?: PatientInput;
  submitLabel?: string;
}) {
  const [localErrors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(initialValues?.status ?? "active");
  const [gender, setGender] = useState(initialValues?.gender ?? "none");
  const errors = { ...localErrors, ...serverFields(error) };
  const fieldProps = (field: string) => ({
    id: `patient-${field}`,
    name: field,
    defaultValue:
      field === "lastVisitAt" && initialValues?.lastVisitAt
        ? new Date(initialValues.lastVisitAt).toISOString().slice(0, -1)
        : (initialValues?.[field as keyof PatientInput] ?? ""),
    ...(errors[field] ? { error: errors[field] } : {}),
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const key = field as keyof typeof patientFormSchema.shape;
      const result = patientFormSchema.shape[key].safeParse(formValue(field, event.target.value));
      setErrors((current) => ({
        ...current,
        [field]: result.success ? "" : (result.error.issues[0]?.message ?? "Review this field."),
      }));
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.status = status;
    values.gender = gender === "none" ? "" : gender;
    values.lastVisitAt = formValue("lastVisitAt", String(values.lastVisitAt ?? ""));
    const parsed = patientFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(validationFields(parsed.error));
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${String(parsed.error.issues[0]?.path[0] ?? "name")}"]`)
        ?.focus();
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }
  return (
    <form className="grid min-w-0 grid-cols-1 gap-4" method="post" noValidate onSubmit={submit}>
      <FormErrorSummary
        errors={Object.entries(errors)
          .filter(([, message]) => message)
          .map(([field, message]) => ({ fieldId: `patient-${field}`, message }))}
      />
      {error ? (
        <InlineError>
          {`We could not ${initialValues ? "save" : "add"} this patient. Your entries are preserved; review the fields or try again.`}
        </InlineError>
      ) : null}
      <TextField {...fieldProps("name")} label="Patient name" maxLength={120} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          {...fieldProps("email")}
          label="Email (optional)"
          type="email"
          maxLength={254}
          description="Provide email or phone, or both."
        />
        <TextField {...fieldProps("phone")} label="Phone (optional)" type="tel" maxLength={32} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField {...fieldProps("condition")} label="Condition" maxLength={120} required />
        <SelectField
          label="Status"
          id="patient-status"
          required
          value={status}
          onValueChange={(value) => setStatus(value as PatientInput["status"])}
          options={patientStatuses}
        />
      </div>
      <details className="rounded-control border-border border">
        <summary className="text-ink min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold">
          Additional details (optional)
        </summary>
        <div className="border-border grid gap-4 border-t p-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              {...fieldProps("dateOfBirth")}
              label="Date of birth (optional)"
              type="date"
            />
            <SelectField
              label="Gender (optional)"
              id="patient-gender"
              value={gender}
              onValueChange={setGender}
              options={[
                { value: "none", label: "Not recorded" },
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "non_binary", label: "Non-binary" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]}
            />
          </div>
          <TextField
            {...fieldProps("lastVisitAt")}
            label="Last visit (UTC, optional)"
            type="datetime-local"
            step="0.001"
          />
          <TextareaField
            {...fieldProps("notes")}
            label="Notes (optional)"
            maxLength={1000}
            description="Up to 1,000 characters. Use fictional demonstration data only."
          />
        </div>
      </details>
      <DialogFooter>
        <Button variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
