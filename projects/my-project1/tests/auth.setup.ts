import { expect, test as setup } from '@playwright/test';
import path from 'path';

// 保存登录状态，避免每次都要登录
setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username/Email').click();
  await page.getByPlaceholder('Username/Email').fill('admin@nocobase.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByTestId('user-center-button')).toBeVisible();

  // 开启配置状态
  await page.evaluate(() => {
    localStorage.setItem('NOCOBASE_DESIGNABLE', 'true');
  });
  await page.context().storageState({
    path: path.resolve(process.env.PROJECT_ROOT || '', 'playwright/.auth/user.json'),
  });
});
