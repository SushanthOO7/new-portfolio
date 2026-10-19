import { expect, test } from '@playwright/test';

test('renders the hero and experience without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'I build what’s next.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Detailed orange six-axis industrial robotic arm on a black conical base with a silver gripper' })).toBeVisible();
  const roleTransition = page.locator('[data-role-transition]');
  await expect(roleTransition).toBeVisible();
  await expect(roleTransition).toHaveAttribute(
    'aria-label',
    'Software Engineer plus Web Development, AI & ML, Test Automation, and DevOps'
  );
  await expect(roleTransition.locator('[data-role].is-active')).toHaveText('Web Development');
  await expect(page.getByRole('link', { name: 'Scroll to explore' })).toHaveAttribute('href', '#experience');
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeAttached();
  await expect(page.locator('[data-experience-entry]')).toHaveCount(4);
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Sushanth home' })).toBeVisible();
  await expect(page.locator('#projects, #tech-stack')).toHaveCount(2);
  await context.close();
});

test('renders the cinematic hero layers', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('[data-hero-paths="back"]')).toBeVisible();
  await expect(page.locator('[data-robot-state]')).toBeVisible();
  await expect(page.locator('[data-hero-paths="front"]')).toBeVisible();
  await expect(page.locator('[data-hero-marker]')).toHaveCount(3);
  await expect(page.locator('[data-robot-state]')).toHaveAttribute('data-robot-state', 'poster');
  await expect(page.locator('[data-robot-poster]')).toBeVisible();
  await expect(page.locator('.desktop-nav a')).toHaveText([
    'EXPERIENCE',
    'PROJECTS',
    'CONTACT',
  ]);
  await expect(page.getByRole('navigation', { name: 'Social links', exact: true, includeHidden: true }).getByRole('link', { includeHidden: true })).toHaveCount(4);
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
    await expect(page.locator('.desktop-nav')).toHaveCSS('justify-content', 'flex-end');
  } else {
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect(page.locator('.desktop-nav')).toBeHidden();
  }
  await expect(page.locator('.explore__indicator')).toBeVisible();
});

test('opens and closes the accessible mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggle = page.locator('[data-menu-toggle]');
  const menu = page.locator('#mobile-primary-navigation');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Close menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link')).toHaveText(['EXPERIENCE', 'PROJECTS', 'CONTACT']);
  await expect(menu.getByRole('link', { name: 'EXPERIENCE' })).toBeFocused();
  await expect(page.locator('html')).toHaveClass(/nav-open/);
  await expect(page.locator('#projects')).toHaveAttribute('inert', '');

  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: 'EXPERIENCE' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Sushanth home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/nav-open/);

  await toggle.click();
  await menu.getByRole('link', { name: 'PROJECTS' }).click();
  await expect(menu).toBeHidden();
  await expect(page.locator('#projects')).toBeFocused();
  await expect(page.locator('#projects')).toBeInViewport();
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
  // Observe the splash before full page load; images may outlast its lifetime.
  await page.goto('/', { waitUntil: 'commit' });

  const splash = page.locator('[data-site-splash]');
  await expect(splash).toBeVisible();
  await expect(splash).toBeHidden({ timeout: 10_500 });
  await expect(page.locator('[data-robot-poster]')).toBeVisible();
});

test('allows skipping the name intro and restores the page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('[data-site-splash]')).toBeHidden();
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
  await expect(page.locator('html')).not.toHaveClass(/splash-open/);
});

test('bypasses the name intro with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('sushanth-splash.json')) requests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('[data-site-splash]')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('keeps hero decoration static after its entrance', async ({ page }) => {
  await page.goto('/');
  const routes = page.locator('[data-route-base]');
  await expect.poll(() => routes.evaluateAll(paths => paths.every(path => Math.abs(parseFloat(getComputedStyle(path).strokeDashoffset)) < 0.01))).toBe(true);
  const decoration = () => page.locator('[data-route-pulse], [data-hero-copy], .atmosphere').evaluateAll(elements => elements.map(element => ({
    transform: getComputedStyle(element).transform,
    dashOffset: getComputedStyle(element).strokeDashoffset,
  })));
  const settled = await decoration();
  await page.mouse.move(20, 20);
  await page.mouse.move(350, 450);
  await page.waitForTimeout(1200);
  expect(await decoration()).toEqual(settled);
  await page.getByRole('link', { name: 'Scroll to explore' }).click();
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeInViewport();
});

test('animates short route segments only while the hero is visible and scrolling is idle', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas[data-route-motion]');
  await expect(page.locator('[data-cinematic-hero]')).toHaveAttribute('data-route-motion', 'canvas');
  const pixels = () => canvas.evaluate(canvas => canvas.toDataURL());
  const initial = await pixels();
  await expect.poll(pixels).not.toBe(initial);
  const paused = await page.evaluate(async () => {
    dispatchEvent(new Event('scroll'));
    const canvas = document.querySelector('canvas[data-route-motion]');
    const before = canvas.toDataURL();
    await new Promise(resolve => setTimeout(resolve, 120));
    return before === canvas.toDataURL();
  });
  expect(paused).toBe(true);
  const idle = await pixels();
  await expect.poll(pixels).not.toBe(idle);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toBeHidden();
  const reduced = await pixels();
  await page.waitForTimeout(250);
  expect(await pixels()).toBe(reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const offscreen = await pixels();
  await page.waitForTimeout(250);
  expect(await pixels()).toBe(offscreen);
});
