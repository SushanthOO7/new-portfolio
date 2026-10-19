import { expect, test } from '@playwright/test';

const skipSplash = async page => {
  await page.addInitScript(() =>
    sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1')
  );
};

const waitForRain = async canvas => {
  await expect.poll(() => canvas.evaluate(node => {
    if (!node.width || !node.height) return false;
    const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) return true;
    }
    return false;
  })).toBe(true);
};

test('keeps contact content and contains the data rain behind it', async ({ page }) => {
  await skipSplash(page);
  await page.goto('/');
  const contact = page.locator('#contact');
  await contact.scrollIntoViewIfNeeded();

  await expect(page.getByRole('heading', { level: 2, name: 'Contact' })).toBeVisible();
  await expect(contact.getByRole('link', { name: 'sushanth@example.com' })).toHaveAttribute(
    'href',
    'mailto:sushanth@example.com'
  );
  await expect(contact.locator('.contact__grid, .contact__routes')).toHaveCount(0);
  await expect(contact.locator('[data-data-rain]')).toHaveCount(1);
  await expect(contact.locator('canvas')).toHaveCount(2);

  const layers = await contact.evaluate(section => {
    const rain = section.querySelector('[data-data-rain]');
    const content = section.querySelector('.contact__content');
    const sectionRect = section.getBoundingClientRect();
    const rainRect = rain.getBoundingClientRect();
    return {
      contained:
        Math.abs(sectionRect.left - rainRect.left) < 1 &&
        Math.abs(sectionRect.right - rainRect.right) < 1 &&
        Math.abs(sectionRect.top - rainRect.top) < 1 &&
        Math.abs(sectionRect.bottom - rainRect.bottom) < 1,
      rainZ: Number(getComputedStyle(rain).zIndex),
      contentZ: Number(getComputedStyle(content).zIndex),
    };
  });
  expect(layers.contained).toBe(true);
  expect(layers.contentZ).toBeGreaterThan(layers.rainZ);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('uses theme palettes and orange only for contact pointer interaction', async ({ page }) => {
  await skipSplash(page);
  await page.goto('/');
  const contact = page.locator('#contact');
  await contact.scrollIntoViewIfNeeded();
  const rain = contact.locator('[data-data-rain]');
  await expect(rain).toBeVisible();
  const canvas = contact.locator('[data-data-rain-canvas]');
  await waitForRain(canvas);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect(rain).toHaveCSS('--dr-core', '#171717');
  await expect(rain).toHaveCSS('--dr-hot', '#e84400');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(rain).toHaveCSS('--dr-core', '#f2f2ee');
  await expect(rain).toHaveCSS('--dr-hot', '#ff4d00');

  const box = await contact.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => canvas.evaluate(canvas => {
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let orange = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      if (pixels[index] > pixels[index + 1] * 1.6 && pixels[index] > pixels[index + 2] * 2 && pixels[index + 3] > 15) orange++;
    }
    return orange;
  }), { timeout: 5000 }).toBeGreaterThan(0);
});

test('pauses offscreen and renders one stable reduced-motion frame', async ({ browser }) => {
  for (const options of [{}, { reducedMotion: 'reduce' }]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await skipSplash(page);
    await page.goto('/');
    const contact = page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();
    const canvas = contact.locator('[data-data-rain-canvas]');
    await expect(canvas).toBeVisible();
    await waitForRain(canvas);
    const pixels = () => canvas.evaluate(node => node.toDataURL());
    const first = await pixels();
    await page.waitForTimeout(250);
    const second = await pixels();
    if (options.reducedMotion) expect(second).toBe(first);
    else expect(second).not.toBe(first);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const offscreen = await pixels();
    await page.waitForTimeout(250);
    expect(await pixels()).toBe(offscreen);
    await context.close();
  }
});

test('keeps contact usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const contact = page.locator('#contact');
  await contact.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { level: 2, name: 'Contact' })).toBeVisible();
  await expect(contact.getByRole('link', { name: 'sushanth@example.com' })).toBeVisible();
  await context.close();
});
