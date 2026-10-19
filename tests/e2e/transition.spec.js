import { expect, test } from '@playwright/test';

const traveler = '[data-logo-traveler]';
async function ready(page, path = '/') {
  await page.addInitScript(() =>
    sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1')
  );
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-logo-journey', 'active');
}
async function state(page) {
  return page.evaluate(() => {
    const content = document.querySelector('[data-journey-content]');
    const mark = document.querySelector('[data-logo-traveler]');
    const rect = mark.getBoundingClientRect();
    return {
      input: scrollY,
      max: document.documentElement.scrollHeight - innerHeight,
      camera: -new DOMMatrixReadOnly(getComputedStyle(content).transform).m42,
      heroTop: document.querySelector('[data-cinematic-hero]').getBoundingClientRect()
        .top,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      rotation: Number(mark.style.transform.match(/rotate\(([-\d.]+)/)?.[1] || 0),
      stage: mark.dataset.stage,
    };
  });
}
async function distance(page, selector) {
  return page.locator(selector).evaluate(target => {
    const a = target.getBoundingClientRect();
    const b = document.querySelector('[data-logo-traveler]').getBoundingClientRect();
    return Math.hypot(
      a.left + a.width / 2 - b.left - b.width / 2,
      a.top + a.height / 2 - b.top - b.height / 2
    );
  });
}

test('starts at the navbar without a second hero logo or a blank scroll viewport', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await expect(page.locator('[data-journey-scroll]')).toHaveAttribute(
    'data-journey-active',
    ''
  );
  await expect(page.locator('.hero__logo-dock, .projects__logo-dock')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { level: 1, name: 'I build what’s next.' })
  ).toBeVisible();
  await expect.poll(() => distance(page, '[data-logo-anchor="hero"]')).toBeLessThan(3);
  await expect(page.locator(traveler)).toHaveCSS('pointer-events', 'none');
  expect(errors).toEqual([]);
});

test('holds the hero while small wheel gestures slowly move and rotate the logo', async ({
  page,
}) => {
  await ready(page);
  const before = await state(page);
  await page.mouse.wheel(0, 120);
  await expect.poll(async () => (await state(page)).input).toBeGreaterThan(20);
  await expect.poll(async () => (await state(page)).rotation).toBeGreaterThan(0.05);
  const after = await state(page);
  expect(Math.abs(after.camera)).toBeLessThan(0.5);
  expect(Math.abs(after.heroTop)).toBeLessThan(0.5);
  expect(after.x).toBeGreaterThan(before.x);
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(
    after.input / 1.16 + 3
  );
  expect(after.rotation).toBeLessThan(10);
});

test('advances the camera during descent, docks inside Tech Stack upright, and reverses', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() =>
    scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.6)
  );
  await expect
    .poll(async () => (await state(page)).camera, { timeout: 8000 })
    .toBeGreaterThan(1000);
  const middle = await state(page);
  expect(middle.camera).toBeLessThan(middle.input);
  expect(middle.y).toBeGreaterThan(0);
  expect(middle.y).toBeLessThan(await page.evaluate(() => innerHeight));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(() => distance(page, '[data-logo-anchor="tech-stack"]'), { timeout: 8000 })
    .toBeLessThan(3);
  await expect
    .poll(
      async () =>
        Math.abs(
          (await state(page)).rotation -
            Math.round((await state(page)).rotation / 360) * 360
        ),
      { timeout: 8000 }
    )
    .toBeLessThan(0.5);
  await expect(page.locator('html')).toHaveAttribute('data-logo-orbit-owned', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-logo-footer-owned');
  await expect(page.locator('[data-logo-anchor="footer"]')).toHaveCSS(
    'visibility',
    'visible'
  );
  await expect
    .poll(
      async () => {
        // Hydrated sections can grow after the initial end-of-page gesture.
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const current = await state(page);
        const maxCamera = await page
          .locator('[data-journey-content]')
          .evaluate(node => node.getBoundingClientRect().height - innerHeight);
        return Math.abs(current.camera - maxCamera);
      },
      { timeout: 8000 }
    )
    .toBeLessThan(1);
  const end = await state(page);
  await page.evaluate(() => scrollTo(0, scrollY - 200));
  await expect
    .poll(async () => Math.abs((await state(page)).camera - (end.camera - 200)))
    .toBeLessThan(2);
  expect((await state(page)).rotation).toBeCloseTo(end.rotation, 1);
  expect(await distance(page, '[data-logo-anchor="tech-stack"]')).toBeLessThan(3);
  await page.evaluate(() => scrollTo(0, 0));
  await expect
    .poll(() => distance(page, '[data-logo-anchor="hero"]'), { timeout: 8000 })
    .toBeLessThan(3);
  await expect.poll(async () => (await state(page)).camera).toBeLessThan(0.5);
});

