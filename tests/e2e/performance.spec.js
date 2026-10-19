import { expect, test } from '@playwright/test';

// Catch a loader that reports completion before critical images are drawable.
test('splash waits for image decoding before revealing a prepared scroll layout', async ({ page }) => {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.releaseHeroDecode = () => {};
    const held = new Promise(resolve => { window.releaseHeroDecode = resolve; });
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (this.closest('[data-cinematic-hero]')) {
        window.heroDecodeStarted = true;
        await held;
      }
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.heroDecodeStarted)).toBe(true);
  await expect(page.locator('[data-site-splash]')).toHaveAttribute('data-loading-phase', 'loading');
  expect(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeLessThan(100);
  await page.evaluate(() => window.releaseHeroDecode());
  await expect(page.locator('[data-site-splash]')).toHaveCount(0, { timeout: 12000 });
  await expect(page.locator('html')).toHaveAttribute('data-scroll-ready', 'true');
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert');
});

// Catch permanent offscreen GSAP loops competing with the visible section.
test('experience effects sleep offscreen and resume on entry', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
  await page.goto('/');
  const card = page.locator('[data-experience-card]').first();
  const read = () => card.locator('[data-lava-beam] path').first().evaluate(path => path.style.strokeDashoffset);
  await page.waitForTimeout(300);
  const before = await read();
  await page.waitForTimeout(350);
  expect(await read()).toBe(before);
  await page.locator('a.explore').click();
  await expect.poll(() => card.evaluate(el => el.getBoundingClientRect().top < innerHeight)).toBe(true);
  await expect.poll(read).not.toBe(before);
  await page.evaluate(() => { location.hash = 'main-content'; });
  await expect.poll(() => card.evaluate(el => el.getBoundingClientRect().top >= innerHeight)).toBe(true);
  await page.waitForTimeout(300);
  const resting = await read();
  await page.waitForTimeout(350);
  expect(await read()).toBe(resting);
});

test('warms section artwork and reuses animation data on entry', async ({ page }) => {
  let animationRequests = 0;
  page.on('request', request => { if (request.url().endsWith('/animations/projects-title.json')) animationRequests++; });
  await page.goto('/');
  await expect.poll(() => page.locator('[data-company-logo]').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect.poll(() => animationRequests).toBe(1);
  await expect.poll(() => page.evaluate(() => {
    const island = document.querySelector('#tech-stack astro-island');
    return performance.getEntriesByType('resource').some(entry => new URL(entry.name).pathname === island.getAttribute('component-url'));
  })).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('[data-site-splash]')).toHaveCount(0, { timeout: 12000 });
  await page.evaluate(() => { location.hash = 'projects'; });
  await expect(page.locator('[data-title-name="Projects"]')).toHaveAttribute('data-ready', 'true');
  expect(animationRequests).toBe(1);
});

test('data-saving connections skip optional section downloads', async ({ page }) => {
  const optionalRequests = [];
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', {
    configurable: true, value: { saveData: true, effectiveType: '4g' },
  }));
  page.on('request', request => {
    if (/projects-title\.json|TechStackOrbit\.[^/]+\.js/.test(request.url())) optionalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('[data-site-splash]')).toHaveCount(0, { timeout: 12000 });
  expect(optionalRequests).toEqual([]);
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert');
});
