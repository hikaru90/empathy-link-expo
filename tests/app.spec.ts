import { expect, test } from '@playwright/test';

import {
  clickThroughLearnContent,
  stepFeelingsDetective,
  stepLearnContent,
  stepTextInput,
} from './learn-helpers';

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

  test('Feelings Detective: step ids 0–4 visible and flow completable', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/learn');
    await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 15000 });
    const cardCount = await page.getByTestId('learn-topic-card').count();
    expect(cardCount).toBeGreaterThan(0);

    const maxTopicsToTry = Math.min(5, cardCount);
    for (let t = 0; t < maxTopicsToTry; t++) {
      await page.goto('/learn');
      await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 10000 });
      const card = page.getByTestId('learn-topic-card').nth(t);
      await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await card.evaluate((el: HTMLElement) => (el as HTMLElement).click());
      await page.waitForTimeout(800);

      if (await page.getByTestId('restart-drawer-restart').isVisible().catch(() => false)) {
        await page.getByTestId('restart-drawer-restart').getByText('Neu starten').click({ force: true });
      } else if (await page.getByTestId('restart-drawer-view-results').isVisible().catch(() => false)) {
        await page.getByTestId('restart-drawer-view-results').click();
        await page.waitForURL(/\/learn\/.+/);
        await clickThroughLearnContent(page);
        await expect(page).toHaveURL(/\/learn\/?$/);
        await page.waitForTimeout(500);
        const again = page.getByTestId('learn-topic-card').nth(t);
        await again.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await again.evaluate((el: HTMLElement) => (el as HTMLElement).click());
        await page.getByTestId('restart-drawer-restart').waitFor({ state: 'visible', timeout: 5000 });
        await page.getByTestId('restart-drawer-restart').getByText('Neu starten').click({ force: true });
      }
      await page.waitForURL(/\/learn\/.+/);
      await expect(page.getByTestId('learn-detail-content')).toBeVisible({ timeout: 15000 });

      let step0Visible = false;
      for (let s = 0; s < 50; s++) {
        const url = await page.url();
        if (/\/learn\/?$/.test(url)) break;
        const step0 = page.locator('#learn-feelings-detective-step-0');
        if (await step0.isVisible().catch(() => false)) {
          step0Visible = true;
          break;
        }
        const didStep = await stepLearnContent(page);
        if (!didStep) break;
        await page.waitForTimeout(300);
      }

      if (!step0Visible) {
        await page.goto('/learn');
        continue;
      }

      await expect(page.locator('#learn-feelings-detective-step-0')).toBeVisible();
      await stepTextInput(page);
      await page.waitForTimeout(500);

      await expect(page.locator('#learn-feelings-detective-step-1')).toBeVisible({ timeout: 15000 });
      await stepLearnContent(page);
      await page.waitForTimeout(500);

      await expect(page.locator('#learn-feelings-detective-step-2')).toBeVisible({ timeout: 10000 });
      await stepTextInput(page);
      await page.waitForTimeout(500);

      await expect(page.locator('#learn-feelings-detective-step-3')).toBeVisible({ timeout: 10000 });
      const didStep3 = await stepFeelingsDetective(page);
      expect(didStep3).toBe(true);
      await page.waitForTimeout(500);

      await expect(page.locator('#learn-feelings-detective-step-4')).toBeVisible({ timeout: 10000 });
      const didStep4 = await stepFeelingsDetective(page);
      expect(didStep4).toBe(true);

      await page.waitForTimeout(500);
      await expect(page.locator('#learn-feelings-detective-step-4')).not.toBeVisible({ timeout: 10000 });
      return;
    }
    test.skip(true, 'No topic with Feelings Detective found in first ' + maxTopicsToTry + ' topics');
  });

  test('all learn courses open and load', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByTestId('tab-learn')).toBeVisible();
    await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 10000 });

    const cardCount = await page.getByTestId('learn-topic-card').count();

    for (let i = 0; i < cardCount; i++) {
      await page.getByTestId('learn-topic-card').nth(i).click();

      const viewResultsBtn = page.getByTestId('restart-drawer-view-results');
      if (await viewResultsBtn.isVisible().catch(() => false)) {
        await viewResultsBtn.click();
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

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/profile/);
  });

  test('all learn modules: complete if in progress, restart, then click through whole content', async ({
    page,
  }) => {
    test.setTimeout(300000);
    await page.goto('/learn');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('learn-list').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('learn-topic-card').first()).toBeVisible({ timeout: 20000 });

    const cardCount = await page.getByTestId('learn-topic-card').count();
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      await expect(page).toHaveURL(/\/learn\/?$/);
      await expect(page.getByTestId('learn-list').first()).toBeVisible();

      const card = page.getByTestId('learn-topic-card').nth(i);
      await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await card.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(500);
      // Use JS click - RN Web overlays can block Playwright's native click
      await card.evaluate((el: HTMLElement) => {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        (el as HTMLElement).click();
      });
      await page.waitForTimeout(800);

      const restartBtn = page.getByTestId('restart-drawer-restart');
      const viewResultsBtn = page.getByTestId('restart-drawer-view-results');
      // Wait deterministically: drawer (restart or view-results) or navigation to detail
      await restartBtn.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
      if (!(await restartBtn.isVisible().catch(() => false))) {
        await viewResultsBtn.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
      }
      if (
        !(await restartBtn.isVisible().catch(() => false)) &&
        !(await viewResultsBtn.isVisible().catch(() => false))
      ) {
        await page.waitForURL(/\/learn\/.+/, { timeout: 15000 }).catch(() => {});
      }
      if (
        !(await restartBtn.isVisible().catch(() => false)) &&
        !(await viewResultsBtn.isVisible().catch(() => false)) &&
        !(await page.url()).match(/\/learn\/.+/)
      ) {
        await card.click({ force: true });
        await page.waitForTimeout(500);
        await restartBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        if (!(await restartBtn.isVisible().catch(() => false))) {
          await viewResultsBtn.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
        }
        if (
          !(await restartBtn.isVisible().catch(() => false)) &&
          !(await viewResultsBtn.isVisible().catch(() => false))
        ) {
          await page.waitForURL(/\/learn\/.+/, { timeout: 10000 });
        }
        if (
          !(await restartBtn.isVisible().catch(() => false)) &&
          !(await viewResultsBtn.isVisible().catch(() => false)) &&
          !(await page.url()).match(/\/learn\/.+/)
        ) {
          throw new Error(
            `Topic ${i + 1}/${cardCount}: click did not open topic. URL: ${page.url()}. ` +
              `Check: 1) Backend (PocketBase) running? 2) Card visible and not covered?`
          );
        }
      }

      if (await restartBtn.isVisible().catch(() => false)) {
        // Completed: click "Neu starten" (prefer over "Ergebnisse ansehen")
        await restartBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        // Click the button text – scoped to drawer to avoid hitting overlay
        await restartBtn.getByText('Neu starten').click({ force: true });
      } else if (await viewResultsBtn.isVisible().catch(() => false)) {
        // Fallback: "Ergebnisse ansehen" → go to topic, then back, then reopen and restart
        await viewResultsBtn.click();
        await page.waitForURL(/\/learn\/.+/, { timeout: 10000 });
        await clickThroughLearnContent(page);
        await expect(page).toHaveURL(/\/learn\/?$/);
        await page.waitForTimeout(500);
        const cardAgain = page.getByTestId('learn-topic-card').nth(i);
        await cardAgain.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await cardAgain.evaluate((el: HTMLElement) => (el as HTMLElement).click());
        await page.getByTestId('restart-drawer-restart').waitFor({ state: 'visible', timeout: 5000 });
        const replayRestart = page.getByTestId('restart-drawer-restart');
        await replayRestart.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await replayRestart.getByText('Neu starten').click({ force: true });
      } else {
        // In progress or no session: we're already on detail page
        // Complete to end first, then back, then reopen to get restart drawer
        await clickThroughLearnContent(page);
        await expect(page).toHaveURL(/\/learn\/?$/);
        await expect(page.getByTestId('learn-list').first()).toBeVisible();
        const cardAgain = page.getByTestId('learn-topic-card').nth(i);
        await cardAgain.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await cardAgain.evaluate((el: HTMLElement) => (el as HTMLElement).click());
        await page.getByTestId('restart-drawer-restart').waitFor({ state: 'visible', timeout: 5000 });
        const replayRestartBtn = page.getByTestId('restart-drawer-restart');
        await replayRestartBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await replayRestartBtn.getByText('Neu starten').click({ force: true });
      }

      await page.waitForURL(/\/learn\/.+/, { timeout: 10000 });
      await expect(page.getByTestId('learn-detail-content')).toBeVisible({ timeout: 15000 });

      await clickThroughLearnContent(page);
      await expect(page).toHaveURL(/\/learn\/?$/);
    }
  });
});
