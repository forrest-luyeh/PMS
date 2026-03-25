import { defineConfig, devices } from '@playwright/test'

// Demo mode: DEMO_DELAY=毫秒 (預設 0，demo 建議 800~1500)
const slowMo = parseInt(process.env.DEMO_DELAY ?? '0', 10)
// Demo mode: DEMO_SUITE=01|02|all (預設 all)
const suite = process.env.DEMO_SUITE ?? 'all'
const testMatch = suite === '01' ? '**/01-*.spec.js'
                : suite === '02' ? '**/02-*.spec.js'
                : '**/*.spec.js'

export default defineConfig({
  testDir: './e2e',
  testMatch,
  timeout: slowMo > 0 ? 120000 : 30000,   // demo 模式給更長 timeout
  retries: 0,
  use: {
    baseURL: 'http://localhost:5177',
    headless: false,
    slowMo,                                  // 每個 browser action 間隔 ms
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
