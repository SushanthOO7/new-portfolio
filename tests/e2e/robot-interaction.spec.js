import { test, expect } from '@playwright/test';

test('keeps the original realistic poster in both themes without loading a GLB', async ({ page }) => {
  const models = [];
  page.on('request', request => { if (request.url().endsWith('.glb')) models.push(request.url()); });
  await page.goto('/');
  const robot = page.locator('[data-robot-state]');
  const image = page.locator('[data-robot-poster] img');
  for (const theme of ['dark', 'light']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await expect(robot).toHaveAttribute('data-robot-state', 'poster');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(image => image.complete && image.naturalWidth > 0 && /robotic-arm-poster\.(avif|webp)$/.test(image.currentSrc))).toBe(true);
    await expect(robot.locator('canvas')).toHaveCount(0);
  }
  expect(models).toHaveLength(0);
});
