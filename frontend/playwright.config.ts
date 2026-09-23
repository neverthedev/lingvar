import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  // Browser scenarios share one disposable PostgreSQL schema, so concurrent
  // workers could observe another scenario's setup or cleanup.
  workers: 1,
  use: {
    baseURL: 'http://localhost:8087',
    browserName: 'chromium',
    launchOptions: {
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
    ...devices['Desktop Chrome'],
  },
})
