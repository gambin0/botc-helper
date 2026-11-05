import { defineConfig } from '@playwright/test';

/**
 * Accessibility checks (axe-core) against the production build.
 *   npm run build && npm run test:a11y
 * Locally this uses the installed Google Chrome; CI installs Playwright's Chromium.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4320',
    ...(process.env['CI'] ? {} : { channel: 'chrome' })
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs 4320',
    url: 'http://127.0.0.1:4320',
    reuseExistingServer: !process.env['CI']
  }
});
