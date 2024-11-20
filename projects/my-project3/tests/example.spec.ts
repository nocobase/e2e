import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 3000);
  });
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/NocoBase/);
});
