import type { NextConfig } from "next";

const defaultApiTarget = "http://localhost:4000";

function apiProxyTarget(): string {
  const configuredTarget = process.env.API_PROXY_TARGET ?? defaultApiTarget;
  const parsed = new URL(configuredTarget);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("API_PROXY_TARGET must use http:// or https://.");
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("API_PROXY_TARGET must contain only scheme, host, and optional port.");
  }

  return parsed.origin;
}

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // The compiler API is stable in this pinned TypeScript release and avoids
    // subprocess output issues in restricted CI/container environments.
    useTypeScriptCli: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        destination: `${apiProxyTarget()}/api/v1/:path*`,
        source: "/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
