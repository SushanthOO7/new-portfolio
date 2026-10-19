import { expect, test } from '@playwright/test';
const skipIntro = page => page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));

test('Projects repeats with an orange ball and readable ink in both themes', async ({ page }) => {
  await skipIntro(page);
  await page.addInitScript(() => localStorage.setItem('portfolio-theme', 'dark'));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Projects', exact: true });
  await page.evaluate(() => { location.hash = 'projects'; });
  const title = heading.locator('[data-title-animation]');
  await expect(title).toHaveAttribute('data-playback', 'playing');
  const ball = title.locator('[data-title-player] .word-accent path');
  await expect(ball).toHaveAttribute('fill', 'rgb(255,77,0)');
  const ink = title.locator('[data-title-player] [fill="currentColor"]').first();
  await expect(ink).toHaveCSS('fill', 'rgb(242, 242, 238)');
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await expect(ink).toHaveCSS('fill', 'rgb(23, 23, 23)');
  await expect(ball).toHaveAttribute('fill', 'rgb(255,77,0)');
  await expect.poll(() => title.getAttribute('data-loop-count'), { timeout: 17000 }).toBe('2');
  await page.evaluate(() => { location.hash = 'main-content'; });
  await expect(title).toHaveAttribute('data-playback', 'paused');
  await page.evaluate(() => { location.hash = 'projects'; });
  await expect(title).toHaveAttribute('data-playback', 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(title.locator('[data-title-poster]')).toBeVisible();
  await expect(title).toHaveAttribute('data-playback', 'paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { location.hash = 'projects'; });
  await expect(title).toHaveAttribute('data-playback', 'playing');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Projects has theme-aware static artwork without JS or when playback fails', async ({ browser, page }) => {
  await skipIntro(page);
  await page.route('**/animations/projects-title.json', route => route.abort());
  await page.goto('/');
  const title = page.locator('[data-title-name="Projects"]');
  await page.evaluate(() => { location.hash = 'projects'; });
  await expect(title).toHaveAttribute('data-playback', 'fallback');
  await expect(title.locator('[data-title-poster]')).toBeVisible();
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await expect(title.locator('[data-title-poster] [fill="currentColor"]').first()).toHaveCSS('fill', 'rgb(23, 23, 23)');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('/');
  await expect(staticPage.getByRole('heading', { name: 'Projects', exact: true }).locator('[data-title-poster]')).toBeVisible();
  await context.close();
});

test('loader loops above the old pill until readiness reaches 100 then exits', async ({ page }) => {
  test.setTimeout(25000);
  await page.addInitScript(() => {
    window.__loaderTiming = { playing: undefined, firstLoop: undefined };
    new MutationObserver(records => {
      for (const record of records) {
        const root = record.target;
        if (!(root instanceof HTMLElement) || !root.hasAttribute('data-site-splash')) continue;
        if (root.dataset.playback === 'playing' && window.__loaderTiming.playing === undefined) window.__loaderTiming.playing = performance.now();
        if (Number(root.dataset.loopCount) >= 1 && window.__loaderTiming.firstLoop === undefined) window.__loaderTiming.firstLoop = performance.now();
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-playback', 'data-loop-count'] });
  });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/images/home/robotic-arm-poster.avif', async route => { await held; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const splash = page.locator('[data-site-splash]');
  const progress = splash.getByRole('progressbar');
  await expect(progress).toBeVisible();
  await expect(splash).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => splash.getAttribute('data-loop-count'), { timeout: 8000 }).toBe('1');
  const timing = await page.evaluate(() => ({ ...window.__loaderTiming, visible: Number(document.querySelector('[data-site-splash]').dataset.visibleSince) }));
  expect(timing.playing - timing.visible).toBeGreaterThanOrEqual(1900);
  expect(timing.playing - timing.visible).toBeLessThan(2900);
  expect(timing.firstLoop - timing.playing).toBeGreaterThan(2700);
  expect(timing.firstLoop - timing.playing).toBeLessThan(3400);
  expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(100);
  release();
  await expect(progress).toHaveAttribute('aria-valuenow', '100', { timeout: 2500 });
  await expect(splash).toHaveAttribute('data-loading-phase', 'welcome');
  await expect(splash).toBeHidden({ timeout: 3000 });
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
  await expect(page.locator('html')).not.toHaveClass(/splash-open/);
  await page.reload();
  await expect(splash).toHaveCount(0);
});

test('loader keeps progress usable after animation failure and Escape restores focus', async ({ page }) => {
  await page.route('**/animations/sushanth-splash.json', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const splash = page.locator('[data-site-splash]');
  await expect(splash.locator('.site-splash__fallback')).toBeVisible();
  await splash.getByRole('button', { name: 'Skip intro' }).focus();
  await page.keyboard.press('Escape');
  await expect(splash).toBeHidden();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
});

test('loader timeout releases stalled assets without trapping the page', async ({ page }) => {
  test.setTimeout(20000);
  await page.route('**/images/home/robotic-arm-poster.avif', () => {});
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-site-splash]')).toBeHidden({ timeout: 12000 });
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
  await expect(page.locator('html')).not.toHaveClass(/splash-open/);
});
