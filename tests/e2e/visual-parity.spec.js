import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from '../fixtures/public-routes.js';

const baselineRoot = new URL('../../.artifacts/baseline/', import.meta.url);
const routeName = route => route === '/' ? 'home' : route.slice(1).replaceAll('/', '--');

for (const route of PUBLIC_ROUTES) {
  test(`${route} retains its approved visual structure`, async ({ page }, testInfo) => {
    const name = routeName(route);
    const baseline = JSON.parse(await readFile(new URL(`${name}-${testInfo.project.name}.json`, baselineRoot), 'utf8'));
    const errors = [];
    const failedResponses = [];
    page.on('console', message => message.type() === 'error' && errors.push(message.text()));
    page.on('response', response => response.status() >= 400 && failedResponses.push({
      path: new URL(response.url()).pathname,
      status: response.status(),
      type: response.request().resourceType(),
    }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(baseline.status);
    await expect(page).not.toHaveTitle('');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
    });
    const unexpectedResponses = failedResponses.filter(item => !(baseline.status === 404 && item.status === 404 && item.type === 'document' && item.path === route));
    expect(unexpectedResponses).toEqual([]);
    const unexpectedErrors = errors.filter(message => !(baseline.status === 404 && /Failed to load resource.+404/.test(message)));
    expect(unexpectedErrors).toEqual([]);
  });
}
