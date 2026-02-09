import { expect, test } from '@playwright/test';

test.describe('authenticated app', () => {
  test('shows main tabs after login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Chat')).toBeVisible();
    await expect(page.getByText('Statistik')).toBeVisible();
    await expect(page.getByText('Lernen')).toBeVisible();
    await expect(page.getByText('Feedback')).toBeVisible();
  });

  test('navigates to stats', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Statistik').click();
    await expect(page).toHaveURL(/stats/);
  });

  test('navigates to learn', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Lernen').click();
    await expect(page).toHaveURL(/learn/);
  });

  test('navigates to feedback', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Feedback').click();
    await expect(page).toHaveURL(/feedback/);
  });

  test('stats page loads', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByText('Statistik')).toBeVisible();
  });

  test('learn page loads', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByText('Lernen')).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/profile/);
  });
});
