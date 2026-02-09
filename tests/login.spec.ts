import { expect, test } from '@playwright/test';

test.describe('login page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('E-Mail eingeben')).toBeVisible();
    await expect(page.getByPlaceholder('Passwort eingeben')).toBeVisible();
    await expect(page.getByTestId('signin-button')).toBeVisible();
  });

  test('links to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Registrieren').click();
    await expect(page).toHaveURL(/signup/);
  });
});
