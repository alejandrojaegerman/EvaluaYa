import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Dedicated Vitest config (separate from the TanStack Start vite.config.ts) so
// unit tests run fast in a plain Node environment with the "@/..." path alias.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
  },
});
