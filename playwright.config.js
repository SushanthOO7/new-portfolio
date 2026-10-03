import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT || 7778);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const externalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.js'],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: '.artifacts/playwright',
  reporter: [['list'], ['html', { outputFolder: '.artifacts/playwright-report', open: 'never' }]],
  use: {
    baseURL,
    connectOptions: process.env.PLAYWRIGHT_WS_ENDPOINT
      ? { wsEndpoint: process.env.PLAYWRIGHT_WS_ENDPOINT }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: externalServer
    ? undefined
    : {
        command: 'npm run build && node scripts/serve-dist.mjs',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
