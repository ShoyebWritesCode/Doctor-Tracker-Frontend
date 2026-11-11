const url = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3000");
if (
  url.protocol !== "http:" ||
  url.hostname !== "localhost" ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
) {
  throw new Error(
    "E2E_BASE_URL must be an http://localhost origin for the disposable test server.",
  );
}
export const e2eOrigin = url.origin;
export const e2ePort = url.port || "80";
