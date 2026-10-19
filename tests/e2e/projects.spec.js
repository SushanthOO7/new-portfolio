import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const projects = JSON.parse(readFileSync(new URL('../../src/data/projects.json', import.meta.url), 'utf8'));

test('folder opens project cards and preserves state through theme changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const section = page.locator('#projects');
  await section.scrollIntoViewIfNeeded();
  const toggle = section.getByRole('button', { name: /Open Projects/ });
  await toggle.click();
  const close = section.getByRole('button', { name: /Close Projects/ });
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  for (const project of projects) {
    const card = section.getByRole('link', { name: `${project.title} — view project (opens in a new tab)` });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', project.url);
    await expect(card.getByText(project.description)).toBeVisible();
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  await expect(section.locator('.project-art-light').first()).toBeVisible();
  await expect(section.locator('.gf-back')).toHaveCSS('background-image', 'linear-gradient(rgb(250, 250, 251), rgb(223, 223, 229))');
  await expect(section.locator('.gf-sheet-name').first()).toHaveCSS('color', 'rgb(24, 24, 28)');
  await expect(section.locator('.project-art-dark').first()).toBeHidden();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(section.locator('.project-art-dark').first()).toBeVisible();
  await section.locator('.gf-sheet').first().focus();
  await page.keyboard.press('Escape');
  await expect(section.getByRole('button', { name: /Open Projects/ })).toBeFocused();
  await expect(section.locator('.gf-files')).toHaveAttribute('inert', '');
  expect(errors).toEqual([]);
});

test('mobile opened projects remain readable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#projects').scrollIntoViewIfNeeded();
  const initialWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.getByRole('button', { name: /Open Projects/ }).click();
  const cards = page.locator('#projects .gf-sheet');
  let bottom = 0;
  for (const card of await cards.all()) {
    const box = await card.boundingBox();
    expect(box.width).toBeGreaterThan(270);
    expect(box.y).toBeGreaterThanOrEqual(bottom);
    bottom = box.y + box.height;
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(initialWidth);
});

test('project content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  for (const project of projects) {
    const card = page.locator('.projects-fallback').getByRole('link').filter({ hasText: project.title });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', project.url);
  }
  await context.close();
});

test('GitHub skyline supports view, keyboard, theme, and responsive interactions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');

  const activity = page.locator('#projects .github-activity');
  await activity.scrollIntoViewIfNeeded();
  await expect(activity).toHaveAttribute('data-source', /live|snapshot/);
  await expect(activity.getByRole('link', { name: /SushanthOO7 on GitHub/ })).toHaveAttribute('href', 'https://github.com/SushanthOO7');

  const skyline = activity.getByRole('img');
  await expect(skyline).toHaveAttribute('aria-label', /3D skyline/);
  await expect(activity.getByRole('button', { name: '3D skyline' })).toHaveAttribute('aria-pressed', 'true');
  await activity.getByRole('button', { name: 'Flat heat map' }).click();
  await expect(activity.getByRole('button', { name: 'Flat heat map' })).toHaveAttribute('aria-pressed', 'true');
  await expect(skyline).toHaveAttribute('aria-label', /heat map/);

  await skyline.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(activity.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  await expect(activity.locator('[aria-live="polite"]')).not.toHaveText('');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect(activity.locator('.github-activity__skyline')).toHaveCSS('color', 'rgb(23, 23, 23)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(errors).toEqual([]);
});
