import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light']) {
  test(`clean ${theme} Experience has no scenery requests or empty scene spacing`, async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/\/images\/(experience|transition)\//.test(request.url())) requests.push(request.url()); });
    await page.addInitScript(theme => localStorage.setItem('portfolio-theme', theme), theme);
    await page.goto('/');
    await expect(page.locator('[data-experience-entry]')).toHaveCount(4);
    await expect(page.locator('[data-experience-scene], [data-experience-poster]')).toHaveCount(0);
    const layout = await page.locator('#experience').evaluate(section => {
      const heading = section.querySelector('.experience__heading').getBoundingClientRect();
      const content = section.querySelector('.experience__content').getBoundingClientRect();
      const tech = document.querySelector('#tech-stack');
      return { gap: content.top - heading.bottom, sameBackground: getComputedStyle(section).backgroundColor === getComputedStyle(tech).backgroundColor };
    });
    expect(layout.sameBackground).toBe(true);
    expect(layout.gap).toBeCloseTo(40, 0);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('falls back to company text when logos fail', async ({ page }) => {
  await page.route('**/images/companies/*', route => route.abort());
  await page.goto('/');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-company-logo]').first()).toBeHidden();
  const name = page.locator('.experience__company > span').first();
  await expect(name).not.toHaveClass(/sr-only/);
  await expect(name).toBeVisible();
});

test('reduced motion keeps static section marks and native keyboard scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-logo-traveler]')).toBeHidden();
  await expect(page.locator('.experience__static-mark [data-logo-static]')).toBeVisible();
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
});

test('role descriptions remain visible without summary controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('[data-experience-entry]').first();
  await expect(page.locator('.experience__card summary, .experience__card details')).toHaveCount(0);
  await expect(card.locator('.experience__role')).toBeVisible();
  await expect(card.locator('.experience__description')).toBeVisible();
});

test('no JavaScript keeps every role readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.experience__description')).toHaveCount(4);
  for (const description of await page.locator('.experience__description').all()) await expect(description).toBeVisible();
  await context.close();
});

test('cards expose mirrored lava borders and the timeline exposes a shared trail', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('[data-experience-card]');
  await expect(cards).toHaveCount(4);
  await expect(cards.first().locator('[data-lava-border]')).toHaveCount(1);
  await expect(cards.first().locator('[data-lava-beam]')).toHaveCount(1);
  await expect(cards.first().locator('[data-lava-horizontal], [data-lava-vertical]')).toHaveCount(2);
  await expect(page.locator('[data-lava-drop]')).toHaveCount(0);
  await expect(page.locator('[data-timeline-trail]')).toHaveCount(1);
  await expect(cards.nth(0)).toHaveAttribute('data-lava-side', 'left');
  await expect(cards.nth(1)).toHaveAttribute('data-lava-side', 'right');
  const cornerOffsets = await cards.evaluateAll(elements => elements.map(card => {
    const corner = card.querySelector('[data-lava-corner]');
    const point = new DOMPoint(83, 50).matrixTransform(corner.getScreenCTM());
    return Math.abs(point.y - card.getBoundingClientRect().bottom);
  }));
  for (const offset of cornerOffsets) expect(offset).toBeLessThan(2);
});

test('card beams and attached lava animate independently while scroll remains stationary', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
  await page.goto('/');
  await page.locator('a.explore').click();
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[data-lava-beam]')).opacity) === 1);
  const read = () => page.locator('[data-experience-card]').evaluateAll(cards => cards.map(card => ({
    beam: card.querySelector('[data-lava-beam] path').style.strokeDashoffset,
    neck: card.querySelector('[data-lava-neck]').getAttribute('d'),
  })));
  const before = await read();
  const scroll = await page.evaluate(() => scrollY);
  await expect.poll(async () => (await read())[0].beam).not.toBe(before[0].beam);
  await expect.poll(async () => (await read())[0].neck).not.toBe(before[0].neck);
  await expect.poll(async () => {
    const state = await read();
    return state[0].beam !== state[1].beam;
  }).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
});

test('reduced motion keeps the attached corner static and disables beam and ember motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('[data-experience-card]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-lava-border]')).toBeVisible();
  await expect(page.locator('[data-lava-drop]')).toHaveCount(0);
  await expect(card.locator('[data-lava-beam]')).toHaveCSS('opacity', '0');
  await expect(card.locator('[data-lava-embers]')).toBeHidden();
  const pose = await card.locator('[data-lava-body]').getAttribute('d');
  await page.waitForTimeout(250);
  await expect(card.locator('[data-lava-body]')).toHaveAttribute('d', pose);
});

test('paired beams stay synchronized and restart continuously across two cycles', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('portfolio:splash-seen:sushanth-thorben-v1', '1'));
  await page.goto('/');
  await page.locator('a.explore').click();
  await page.waitForFunction(() => document.querySelector('[data-lava-horizontal]').style.strokeDashoffset);
  const result = await page.evaluate(() => new Promise(resolve => {
    const paths = [...document.querySelector('[data-lava-beam]').querySelectorAll('path')];
    const start = performance.now();
    let previous = null, wraps = 0, frames = 0, moving = 0, aligned = true;
    const sample = now => {
      const values = paths.map(path => parseFloat(path.style.strokeDashoffset));
      aligned &&= values[0] === values[1];
      if (previous !== null) {
        frames++;
        if (Math.abs(values[0] - previous) > .01) moving++;
        if (values[0] > previous + 500) wraps++;
      }
      previous = values[0];
      if (now - start < 10800) requestAnimationFrame(sample);
      else resolve({ wraps, aligned, movingFraction: moving / frames });
    };
    requestAnimationFrame(sample);
  }));
  expect(result.aligned).toBe(true);
  expect(result.wraps).toBeGreaterThanOrEqual(2);
  expect(result.movingFraction).toBeGreaterThan(.97);
  await expect(page.locator('[data-lava-drop]')).toHaveCount(0);
});

