import { z } from "zod";
import { apiList, apiRequest } from "@/lib/api/client";
import { readListState, serializeListState } from "@/lib/list-state";

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
};
export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  specialization: z.string().trim().min(2, "Enter a specialization.").max(100),
  hospital: z.string().trim().min(2, "Enter a hospital or practice.").max(160),
  phone: z.string().trim().min(7, "Enter at least 7 characters.").max(32),
  email: z.string().trim().max(254).pipe(z.email("Enter a valid email address.")),
});
export type DoctorInput = z.infer<typeof doctorFormSchema>;
export const doctorSorts = ["createdAt:desc", "createdAt:asc", "name:asc", "name:desc"] as const;
export function readDoctorState(params: URLSearchParams) {
  return {
    ...readListState(params, doctorSorts),
    specialization: (params.get("specialization") ?? "").trim().slice(0, 100),
    hospital: (params.get("hospital") ?? "").trim().slice(0, 160),
  };
}
export const doctorKeys = {
  all: ["doctors"] as const,
  list: (query: string) => ["doctors", "list", query] as const,
  detail: (id: string) => ["doctors", "detail", id] as const,
};
export function listDoctors(query: string, signal?: AbortSignal) {
  return apiList<Doctor>(`/doctors${query ? `?${query}` : ""}`, signal ? { signal } : {});
}
export function getDoctor(id: string, signal?: AbortSignal) {
  return apiRequest<Doctor>(`/doctors/${encodeURIComponent(id)}`, signal ? { signal } : {});
}
export function createDoctor(input: DoctorInput) {
  return apiRequest<Doctor>("/doctors", { method: "POST", body: input });
}
export { serializeListState };
