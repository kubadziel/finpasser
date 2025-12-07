import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*upload.e2e.spec.ts"],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    // Record videos for all runs (success and failure)
    video: "on",
    storageState: ".auth/state.json",
    launchOptions: {
      args: [
        "--host-resolver-rules=MAP keycloak 127.0.0.1,EXCLUDE localhost",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
