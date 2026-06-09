import { defineConfig, devices } from "@playwright/test";

const runtimeMode = process.env.E2E_RUNTIME_MODE;
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const apiURL =
  process.env.E2E_API_URL ?? (runtimeMode === "nginx" ? "http://127.0.0.1" : "http://localhost:8000");
const serverEnv = [`E2E_API_URL=${apiURL}`, runtimeMode ? `E2E_RUNTIME_MODE=${runtimeMode}` : ""]
  .filter(Boolean)
  .join(" ");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `${serverEnv} npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`,
    url: baseURL,
    reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "1",
    timeout: 120_000,
  },
});
