import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_ROUTES } from '../fixtures/public-routes.js';

const baselineDirectory = '.artifacts/baseline';

test.beforeAll(async () => {
  await mkdir(baselineDirectory, { recursive: true });
});

for (const route of PUBLIC_ROUTES) {
  test(`records the legacy contract for ${route}`, async ({ playwright }, testInfo) => {
    const browser = process.env.PLAYWRIGHT_WS_ENDPOINT
      ? await playwright.chromium.connect(process.env.PLAYWRIGHT_WS_ENDPOINT)
      : await playwright.chromium.launch();
    const viewport = testInfo.project.name;
    const context = await browser.newContext({
      viewport: viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    const expectedStatus = route === '/does-not-exist' ? 404 : 200;
    expect(response?.status()).toBe(expectedStatus);

    const title = await page.title();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const headingLocator = page.locator('h1').first();
    const heading = (await headingLocator.count()) ? await headingLocator.textContent() : null;
    const slug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '--');
    await page.screenshot({
      path: join(baselineDirectory, `${slug}-${viewport}.png`),
      fullPage: false,
    });
    await writeFile(
      join(baselineDirectory, `${slug}-${viewport}.json`),
      `${JSON.stringify(
        { route, viewport, status: expectedStatus, title, canonical, heading, consoleErrors },
        null,
        2
      )}\n`
    );
    await browser.close();
  });
}
