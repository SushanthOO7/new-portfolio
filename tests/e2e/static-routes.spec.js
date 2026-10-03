import { expect, test } from '@playwright/test';

const routes = [
  {
    path: '/projects',
    heading: 'Selected Work',
    content: ['Slice', 'Smart Sparrow', 'Volkihar Knight'],
  },
  {
    path: '/career',
    heading: 'My Career & Experience',
    content: ['The Sparks Foundation', 'Informatica', 'Software QA Engineer'],
  },
  {
    path: '/uses',
    heading: 'Uses',
    content: ['Development', 'Quality & Automation', 'Hardware'],
  },
];

for (const route of routes) {
  test(`${route.path} keeps its primary content without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(route.path);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    for (const text of route.content) await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
    await context.close();
  });
}

test('project cards link to the known project routes', async ({ page }) => {
  await page.goto('/projects');

  await expect(page.getByRole('link', { name: 'View Slice' })).toHaveAttribute('href', '/projects/slice');
  await expect(page.getByRole('link', { name: 'View Smart Sparrow' })).toHaveAttribute('href', '/projects/smart-sparrow');
  await expect(page.getByRole('link', { name: 'View Volkihar Knight' })).toHaveAttribute('href', '/projects/volkihar-knight');
});

test('static routes add no route-specific client scripts or console errors', async ({ page }) => {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  for (const route of routes) {
    await page.goto(route.path);
    await page.waitForLoadState('load');
    const routeScripts = await page.locator('astro-island').count();
    expect(routeScripts).toBe(2);
  }
  expect(errors).toEqual([]);
});
