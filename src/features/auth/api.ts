import { apiRequest } from "@/lib/api/client";
import type { Admin } from "@/features/auth/types";

export const authKeys = { current: ["auth", "current"] as const };
export function login(input: { email: string; password: string }, signal?: AbortSignal) {
  return apiRequest<Admin>("/auth/login", {
    body: input,
    method: "POST",
    ...(signal ? { signal } : {}),
  });
}
export function getCurrentAdmin(signal?: AbortSignal) {
  return apiRequest<Admin>("/auth/me", signal ? { signal } : {});
}
export function logout(signal?: AbortSignal) {
  return apiRequest<void>("/auth/logout", { method: "POST", ...(signal ? { signal } : {}) });
}
