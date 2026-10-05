import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
export const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BROWSER: 'none',
      HOST: '127.0.0.1',
      PORT: String(PORT),
      REACT_APP_REDIRECT_URI: ORIGIN,
      REACT_APP_SPOTIFY_CLIENT_ID: 'e2e-client-id',
    },
  },
});
