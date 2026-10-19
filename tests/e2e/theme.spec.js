import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
});

test('theme switch persists and supports keyboard activation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const toggle = page.getByRole('switch', { name: 'Dark mode' });
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const mode of ['native', 'unsupported', 'failed']) {
  test(`theme reveal recovers with ${mode} transitions`, async ({ page }) => {
    await page.addInitScript(mode => {
      localStorage.setItem('portfolio-theme', 'light');
      if (mode === 'unsupported') document.startViewTransition = undefined;
      if (mode === 'failed') document.startViewTransition = () => { throw new Error('snapshot failed'); };
    }, mode);
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: 'Dark mode' });
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toBeEnabled();
  });
}

test('animates the viewport in both directions and ignores repeated clicks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const toggle = page.getByRole('switch', { name: 'Dark mode' });
  await expect(toggle).toBeEnabled();
  await page.evaluate(() => {
    window.themeWaves = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (options?.pseudoElement?.includes('view-transition')) window.themeWaves.push({ frames, options });
      return animate.call(this, frames, options);
    };
  });
  // Native clicks in one task exercise the lock before React disables the button.
  await toggle.evaluate(button => { if (button instanceof HTMLButtonElement) { button.click(); button.click(); } });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 600));
  await toggle.evaluate(button => { if (button instanceof HTMLButtonElement) button.click(); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toBeEnabled();
  const waves = await page.evaluate(() => window.themeWaves);
  expect(waves).toHaveLength(2);
  expect(waves[0].options.pseudoElement).toBe('::view-transition-new(root)');
  expect(waves[0].frames.clipPath[0]).toBe('circle(0px at 50% 50%)');
  expect(waves[1].options.pseudoElement).toBe('::view-transition-old(root)');
  expect(waves[1].frames.clipPath[1]).toBe('circle(0px at 50% 50%)');
  expect(waves[0].options.duration).toBe(780);
});

for (const failure of ['ready', 'stalled']) {
  test(`releases the switch after a ${failure} snapshot`, async ({ page }) => {
    await page.addInitScript(failure => {
      document.startViewTransition = update => {
        update();
        const ready = failure === 'ready' ? Promise.reject(new Error('snapshot failed')) : new Promise(() => {});
        return { ready, finished: Promise.resolve(), skipTransition() {} };
      };
    }, failure);
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: 'Dark mode' });
    await expect(toggle).toBeEnabled();
    await toggle.evaluate(button => { if (button instanceof HTMLButtonElement) button.click(); });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toBeEnabled({ timeout: 6000 });
  });
}
