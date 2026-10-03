import { expect, test } from '@playwright/test';

test('renders the complete home story without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Sushanth U V' })).toBeVisible();
  await expect(page.getByText('Software Engineer', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My Stack' })).toBeVisible();
  await expect(page.getByText('React', { exact: true })).toBeVisible();
  await expect(page.getByText('Playwright', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Check out all projects' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View All Projects' })).toHaveAttribute('href', '/projects');
  await context.close();
});

test('does not initialize the fluid cursor for reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page.locator('canvas[data-fluid-cursor]')).toHaveCount(0);
  await context.close();
});

test('does not initialize the fluid cursor on a touch device', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page.locator('canvas[data-fluid-cursor]')).toHaveCount(0);
  await context.close();
});

test('initializes the fluid cursor for a fine pointer without reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: false, isMobile: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('canvas[data-fluid-cursor]')).toBeVisible();
  await context.close();
});

test('preserves the sphere layout and requests its island only near the viewport', async ({ page }) => {
  const islandRequests = [];
  page.on('request', request => {
    if (request.url().includes('DisplacementSphere')) islandRequests.push(request.url());
  });
  await page.goto('/');
  const placeholder = page.locator('[data-sphere-placeholder]');
  await expect(placeholder).toBeVisible();
  const box = await placeholder.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(280);
  expect(islandRequests).toEqual([]);

  await placeholder.scrollIntoViewIfNeeded();
  await expect(placeholder).toHaveAttribute('data-sphere-ready', 'true');
  expect(islandRequests.length).toBeGreaterThan(0);
});
