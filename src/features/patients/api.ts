import { z } from "zod";
import { apiList, apiRequest } from "@/lib/api/client";
import { readListState } from "@/lib/list-state";

export type Patient = {
  id: string;
  doctor: { id: string; name: string };
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  condition: string;
  status: "active" | "follow_up" | "discharged";
  lastVisitAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export const patientStatuses = [
  { value: "active", label: "Active" },
  { value: "follow_up", label: "Follow-up" },
  { value: "discharged", label: "Discharged" },
] as const;
const optionalText = <T extends z.ZodType<string>>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
export const patientFormSchema = z
  .object({
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
    email: optionalText(z.string().trim().max(254).pipe(z.email("Enter a valid email address."))),
    phone: optionalText(z.string().trim().min(7, "Enter at least 7 characters.").max(32)),
    condition: z.string().trim().min(2, "Enter a condition.").max(120),
    status: z.enum(["active", "follow_up", "discharged"]),
    dateOfBirth: optionalText(z.iso.date()),
    gender: optionalText(z.enum(["female", "male", "non_binary", "prefer_not_to_say"])),
    lastVisitAt: optionalText(z.iso.datetime({ offset: true })),
    notes: optionalText(z.string().trim().max(1000)),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    path: ["email"],
    message: "Provide an email address or phone number.",
  });
export type PatientInput = z.infer<typeof patientFormSchema>;
export const patientSorts = [
  "createdAt:desc",
  "createdAt:asc",
  "name:asc",
  "name:desc",
  "lastVisitAt:desc",
  "lastVisitAt:asc",
] as const;
export function readPatientState(params: URLSearchParams) {
  const status = params.get("status") ?? "";
  return {
    ...readListState(params, patientSorts),
    condition: (params.get("condition") ?? "").trim().slice(0, 120),
    status: patientStatuses.some((option) => option.value === status) ? status : "",
  };
}
export const patientKeys = {
  all: ["patients"] as const,
  scoped: (doctorId: string, query: string) => ["patients", "doctor", doctorId, query] as const,
};
export function listDoctorPatients(doctorId: string, query: string, signal?: AbortSignal) {
  return apiList<Patient>(
    `/doctors/${encodeURIComponent(doctorId)}/patients${query ? `?${query}` : ""}`,
    signal ? { signal } : {},
  );
}
export function createDoctorPatient(doctorId: string, input: PatientInput) {
  return apiRequest<Patient>(`/doctors/${encodeURIComponent(doctorId)}/patients`, {
    method: "POST",
    body: input,
  });
}
export function deleteDoctorPatient(doctorId: string, patientId: string) {
  return apiRequest<void>(
    `/doctors/${encodeURIComponent(doctorId)}/patients/${encodeURIComponent(patientId)}`,
    { method: "DELETE" },
  );
}
