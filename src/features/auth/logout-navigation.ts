/** A full navigation discards private component state and pending client-router work. */
export function reloadAfterSignOut(): void {
  window.location.replace("/login");
}