test('maps navigation links into the cinematic scroll clock', async ({ page }, info) => {
  await ready(page);
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('navigation', { name: 'Mobile primary' })
      .getByRole('link', { name: 'CONTACT' })
      .click();
  } else {
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'CONTACT' })
      .click();
  }
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole('heading', { name: 'Contact', exact: true })
  ).toBeInViewport({ timeout: 8000 });
  await expect
    .poll(
      () =>
        page
          .locator('#contact')
          .evaluate(node => Math.abs(node.getBoundingClientRect().top)),
      { timeout: 8000 }
    )
    .toBeLessThan(8);
});

test('restores deep links into the correct section without replaying the whole journey', async ({
  page,
}) => {
  await ready(page, '/#projects');
  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true })
  ).toBeInViewport({ timeout: 8000 });
  expect((await state(page)).camera).toBeGreaterThan(1000);
});

test('restores ordinary scrolling and static marks for reduced motion', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() =>
    scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.5)
  );
  await expect.poll(async () => (await state(page)).camera).toBeGreaterThan(100);
  await expect
    .poll(async () => {
      const a = await state(page);
      await page.waitForTimeout(150);
      return Math.abs((await state(page)).camera - a.camera);
    })
    .toBeLessThan(1);
  const before = (await state(page)).camera;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-journey-scroll]')).not.toHaveAttribute(
    'data-journey-active'
  );
  await expect(page.locator('[data-journey-content]')).toHaveCSS('transform', 'none');
  await expect(page.locator(traveler)).toBeHidden();
  await expect(page.locator('[data-logo-anchor="hero"]')).toHaveCSS(
    'visibility',
    'visible'
  );
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(80);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator(traveler)).toHaveCount(1);
  await expect(page.locator('[data-journey-scroll]')).toHaveAttribute(
    'data-journey-active',
    ''
  );
});

test('remeasures disclosures and viewport changes without duplicate overlays or overflow', async ({
  page,
}) => {
  await ready(page);
  await page.goto('/#experience');
  await expect(page.locator('[data-journey-scroll]')).toHaveAttribute(
    'data-journey-active',
    ''
  );
  await page.locator('[data-experience-entry] summary').first().focus();
  await page.keyboard.press('Enter');
  await page.setViewportSize({ width: 820, height: 900 });
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(() => distance(page, '[data-logo-anchor="tech-stack"]'), { timeout: 8000 })
    .toBeLessThan(4);
  await expect(page.locator(traveler)).toHaveCount(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
  ).toBe(true);
});

test('keeps all content and normal page flow without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-journey-scroll]')).not.toHaveAttribute(
    'data-journey-active'
  );
  await expect(
    page.getByRole('heading', { name: 'Experience', exact: true })
  ).toBeVisible();
  await expect(page.locator('[data-logo-anchor="hero"]')).toBeVisible();
  await page.locator('[data-site-footer]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-logo-anchor="footer"]')).toBeInViewport();
  await context.close();
});

test('preserves fragment focus for the keyboard skip link', async ({ page }) => {
  await ready(page);
  const link = page.getByRole('link', { name: 'Skip to main content' });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
