export const sessionExpiredEvent = "doctor-tracker:session-expired";
export const signOutStartedEvent = "doctor-tracker:sign-out-started";
export const signOutCancelledEvent = "doctor-tracker:sign-out-cancelled";

export function notifySignOutStarted(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(signOutStartedEvent));
}
export function notifySignOutCancelled(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(signOutCancelledEvent));
}

export function notifySessionExpired(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(sessionExpiredEvent));
}
