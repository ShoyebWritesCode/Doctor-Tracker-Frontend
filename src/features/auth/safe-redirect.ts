export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value))
    return "/dashboard";
  try {
    const url = new URL(value, "http://doctor-tracker.local");
    const isPortalRoute = ["/dashboard", "/doctors", "/patients"].some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    );
    return url.origin === "http://doctor-tracker.local" && isPortalRoute
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
