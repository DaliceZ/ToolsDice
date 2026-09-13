import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: [
    { command: 'bun run dev', cwd: '../backend', url: 'http://localhost:3000/api/v1/health', reuseExistingServer: !process.env.CI },
    { command: 'bun run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
  ],
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
