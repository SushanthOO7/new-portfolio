import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const items = JSON.parse(readFileSync(new URL('../../src/data/tech-stack.json', import.meta.url), 'utf8'));

async function openStack(page, reduced = true) {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await page.goto('/');
  await page.locator('#tech-stack').scrollIntoViewIfNeeded();
  await expect(page.locator('#tech-stack .is-enhanced')).toBeAttached();
  await expect(page.locator('.tech-tile')).toHaveCount(items.length);
  if (reduced) await expect(page.locator('.tech-stack__inner')).toHaveAttribute('data-orbit-running', 'false');
}

test('orbit dots meet accent endpoints without an outer dashed ring or duplicate label', async ({ page }) => {
  await openStack(page);
  const distances = await page.locator('[data-orbit-layer]').evaluateAll(layers => layers.map(layer => {
    const arc = layer.querySelector('.tech-orbit__arc');
    const node = layer.querySelector('.tech-orbit__node');
    const length = arc.getTotalLength();
    return Math.min(...[0, length].map(distance => {
      const point = arc.getPointAtLength(distance);
      return Math.hypot(point.x - node.cx.baseVal.value, point.y - node.cy.baseVal.value);
    }));
  }));
  for (const distance of distances) expect(distance).toBeLessThan(.1);
  await expect(page.locator('.tech-orbit__arc--dashed')).toHaveCount(0);
  await expect(page.getByText('04 — TECH STACK', { exact: true })).toHaveCount(0);
  await expect(page.locator('.tech-orbit__guide--dashed')).toHaveCount(1);
});

test('JSON logos render statically without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const section = page.locator('#tech-stack');
  await expect(section.getByRole('heading', { name: 'TECH STACK' })).toBeVisible();
  await expect(section.locator('.tech-tile')).toHaveCount(items.length);
  for (const item of items) {
    const tile = section.locator(`[data-tech-id="${item.id}"]`);
    await expect(tile).toBeVisible();
    expect(await tile.evaluate(el => getComputedStyle(el.closest('.tech-orbit__position')).opacity)).toBe('1');
    await expect(tile.locator('img').first()).toHaveAttribute('src', item.logo);
  }
  await context.close();
});

test('every category filters JSON content and rapid switching restores all items', async ({ page }) => {
  await openStack(page);
  for (const category of ['frontend', 'backend', 'ai', 'devops', 'tools', 'all']) {
    const button = page.getByRole('group', { name: 'Filter technologies' }).getByRole('button', { name: category.toUpperCase(), exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const expected = category === 'all' ? items : items.filter(item => item.categories.includes(category));
    await expect(page.locator('.tech-tile')).toHaveCount(expected.length);
    expect(await page.locator('.tech-tile').evaluateAll(nodes => nodes.map(n => n.dataset.techId))).toEqual(expected.map(item => item.id));
  }
  await page.locator('.tech-stack__filters').evaluate(group => {
    for (const label of ['AI', 'FRONTEND', 'TOOLS', 'ALL']) [...group.querySelectorAll('button')].find(b => b.textContent === label).click();
  });
  await expect(page.locator('.tech-tile')).toHaveCount(items.length);
});

test('keyboard and pointer details stay inside the viewport and dismiss with Escape', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openStack(page);
  const tile = page.locator('[data-tech-id="openai"]');
  await tile.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toContainText('OpenAI');
  await expect(tile).toHaveAttribute('aria-describedby', 'technology-tooltip');
  const box = await tooltip.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await page.locator('[data-tech-id="python"]').hover();
  await expect(tooltip).toContainText('Python');
  await tooltip.hover();
  await page.waitForTimeout(250);
  await expect(tooltip).toContainText('Python');
  expect(errors).toEqual([]);
});

test('theme artwork loads and responsive layouts have no horizontal overflow', async ({ page }) => {
  await openStack(page);
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    for (const item of items) {
      const logo = page.locator(`[data-tech-id="${item.id}"] img:visible`);
      await expect(logo).toHaveAttribute('src', theme === 'light' ? item.logoLight || item.logo : item.logo);
      await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    }
  }
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('ambient motion pauses on focus and explicit pause, and stops offscreen', async ({ page }) => {
  await openStack(page, false);
  const root = page.locator('#tech-stack .tech-stack__inner');
  await expect(root).toHaveAttribute('data-orbit-running', 'true');
  const tile = page.locator('[data-tech-id="react"]');
  await tile.focus();
  await expect(root).toHaveAttribute('data-orbit-running', 'false');
  const position = () => tile.locator('xpath=ancestor::*[contains(@class,"tech-orbit__position")]').evaluate(el => ({ left: el.style.left, top: el.style.top }));
  const paused = await position();
  await page.waitForTimeout(200);
  expect(await position()).toEqual(paused);
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-orbit-running', 'false');
  await page.getByRole('button', { name: 'Pause orbital animation' }).click();
  await expect(root).toHaveAttribute('data-orbit-running', 'false');
  await page.getByRole('button', { name: 'Resume orbital animation' }).click();
  await expect(root).toHaveAttribute('data-orbit-running', 'true');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(root).toHaveAttribute('data-orbit-running', 'false');
});

test('touch opens a detail on first tap and tapping elsewhere dismisses it', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openStack(page);
  await page.locator('[data-tech-id="openai"]').tap();
  await expect(page.getByRole('tooltip')).toContainText('OpenAI');
  await page.locator('.tech-stack__eyebrow').tap();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await context.close();
});
