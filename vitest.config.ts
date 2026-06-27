import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Dedicated Vitest config (separate from the TanStack Start vite.config.ts) so
// unit tests run fast in a plain Node environment with the "@/..." path alias.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
  },
});
