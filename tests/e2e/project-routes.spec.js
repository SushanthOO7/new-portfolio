import { expect, test } from '@playwright/test';

const projects = [
  { slug: 'slice', heading: 'Biomedical image collaboration', section: 'Bringing it together' },
  { slug: 'smart-sparrow', heading: 'Designing the future of education', section: 'The problem' },
  { slug: 'volkihar-knight', heading: 'Volkihar Knight', section: 'Armor design' },
];

for (const project of projects) {
  test(`${project.slug} renders its story and accessible fallback without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(`/projects/${project.slug}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: project.heading })).toBeVisible();
    await expect(page.getByRole('heading', { name: project.section })).toBeVisible();
    await expect(page.locator('[data-graphics-fallback]').first()).toBeVisible();
    await context.close();
  });
}

test('unknown project paths return status 404', async ({ page }) => {
  const response = await page.goto('/projects/not-a-real-project');
  expect(response?.status()).toBe(404);
});

for (const project of [
  { slug: 'smart-sparrow', marker: 'earth', asset: 'three.module' },
  { slug: 'volkihar-knight', marker: 'armor', asset: 'volkihar-knight.glb' },
]) {
  test(`${project.slug} defers its graphics until near the viewport`, async ({ page }) => {
    const requests = [];
    page.on('request', request => {
      if (request.url().includes(project.asset)) requests.push(request.url());
    });
    await page.goto(`/projects/${project.slug}`);
    const graphic = page.locator(`[data-${project.marker}-graphic]`);
    await expect(graphic).toBeVisible();
    expect(requests).toEqual([]);

    await graphic.scrollIntoViewIfNeeded();
    await expect(graphic).toHaveAttribute('data-graphics-ready', 'true');
    expect(requests.length).toBeGreaterThan(0);
  });
}

test('reduced motion renders a static Earth and starts no animation frame loop', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/projects/smart-sparrow');
  const graphic = page.locator('[data-earth-graphic]');
  await graphic.scrollIntoViewIfNeeded();

  await expect(graphic).toHaveAttribute('data-animated', 'false');
  expect(await page.evaluate(() => window.__portfolioAnimationFrames ?? 0)).toBe(0);
  await context.close();
});

test('navigation disposes project animation frames and WebGL contexts', async ({ page }) => {
  await page.goto('/projects/volkihar-knight');
  const graphic = page.locator('[data-armor-graphic]');
  await graphic.scrollIntoViewIfNeeded();
  await expect(graphic).toHaveAttribute('data-graphics-ready', 'true');

  await page.goto('/projects');
  expect(await page.evaluate(() => window.__portfolioAnimationFrames ?? 0)).toBe(0);
  expect(await page.evaluate(() => window.__portfolioWebGLContexts ?? 0)).toBe(0);
});
