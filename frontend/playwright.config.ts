import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
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
