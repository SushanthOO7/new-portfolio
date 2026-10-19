import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light']) {
  test(`reveals the home page through the expanding loading pill in ${theme} mode`, async ({ page }, testInfo) => {
    await page.addInitScript(theme => {
      localStorage.setItem('portfolio-theme', theme);
      sessionStorage.clear();
      new MutationObserver(() => {
        const splash = document.querySelector('[data-site-splash]');
        if (splash?.dataset.loadingPhase !== 'exit' || window.splashRevealSample) return;
        const main = document.querySelector('#main-content');
        const reveal = main.getAnimations().find(animation =>
          animation.effect.getKeyframes().some(frame => frame.clipPath));
        if (reveal) {
          reveal.pause();
          reveal.currentTime = 400;
        }
        window.splashRevealSample = {
          clip: getComputedStyle(main).clipPath,
          background: getComputedStyle(splash).backgroundColor,
          inert: main.inert,
        };
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-loading-phase'] });
    }, theme);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => window.splashRevealSample), { timeout: 11000 }).toBeTruthy();
    const sample = await page.evaluate(() => window.splashRevealSample);
    expect(sample.clip).toMatch(/^ellipse\(/);
    expect(sample.background).toBe('rgba(0, 0, 0, 0)');
    expect(sample.inert).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('pill-reveal.png') });
    await expect(page.locator('[data-site-splash]')).toHaveCount(0);
    await expect(page.locator('#main-content')).toHaveCSS('clip-path', 'none');
    await expect(page.locator('#main-content')).not.toHaveAttribute('inert');
    await expect(page.locator('html')).not.toHaveClass(/splash-open/);
  });
}
