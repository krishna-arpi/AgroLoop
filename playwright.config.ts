import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:6999", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://localhost:6999", reuseExistingServer: true },
});
