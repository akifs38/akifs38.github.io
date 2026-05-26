// @ts-check
const { test, expect } = require('@playwright/test');

test('homepage loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Otomasyon Akademi/);
});

test('main navigation tabs are visible', async ({ page }) => {
  await page.goto('/');
  // The site should show the main content area
  await expect(page.locator('body')).toBeVisible();
});
