import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  ...base,
  use: {
    ...(base.use ?? {}),
    launchOptions: { executablePath: "/chromium-1194/chrome-linux/chrome" },
  },
});
