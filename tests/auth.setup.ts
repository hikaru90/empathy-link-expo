import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USERNAME and TEST_PASSWORD must be set in .env for e2e tests'
    );
  }

  await page.goto('/login');
  await page.getByPlaceholder('E-Mail eingeben').fill(email);
  await page.getByPlaceholder('Passwort eingeben').fill(password);
  await page.getByTestId('signin-button').click();

  await page.waitForURL((url) => !url.pathname.includes('login'), {
    timeout: 15000,
  });

  // Skip onboarding if visible (so app tests can run)
  const skipBtn = page.getByText('Überspringen');
  if (await skipBtn.isVisible().catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  await page.context().storageState({ path: authFile });
});
