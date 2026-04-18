// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],

  use: {
    baseURL: "http://127.0.0.1:8080",
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Capture screenshots only on failure
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Requires the PHP server to be running via `make serve-bg` before test run.
  // webServer is intentionally omitted so tests don't auto-start PHP.
});
