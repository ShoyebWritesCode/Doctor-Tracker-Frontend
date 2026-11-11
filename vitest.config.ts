import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["src/app/**/layout.tsx", "src/app/**/loading.tsx", "src/test/**"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
    },
    environment: "jsdom",
    include: ["tests/{components,unit}/**/*.{test,spec}.{ts,tsx}"],
    mockReset: true,
    restoreMocks: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
