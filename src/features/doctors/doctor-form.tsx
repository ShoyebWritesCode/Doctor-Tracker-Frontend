"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { FormErrorSummary } from "@/components/feedback/form-error-summary";
import { InlineError } from "@/components/feedback/inline-error";
import { useToast } from "@/components/ui/toast";
import {
  createDoctor,
  doctorFormSchema,
  doctorKeys,
  type DoctorInput,
} from "@/features/doctors/api";
import { ApiError } from "@/lib/api/client";
import { isFormDismissal, validationFields, serverFields } from "@/lib/form-errors";

const fields = [
  {
    name: "name",
    label: "Full name",
    placeholder: "Dr. Samira Khan",
    maxLength: 120,
    type: "text",
  },
  {
    name: "specialization",
    label: "Specialization",
    placeholder: "Cardiology",
    maxLength: 100,
    type: "text",
  },
  {
    name: "hospital",
    label: "Hospital or practice",
    placeholder: "Central Hospital",
    maxLength: 160,
    type: "text",
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "+880 1700 000001",
    maxLength: 32,
    type: "tel",
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "samira@example.test",
    maxLength: 254,
    type: "email",
  },
] as const;

export function DoctorForm() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const client = useQueryClient();
  const notify = useToast();
  const mutation = useMutation({
    mutationFn: (input: DoctorInput) => createDoctor(input),
    onSuccess: async (doctor) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: doctorKeys.all }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setOpen(false);
      notify({
        title: "Doctor added",
        description: `${doctor.name} has been added. Current directory filters still apply.`,
        tone: "success",
      });
    },
    onError: (error) => {
      setErrors({
        ...serverFields(error),
        ...(error instanceof ApiError && error.code === "DOCTOR_EMAIL_CONFLICT"
          ? { email: "A doctor with this email already exists." }
          : {}),
      });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const parsed = doctorFormSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(validationFields(parsed.error));
      event.currentTarget
        .querySelector<HTMLInputElement>(
          `[name="${String(parsed.error.issues[0]?.path[0] ?? "name")}"]`,
        )
        ?.focus();
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        setOpen(next);
        if (next) {
          mutation.reset();
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Add doctor</Button>
      </DialogTrigger>
      <DialogContent showClose={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>Add a doctor</DialogTitle>
          <DialogDescription>Create a clinician record. All fields are required.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" method="post" noValidate onSubmit={submit}>
          <FormErrorSummary
            errors={Object.entries(errors)
              .filter(([, message]) => message)
              .map(([field, message]) => ({
                fieldId: `doctor-${field}`,
                message,
              }))}
          />
          {mutation.isError ? (
            <InlineError>
              We could not add the doctor. Review the fields below or try again.
            </InlineError>
          ) : null}
          {fields.map((field) => (
            <TextField
              key={field.name}
              {...field}
              id={`doctor-${field.name}`}
              label={field.label}
              required
              {...(errors[field.name] ? { error: errors[field.name] } : {})}
              onBlur={(event) => {
                if (isFormDismissal(event.relatedTarget)) return;
                const result = doctorFormSchema.shape[field.name].safeParse(event.target.value);
                setErrors((current) => ({
                  ...current,
                  [field.name]: result.success
                    ? ""
                    : (result.error.issues[0]?.message ?? "Review this field."),
                }));
              }}
            />
          ))}
          <DialogFooter>
            <DialogClose asChild>
              <Button data-form-dismiss="" disabled={mutation.isPending} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button loading={mutation.isPending} type="submit">
              Create doctor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
