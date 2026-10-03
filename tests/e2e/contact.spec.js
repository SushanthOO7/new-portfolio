import { expect, test } from '@playwright/test';

test('contact content and form remain accessible without JavaScript', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('/contact');
  await expect(page.getByRole('heading',{level:1,name:'Say hello'})).toBeVisible();
  await expect(page.getByLabel('Your email')).toBeVisible();
  await expect(page.getByLabel('Message')).toBeVisible();
  await expect(page.getByRole('button',{name:'Send message'})).toBeVisible();
  await context.close();
});

test('submits an accessible message and announces success', async ({ page }) => {
  await page.route('**/api/contact',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})}));
  await page.goto('/contact');
  await page.getByLabel('Your email').fill('person@example.com');
  await page.getByLabel('Message').fill('Hello from Playwright');
  await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByRole('status')).toHaveText(/Message sent/i);
});

test('renders endpoint validation errors next to their fields', async ({ page }) => {
  await page.route('**/api/contact',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({success:false,errors:{email:'Please enter a valid email address.'}})}));
  await page.goto('/contact');
  await page.getByLabel('Your email').fill('person@example.com');
  await page.getByLabel('Message').fill('Hello');
  await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page.getByLabel('Your email')).toHaveAttribute('aria-invalid','true');
});
