import { defineConfig, devices } from '@playwright/test'

const apiPort = 4317
const webPort = 4318
const apiOrigin = `http://127.0.0.1:${apiPort}`
const webOrigin = `http://127.0.0.1:${webPort}`

export default defineConfig({
  testDir: './e2e',
  webServer: [
    {
      command: 'bun run dev',
      cwd: '../backend',
      url: `${apiOrigin}/api/v1/health`,
      env: { API_PORT: String(apiPort), ALLOWED_ORIGINS: webOrigin },
      reuseExistingServer: false,
    },
    {
      command: 'bun run dev',
      url: webOrigin,
      env: { TOOLSDICE_DEV_PORT: String(webPort), TOOLSDICE_API_PROXY_TARGET: apiOrigin },
      reuseExistingServer: false,
    },
  ],
  use: { baseURL: webOrigin, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
