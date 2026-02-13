import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  buildTotalStepsArray,
} from '@/lib/learn/learnBlocks';
import {
  clickThroughLearnContent,
  clickThroughLearnContentWithPlan,
  fetchLearnTopics
} from './learn-helpers';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Clear learn sessions via DELETE. Must use page.request so auth cookies are sent. */
async function clearLearnSessions(page: Page): Promise<void> {
  const res = await page.request.delete(`${BACKEND_URL}/api/learn/sessions`);
  if (!res.ok()) {
    console.warn(`DELETE /api/learn/sessions failed: ${res.status()} ${res.statusText()}`);
  }
}

test.describe('authenticated app', () => {
  test('shows main tabs after login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tab-chat')).toBeVisible();
    await expect(page.getByTestId('tab-stats')).toBeVisible();
    await expect(page.getByTestId('tab-learn')).toBeVisible();
    await expect(page.getByTestId('tab-feedback')).toBeVisible();
  });

  test('navigates to stats', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-stats').click();
    await expect(page).toHaveURL(/stats/);
  });

  test('navigates to learn', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-learn').click();
    await expect(page).toHaveURL(/learn/);
  });

  test('navigates to feedback', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-feedback').click();
    await expect(page).toHaveURL(/feedback/);
  });

  test('stats page loads', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByTestId('tab-stats')).toBeVisible();
  });

  test('learn page loads', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByTestId('tab-learn')).toBeVisible();
  });

  test('all learn courses open and load', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByTestId('tab-learn')).toBeVisible();
    await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 10000 });

    const cardCount = await page.getByTestId('learn-topic-card').count();

    for (let i = 0; i < cardCount; i++) {
      await page.getByTestId('learn-topic-card').nth(i).click();

      // const viewResultsBtn = page.getByTestId('restart-drawer-view-results');
      // if (await viewResultsBtn.isVisible().catch(() => false)) {
      //   await viewResultsBtn.click();
      // }

      await page.waitForLoadState('networkidle');
      
      // await page.getByRole('dialog').getByTestId('drawer-overlay').click();
      // await page.getByText('Wie fühlst du dich eigentlich?Gefühle erkennenWiederholen').nth(1).click();
      // await page.getByTestId('tab-learn').nth(3).click();
      // await page.getByText('Was brauchst du wirklich?Bedürfnisse erkennenWiederholen').nth(2).click();
      // await page.locator('div:nth-child(25) > .r-bottom-1p0dtai.r-left-1d2f490.r-position-1xcajam.r-right-zchlnj.r-top-ipm5af.r-zIndex-sfbmgh > div:nth-child(2) > .css-view-g5y9jx.r-bottom-1p0dtai.r-left-1d2f490.r-position-1xcajam > .css-view-g5y9jx.r-flex-13awgt0.r-top-ipm5af > .css-view-g5y9jx.r-backgroundColor-13w96dm > .css-view-g5y9jx.r-alignSelf-1kihuf0.r-backgroundColor-ianrra > .css-view-g5y9jx.r-gap-1cmwbt1 > div:nth-child(2) > div:nth-child(2) > div > .css-view-g5y9jx > div > img').click();
      // await page.getByTestId('tab-learn').nth(5).click();
      // await page.getByText('Wie gehst du mit dir um?Selbstempathie stärkenWiederholen').nth(3).click();
      // await page.locator('div:nth-child(33) > .r-bottom-1p0dtai.r-left-1d2f490.r-position-1xcajam.r-right-zchlnj.r-top-ipm5af.r-zIndex-sfbmgh > div:nth-child(2) > .css-view-g5y9jx.r-bottom-1p0dtai.r-left-1d2f490.r-position-1xcajam > .css-view-g5y9jx.r-flex-13awgt0.r-top-ipm5af > .css-view-g5y9jx.r-backgroundColor-13w96dm > .css-view-g5y9jx.r-alignSelf-1kihuf0.r-backgroundColor-ianrra > .css-view-g5y9jx.r-gap-1cmwbt1 > div:nth-child(2) > div:nth-child(2) > div > .css-view-g5y9jx > div > img').click();
      // await page.locator('div:nth-child(8) > div > div > div > .css-view-g5y9jx.r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d.r-right-zchlnj.r-zIndex-1sg8ghl > .css-view-g5y9jx.r-backgroundColor-14lw9ot > div:nth-child(3)').click();
      
      // Wait for either navigation to detail page OR restart drawer to appear
      const restartCourseBtn = page.getByTestId('restart-drawer-restart');
      const viewResultsBtn = page.getByTestId('restart-drawer-view-results');

      await Promise.race([
        page.waitForURL(/\/learn\/.+/, { timeout: 5000 }),
        restartCourseBtn.waitFor({ state: 'visible', timeout: 5000 }),
        viewResultsBtn.waitFor({ state: 'visible', timeout: 5000 }),
      ]).catch(() => {});

      if (await restartCourseBtn.isVisible()) {
        await page.waitForTimeout(1000);
        await restartCourseBtn.getByText('Neu starten').click({ force: true });
        await page.waitForLoadState('networkidle');
      } else if (await viewResultsBtn.isVisible()) {
        await page.waitForTimeout(1000);
        await viewResultsBtn.click();
        await page.waitForLoadState('networkidle');
      }
      
      await expect(page).toHaveURL(/\/learn\/.+/);
      await expect(page.getByTestId('learn-detail-content')).toBeVisible({
        timeout: 15000,
      });
      await page.goBack();
      await expect(page).toHaveURL(/\/learn\/?$/);
      await expect(page.getByTestId('learn-list').first()).toBeVisible();
    }
  });

  test('clicks through all learn contents', async ({ page }) => {
    test.setTimeout(300000);
    await clearLearnSessions(page);

    const topics = await fetchLearnTopics();
    const topicsWithContent = topics.filter(
      (t) => t.expand?.currentVersion?.content && Array.isArray(t.expand.currentVersion.content)
    );

    await page.goto('/learn');
    await expect(page.getByTestId('tab-learn')).toBeVisible();
    await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 15000 });

    const cardCount = await page.getByTestId('learn-topic-card').count();
    expect(cardCount).toBeGreaterThan(0);

    const useContentPlan = topicsWithContent.length > 0;

    for (let i = 0; i < cardCount; i++) {
      await page.goto('/learn');
      await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 10000 });

      const card = page.getByTestId('learn-topic-card').nth(i);
      await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await card.evaluate((el: HTMLElement) => (el as HTMLElement).click());
      await page.waitForTimeout(800);

      if (await page.getByTestId('restart-drawer-restart').isVisible().catch(() => false)) {
        await page.getByTestId('restart-drawer-restart').getByText('Neu starten').click({ force: true });
      } else if (await page.getByTestId('restart-drawer-view-results').isVisible().catch(() => false)) {
        await page.getByTestId('restart-drawer-view-results').click();
        await page.waitForURL(/\/learn\/.+/);
        if (useContentPlan) {
          const topic = topicsWithContent.find((t) => page.url().includes(`/learn/${t.slug}`));
          const content = topic?.expand?.currentVersion?.content ?? [];
          const plan = buildTotalStepsArray(content);
          await clickThroughLearnContentWithPlan(page, plan);
        } else {
          await clickThroughLearnContent(page);
        }
        await expect(page).toHaveURL(/\/learn\/?$/);
        await page.waitForTimeout(500);
        const again = page.getByTestId('learn-topic-card').nth(i);
        await again.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await again.evaluate((el: HTMLElement) => (el as HTMLElement).click());
        await page.getByTestId('restart-drawer-restart').waitFor({ state: 'visible', timeout: 5000 });
        await page.getByTestId('restart-drawer-restart').getByText('Neu starten').click({ force: true });
      }

      await page.waitForURL(/\/learn\/.+/);
      await expect(page.getByTestId('learn-detail-content')).toBeVisible({ timeout: 15000 });

      if (useContentPlan) {
        const slug = page.url().match(/\/learn\/([^/?#]+)/)?.[1];
        const topic = topicsWithContent.find((t) => t.slug === slug);
        const content = topic?.expand?.currentVersion?.content ?? [];
        const plan = buildTotalStepsArray(content);
        await clickThroughLearnContentWithPlan(page, plan);
      } else {
        await clickThroughLearnContent(page);
      }
      await expect(page).toHaveURL(/\/learn\/?$/);
    }
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/profile/);
  });

});
