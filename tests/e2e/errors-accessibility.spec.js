import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const topLevelRoutes=['/','/projects','/career','/articles','/uses','/contact'];

test('unknown routes return a branded 404 with one main and one h1', async ({ page }) => {
  const response=await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading',{level:1,name:'404'})).toBeVisible();
  await expect(page.getByText('Error: redacted',{exact:true})).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
});

for(const route of topLevelRoutes){
  test(`${route} has one main, one h1, and no serious accessibility violations`,async({page})=>{
    await page.goto(route);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(results.violations.filter(item=>['serious','critical'].includes(item.impact))).toEqual([]);
  });
}

test('keyboard focus is visible and mobile navigation does not trap it',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip=page.getByRole('link',{name:'Skip to main content'});
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none');

  const toggle=page.locator('#nav-toggle');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).not.toHaveCount(0);
});

test('contact success state leaves a keyboard path back to the site',async({page})=>{
  await page.route('**/api/contact',route=>route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'}));
  await page.goto('/contact');
  await page.getByLabel('Your email').fill('person@example.com');
  await page.getByLabel('Message').fill('Hello');
  await page.getByRole('button',{name:'Send message'}).click();
  const back=page.getByRole('link',{name:'Back to homepage'});
  await expect(back).toBeVisible();
  await back.focus();
  await expect(back).toBeFocused();
});
