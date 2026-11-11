export const sessionExpiredEvent = "doctor-tracker:session-expired";

export function notifySessionExpired(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(sessionExpiredEvent));
}
