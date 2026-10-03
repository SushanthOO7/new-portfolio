import { expect, test } from '@playwright/test';

test('lists both articles in date order without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/articles');

  await expect(page.getByRole('heading', { level: 1, name: 'Latest articles' })).toBeVisible();
  const links = page.locator('main article h2 a');
  await expect(links).toHaveText(["You (probably) don't need CSS-in-JS", 'Hello world: how I built this site']);
  await expect(page.getByText('Featured', { exact: true })).toBeVisible();
  await context.close();
});

for (const article of [
  { slug: 'hello-world', heading: 'Hello world: how I built this site', section: 'How it all started' },
  { slug: 'modern-styling-in-react', heading: "You (probably) don't need CSS-in-JS", section: 'Where we are today' },
]) {
  test(`renders ${article.slug} from MDX`, async ({ page }) => {
    const response = await page.goto(`/articles/${article.slug}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: article.heading })).toBeVisible();
    await expect(page.getByRole('heading', { name: article.section })).toBeVisible();
    await expect(page.locator('article time')).toBeVisible();
  });
}

test('unknown article paths return status 404', async ({ page }) => {
  const response = await page.goto('/articles/not-a-real-article');
  expect(response?.status()).toBe(404);
});
