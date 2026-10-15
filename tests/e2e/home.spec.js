import { expect, test } from '@playwright/test';

test('renders only the landing hero without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'I build what’s next.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Detailed orange six-axis industrial robotic arm on a black conical base with a silver gripper' })).toBeVisible();
  await expect(page.getByText('Turning complex', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Scroll to explore' })).toHaveAttribute('href', '#main-content');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sushanth home' })).toBeVisible();
  await expect(page.locator('#profile, .skills, .projects, footer')).toHaveCount(0);
  await context.close();
});

test('renders the cinematic hero layers', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-hero-paths="back"]')).toBeVisible();
  await expect(page.locator('[data-robot-state]')).toBeVisible();
  await expect(page.locator('[data-hero-paths="front"]')).toBeVisible();
  await expect(page.locator('[data-hero-marker]')).toHaveCount(3);
  await expect(page.locator('[data-robot-state]')).toHaveAttribute('data-robot-state', 'poster');
  await expect(page.locator('[data-robot-poster]')).toBeVisible();
});

test('reduced motion disables looping hero motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const modelRequests = [];
  page.on('request', request => {
    if (request.url().includes('black_honey_robotic_arm.glb')) modelRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('[data-cinematic-hero]')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('[data-robot-state]')).toHaveAttribute('data-animated', 'false');
  await expect(page.locator('[data-robot-state]')).toHaveAttribute('data-robot-state', 'poster');
  expect(modelRequests).toEqual([]);
  await context.close();
});

test('dismisses the first-visit splash without waiting for a model', async ({ page }) => {
  await page.goto('/');

  const splash = page.locator('[data-site-splash]');
  await expect(splash).toBeVisible();
  await expect(splash).toBeHidden({ timeout: 1_800 });
  await expect(page.locator('[data-robot-poster]')).toBeVisible();
});

