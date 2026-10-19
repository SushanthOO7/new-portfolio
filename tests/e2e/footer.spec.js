import { expect, test } from '@playwright/test';

const skipSplash = async page => {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
};

test('footer reuses the header brand with separate right-aligned social icons', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const rail = page.locator('[data-social-rail]');
  await expect(rail).toHaveCSS('position', 'absolute');
  expect(await rail.evaluate(el => el.parentElement.matches('[data-cinematic-hero]'))).toBe(true);
  if (page.viewportSize().width > 768) {
    const box = await rail.boundingBox();
    expect(box.x + box.width).toBeLessThan(page.viewportSize().width / 2);
  }
  const footer = page.getByRole('contentinfo');
  const brand = footer.getByRole('link', { name: 'Sushanth — back to top' });
  await brand.scrollIntoViewIfNeeded();
  await expect(rail).not.toBeInViewport();
  const socials = footer.getByRole('navigation', { name: 'Footer social links' });
  await expect(socials.getByRole('link')).toHaveCount(4);
  await expect(footer.locator('.site-footer__copyright')).toHaveText(`© ${new Date().getFullYear()} Sushanth U V. All rights reserved.`);
  expect(await footer.locator('.site-footer__mark path').getAttribute('d')).toBe(await page.locator('.brand__mark path').getAttribute('d'));
  expect(await footer.locator('.site-footer__wordmark path').getAttribute('d')).toBe(await page.locator('#brand-wordmark-clip path').getAttribute('d'));
  const footerGitHub = socials.getByRole('link', { name: 'GitHub', exact: true });
  expect(await footerGitHub.locator('path').getAttribute('d')).not.toBe(await rail.getByRole('link', { name: 'GitHub', exact: true, includeHidden: true }).locator('path').getAttribute('d'));
  await expect(footerGitHub).toHaveAttribute('target', '_blank');
  await expect(socials.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/sushanth-u-v-7899911a7');
  await expect(socials.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:sushanth.2942000@gmail.com');
  await expect(socials.getByRole('link', { name: 'Phone' })).toHaveAttribute('href', 'tel:+917022883568');
  const row = await footer.locator('.site-footer__row').boundingBox();
  const actionsBox = await footer.locator('.site-footer__actions').boundingBox();
  const brandBox = await brand.boundingBox();
  expect(Math.abs(actionsBox.x + actionsBox.width - row.x - row.width)).toBeLessThan(2);
  expect(brandBox.x).toBeLessThan(actionsBox.x);
  expect(Math.abs(brandBox.y + brandBox.height / 2 - actionsBox.y - actionsBox.height / 2)).toBeLessThan(2);
  for (const [theme, ink] of [['light', 'rgb(23, 23, 23)'], ['dark', 'rgb(242, 242, 238)']]) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await expect(socials).toHaveCSS('color', ink);
    await expect(brand).toHaveCSS('color', ink);
  }
  await brand.focus();
  await page.keyboard.press('Tab');
  await expect(footerGitHub).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('footer places the text back-to-top link below the social handles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('#experience').getByRole('link', { name: 'Back to top' })).toHaveCount(0);

  const footer = page.getByRole('contentinfo');
  const socials = footer.getByRole('navigation', { name: 'Footer social links' });
  const backToTop = footer.getByRole('link', { name: 'Back to top', exact: true });
  await footer.scrollIntoViewIfNeeded();
  await expect(backToTop).toHaveAttribute('href', '#main-content');

  const socialBox = await socials.boundingBox();
  const backToTopBox = await backToTop.boundingBox();
  expect(backToTopBox.y).toBeGreaterThanOrEqual(socialBox.y + socialBox.height);
  expect(Math.abs(backToTopBox.x + backToTopBox.width - socialBox.x - socialBox.width)).toBeLessThan(2);
});

test('footer loops, follows themes, resumes, and returns to top', async ({ page }) => {
  await skipSplash(page);
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer).toHaveCount(1);
  expect(await footer.evaluate(el => !el.closest('main'))).toBe(true);
  const title = footer.locator('[data-title-animation]');
  await title.evaluate(root => {
    window.__footerTiming = { visible: undefined, playing: undefined, loops: [] };
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && window.__footerTiming.visible === undefined) {
        window.__footerTiming.visible = performance.now();
      }
    });
    visibility.observe(root);
    new MutationObserver(() => {
      const timing = window.__footerTiming;
      if (root.dataset.playback === 'playing' && timing.playing === undefined) timing.playing = performance.now();
      const loop = Number(root.dataset.loopCount);
      if (loop > timing.loops.length) timing.loops.push(performance.now());
    }).observe(root, { attributes: true });
  });
  await footer.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await expect(title).toHaveCSS('color', 'rgb(23, 23, 23)');
  await expect(title).toHaveCSS('filter', 'none');
  await expect.poll(() => title.getAttribute('data-loop-count'), { timeout: 16000 }).toBe('2');
  const timing = await page.evaluate(() => window.__footerTiming);
  expect(timing.playing - timing.visible).toBeGreaterThanOrEqual(1900);
  expect(timing.playing - timing.visible).toBeLessThan(2900);
  expect(timing.loops[0] - timing.playing).toBeGreaterThan(2700);
  expect(timing.loops[0] - timing.playing).toBeLessThan(3400);
  expect(timing.loops[1] - timing.loops[0]).toBeGreaterThan(2700);
  expect(timing.loops[1] - timing.loops[0]).toBeLessThan(3400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(title).toHaveAttribute('data-playback', 'paused');
  await footer.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-playback', 'playing');
  await expect(footer.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:sushanth.2942000@gmail.com');
  await expect(footer.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/SushanthOO7');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await footer.getByRole('link', { name: 'Sushanth — back to top' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});

test('reduced motion and disabled JavaScript retain static name', async ({ browser }) => {
  for (const options of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const requests = [];
    page.on('request', request => { if (request.url().includes('sushanth-splash.json')) requests.push(request.url()); });
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole('img', { name: 'Sushanth', exact: true })).toBeVisible();
    await expect(footer.locator('[data-title-poster]')).toBeVisible();
    expect(requests).toEqual([]);
    await context.close();
  }
});

test('animation failure leaves usable footer', async ({ page }) => {
  await skipSplash(page);
  await page.route('**/animations/sushanth-splash.json', route => route.abort());
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('[data-title-animation]')).toHaveAttribute('data-playback', 'fallback');
  await expect(footer.locator('[data-title-poster]')).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Email' })).toBeVisible();
});
