import { expect, test } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'onboardingCompleted';

test.describe('onboarding', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Clear onboarding state so modal shows (requires being logged in first)
    // We need auth + no onboarding: run a minimal login then clear storage
    const email = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.getByPlaceholder('E-Mail eingeben').fill(email);
    await page.getByPlaceholder('Passwort eingeben').fill(password);
    await page.getByTestId('signin-button').click();
    await page.waitForURL((url) => !url.pathname.includes('login'), {
      timeout: 15000,
    });

    // Clear onboarding so modal appears
    await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_STORAGE_KEY);
    await page.reload();
    await expect(page.getByText('Willkommen bei Empathy-Link')).toBeVisible({ timeout: 10000 });
  });

  test('shows onboarding modal', async ({ page }) => {
    await expect(page.getByText('Willkommen bei Empathy-Link')).toBeVisible();
    await expect(page.getByText('Überspringen')).toBeVisible();
  });

  test('skip closes onboarding', async ({ page }) => {
    await page.getByText('Überspringen').click();
    await expect(page.getByText('Willkommen bei Empathy-Link')).not.toBeVisible();
    await expect(page.getByText('Chat')).toBeVisible();
  });

  test('can go through steps with Weiter', async ({ page }) => {
    await expect(page.getByText('Willkommen bei Empathy-Link')).toBeVisible();
    await page.getByText('Weiter').click();
    await expect(page.getByText('Was möchtest du erreichen?')).toBeVisible();
    await page.getByText('Weiter').click();
    await expect(page.getByText('Empathie lohnt sich')).toBeVisible();
  });

  test('Los geht\'s completes onboarding', async ({ page }) => {
    // Go through all steps to reach the last one
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByText('Weiter');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }
    await page.getByText("Los geht's").click();
    await expect(page.getByText('Willkommen bei Empathy-Link')).not.toBeVisible();
    await expect(page.getByText('Chat')).toBeVisible();
  });
});