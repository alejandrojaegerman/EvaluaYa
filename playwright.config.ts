import { defineConfig, devices } from "@playwright/test";

// E2E config. Runs against the already-running dev server by default; override
// with PLAYWRIGHT_BASE_URL to point at a deployed environment.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    // Mobile-first app: emulate a phone viewport.
    ...devices["Pixel 7"],
    // Deny geolocation so the manual state/municipio selection drives the flow.
    permissions: [],
    trace: "retain-on-failure",
  },
});
