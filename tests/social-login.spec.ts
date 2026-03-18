import { expect, test } from '@playwright/test';

test.describe('social login initiation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('google sign-in uses callbackURL /login', async ({ page }) => {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND;
    if (!backendUrl) {
      throw new Error('EXPO_PUBLIC_BACKEND must be set for e2e tests (use your Tailscale URL for local dev).');
    }

    let seenRequest = false;
    let callbackURL: string | null = null;

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(backendUrl)) return;
      if (!url.includes('/api/auth/') || !url.includes('sign-in') || !url.includes('social')) return;
      seenRequest = true;
      try {
        const body = req.postDataJSON?.() as any;
        if (body?.callbackURL) callbackURL = String(body.callbackURL);
      } catch {
        // ignore if body isn't JSON
      }
    });

    await page.goto('/login');
    await page.getByText('Mit Google anmelden').click();

    await expect
      .poll(
        () => ({
          seenRequest,
          callbackURL,
        }),
        { timeout: 10_000 }
      )
      .toMatchObject({ seenRequest: true });

    // Web callback should be absolute and end with /login (matches frontend config + provider allowlist)
    expect(callbackURL).toBeTruthy();
    expect(callbackURL).toContain('/login');
  });
});

