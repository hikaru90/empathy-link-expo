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

  test('should complete the full signup and verification flow', async ({ page, request }) => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const email = `testuser${randomSuffix}@example.com`;
    const password = 'Password123!';
    const name = 'Test User';

    // Log console messages from the page
    page.on('console', msg => {
      console.log(`PAGE LOG: ${msg.text()}`);
    });

    console.log(`Starting signup flow for ${email}`);

    // 1. Sign up
    await page.goto('/signup');
    await page.getByPlaceholder('Name eingeben').fill(name);
    await page.getByPlaceholder('E-Mail eingeben').fill(email);
    await page.getByPlaceholder('Passwort eingeben').fill(password);

    console.log('Clicking signup button...');
    await page.getByTestId('signup-button').click();


    await page.waitForTimeout(2000);
    await expect(page.getByText('Registrierung erfolgreich')).toBeVisible();

    // 3. Get the verification link from our mock API
    console.log(`Fetching verification link for ${email}`);

    let verificationLink: string | null = null;
    const backendUrl = 'http://localhost:4000'; // Try localhost first

    for (let i = 0; i < 10; i++) {
      try {
        const response = await request.get(`${backendUrl}/api/test/last-verification-link?email=${encodeURIComponent(email)}`);
        if (response.ok()) {
          const data = await response.json();
          verificationLink = data.link;
          break;
        } else {
          console.log(`Mock API returned ${response.status()} for ${email}. Retrying...`);
        }
      } catch (e) {
        console.log(`Failed to connect to mock API at ${backendUrl}. Retrying...`);
      }
      await page.waitForTimeout(2000);
    }

    if (!verificationLink) {
      throw new Error(`Could not find verification link for ${email}`);
    }
    console.log(`Found verification link: ${verificationLink}`);

    // 4. Open the verification link
    console.log(`Navigating to verification link...`);
    await page.goto(verificationLink);

    // 5. Wait for successful verification message
    console.log(`Waiting for success message...`);
    // Note: The success message includes "✓ E-Mail erfolgreich bestätigt!"
    await expect(page.getByText('E-Mail erfolgreich bestätigt')).toBeVisible({ timeout: 20000 });
    // Also verify the informative text is shown
    await expect(page.getByText('Du wirst weitergeleitet')).toBeVisible();

    // 6. Wait for auto-redirect to protected area
    console.log(`Waiting for redirect...`);
    
    // Check for onboarding title which appears after redirect
    const welcomeTitle = page.getByText('Willkommen bei Empathy-Link');
    await expect(welcomeTitle).toBeVisible({ timeout: 20000 });

    if (await welcomeTitle.isVisible()) {
      console.log('Onboarding detected, checking content...');
      
      // Verify onboarding content as requested
      await expect(page.getByText('Schön, dass du hier bist. Wir unterstützen dich dabei, klarer und empathischer zu kommunizieren, um dich selbst und andere besser zu verstehen.')).toBeVisible();
      
      console.log('Onboarding content verified, skipping...');
      await page.getByText('Überspringen').click();
    }

    // 7. Verify we are logged in
    console.log(`Verifying login status...`);
    // After skipping onboarding or if not present, Chat should be visible
    // We check for 'Chat' which could be in the header or tab bar
    await expect(page.getByText('Chat')).toBeVisible();

    console.log(`Signup flow completed successfully for ${email}`);
  });
});
