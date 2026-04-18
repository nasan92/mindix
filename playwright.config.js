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

  // Auto-start the PHP dev server when running E2E tests.
  // reuseExistingServer: true means an already-running server (e.g. from `make serve-bg`) is used as-is.
  webServer: {
    command: `php -S ${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 8080} -t .`,
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
