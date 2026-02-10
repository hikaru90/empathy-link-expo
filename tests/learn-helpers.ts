import type { Page } from '@playwright/test';

/** Scroll element into view via JS (works with nested scroll containers). */
async function scrollIntoView(page: Page, testId: string) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  }, testId);
}

/** Click learn-step-next after ensuring it's visible. Uses id (nativeID) when present for stability. */
async function clickLearnStepNext(page: Page) {
  const byId = page.locator('#learn-step-next').first();
  const hasId = (await byId.count()) > 0;
  const btn = hasId ? byId : page.getByTestId('learn-step-next').first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await btn.click({ force: true });
}

const NEXT_STEP_SELECTOR =
  '[data-testid="learn-step-next"], [data-testid="learn-text-input"], [data-testid="feelings-choose-btn"], [data-testid="multiple-choice-option-0"], [data-testid="sortable-container"], [data-testid="timer-play"], [data-testid="breathe-play"], [data-testid="bodymap-character"]';

/** Wait for next step indicator to appear. If timeout and we are at /learn, step is done. */
async function waitForNextStep(page: Page, timeout = 15000) {
  try {
    await page.locator(NEXT_STEP_SELECTOR).first().waitFor({ state: 'visible', timeout });
  } catch {
    if ((await page.url()).match(/\/learn\/?$/)) return;
  }
}

// ─── Per-component handlers ───────────────────────────────────────────────

/** LearningSummary: click "Zurück zur Lernübersicht" to return to learn list. Waits for navigation so URL is /learn before returning. */
export async function stepLearningSummary(page: Page): Promise<boolean> {
  const btn = page.getByText('Zurück zur Lernübersicht').first();
  await btn.waitFor({ state: 'attached' }).catch(() => {});
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  try {
    await btn.click({ force: true });
  } catch {
    try {
      await btn.evaluate((el: HTMLElement) => el.click());
    } catch {
      // Page may have navigated from first click; do not evaluate on closed page.
    }
  }
  await page.waitForURL(/\/learn\/?$/, { timeout: 10000 }).catch(() => {});
  return true;
}

/** LearnFeelingsDetective step 1 (AI reflection): click next inside step container so we hit the right button. */
async function stepFeelingsDetectiveStep1(page: Page): Promise<boolean> {
  const step1 = page.locator('#learn-feelings-detective-step-1');
  if (!(await step1.isVisible().catch(() => false))) return false;
  const nextBtn = step1.locator('#learn-step-next').first();
  if ((await nextBtn.count()) === 0) {
    const byTestId = step1.getByTestId('learn-step-next').first();
    await byTestId.waitFor({ state: 'visible', timeout: 3000 });
    await byTestId.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    await byTestId.click({ force: true });
  } else {
    await nextBtn.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    await nextBtn.click({ force: true });
  }
  await page.waitForTimeout(400).catch(() => {});
  const step2Now = page.locator('#learn-feelings-detective-step-2');
  if (!(await step2Now.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      const step = document.querySelector('#learn-feelings-detective-step-1');
      const btn = step?.querySelector('[data-testid="learn-step-next"]') || step?.querySelector('#learn-step-next');
      if (btn) (btn as HTMLElement).click();
    }).catch(() => {});
    await page.waitForTimeout(400).catch(() => {});
  }
  await waitForNextStep(page);
  return true;
}

/**
 * LearnFeelingsDetective: handles step 3 (feelings selection) and step 4 (summary).
 * Uses container id learn-feelings-detective-step-3 / step-4. Step 4: always click Weiter INSIDE step4.
 */
export async function stepFeelingsDetective(page: Page): Promise<boolean> {
  const step4 = page.locator('#learn-feelings-detective-step-4');
  if (await step4.isVisible().catch(() => false)) {
    const createBtn = step4.getByText('Zusammenfassung erstellen');
    if (await createBtn.isVisible().catch(() => false)) {
      await step4.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await createBtn.click({ force: true });
      // Button is replaced by spinner; wait for Weiter to appear inside step4 (summary loaded)
      const weiterInStep4 = step4.locator('#learn-step-next').or(step4.getByTestId('learn-step-next'));
      await weiterInStep4.waitFor({ state: 'visible', timeout: 60000 });
    }
    // Click Weiter inside step4 only — never use global selector here
    const nextBtn = step4.locator('#learn-step-next').first();
    const nextByTestId = step4.getByTestId('learn-step-next').first();
    const btn = (await nextBtn.count()) > 0 ? nextBtn : nextByTestId;
    await btn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    await btn.click({ force: true });
    await page.waitForTimeout(500).catch(() => {});
    if (await step4.isVisible().catch(() => false)) {
      await page.evaluate(() => {
        const step = document.querySelector('#learn-feelings-detective-step-4');
        const b = step?.querySelector('[data-testid="learn-step-next"]') || step?.querySelector('#learn-step-next');
        if (b) (b as HTMLElement).click();
      }).catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
    }
    await waitForNextStep(page);
    return true;
  }

  const step3 = page.locator('#learn-feelings-detective-step-3');
  if (!(await step3.isVisible().catch(() => false))) return false;

  await step3.getByTestId('feelings-choose-btn').click({ force: true });
  await page.getByTestId('drawer-overlay').waitFor({ state: 'visible', timeout: 8000 });

  // Expand a category so feeling chips are visible (categories start collapsed)
  const categoryHeader = page.getByTestId('feeling-category-header').first();
  await categoryHeader.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await categoryHeader.isVisible().catch(() => false)) {
    await categoryHeader.click({ force: true });
    await page.waitForTimeout(400);
  }
  const chip = page.getByTestId('feeling-chip').first();
  await chip.waitFor({ state: 'visible', timeout: 10000 });
  await chip.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await chip.click({ force: true });

  await page.getByTestId('drawer-overlay').click({ force: true });
  await page.getByTestId('drawer-overlay').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  const step3Next = step3.locator('#learn-step-next').or(step3.getByTestId('learn-step-next')).first();
  await step3Next.waitFor({ state: 'visible', timeout: 15000 });
  const s3Btn = step3.locator('#learn-step-next').first();
  const s3BtnTestId = step3.getByTestId('learn-step-next').first();
  const step3NextBtn = (await s3Btn.count()) > 0 ? s3Btn : s3BtnTestId;
  await step3NextBtn.scrollIntoViewIfNeeded().catch(() => {});
  await step3NextBtn.click({ force: true });
  await page.waitForTimeout(500).catch(() => {});
  const step4Now = page.locator('#learn-feelings-detective-step-4');
  const advanced = await step4Now.isVisible().catch(() => false);
  if (!advanced) {
    await page.evaluate(() => {
      const step = document.querySelector('#learn-feelings-detective-step-3');
      const btn = step?.querySelector('[data-testid="learn-step-next"]') || step?.querySelector('#learn-step-next');
      if (btn) (btn as HTMLElement).click();
    }).catch(() => {});
    await page.waitForTimeout(500).catch(() => {});
  }
  await waitForNextStep(page, 15000);
  return true;
}

/** LearnAIQuestion, LearnNeedsDetective, LearnNeedsRubiksCube (text input steps): fill and send. */
export async function stepTextInput(page: Page): Promise<boolean> {
  const input = page.getByTestId('learn-text-input');
  if (!(await input.isVisible().catch(() => false))) return false;

  await input.fill('test');
  await page.getByTestId('learn-send').click();
  await page.getByTestId('learn-step-next').waitFor({ state: 'visible', timeout: 15000 });
  return true;
}

/** LearnMultipleChoice: select first option and submit. */
export async function stepMultipleChoice(page: Page): Promise<boolean> {
  const opt = page.getByTestId('multiple-choice-option-0');
  if (!(await opt.isVisible().catch(() => false))) return false;

  await opt.click();
  const submit = page.getByTestId('multiple-choice-submit');
  await submit.waitFor({ state: 'visible', timeout: 3000 });
  await submit.click();
  await waitForNextStep(page, 5000);
  return true;
}

/** LearnSortable: drag each item to its correct bucket. */
export async function stepSortable(page: Page): Promise<boolean> {
  const container = page.getByTestId('sortable-container');
  if (!(await container.isVisible().catch(() => false))) return false;

  const items = page.locator('[data-testid^="sortable-item-"]');
  const count = await items.count();
  const bucketA = page.getByTestId('sortable-bucket-A');
  const bucketB = page.getByTestId('sortable-bucket-B');

  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const testId = await item.getAttribute('data-testid');
    const bucket = testId?.split('--').pop() === 'B' ? 'B' : 'A';
    const target = bucket === 'A' ? bucketA : bucketB;
    await item.dragTo(target, { force: true });
  }

  await scrollIntoView(page, 'learn-step-next');
  await page.getByTestId('learn-step-next').click({ force: true });
  await waitForNextStep(page);
  return true;
}

/** LearnTimer: start and wait for completion (max 65s). */
export async function stepTimer(page: Page): Promise<boolean> {
  const playBtn = page.getByTestId('timer-play');
  if (!(await playBtn.isVisible().catch(() => false))) return false;

  await playBtn.click();
  await page.getByText('Abgeschlossen').waitFor({ state: 'visible', timeout: 65000 });
  await clickLearnStepNext(page);
  await waitForNextStep(page);
  return true;
}

/** LearnBreathe: select shortest duration (15s), start, wait for completion. Timeout covers default 60s if picker fails. */
export async function stepBreathe(page: Page): Promise<boolean> {
  const playBtn = page.getByTestId('breathe-play');
  if (!(await playBtn.isVisible().catch(() => false))) return false;

  const dauerBtn = page.getByText('Dauer').first();
  if (await dauerBtn.isVisible().catch(() => false)) {
    await dauerBtn.click();
    await page.waitForTimeout(400);
    const shortOption = page.getByText('0:15').first();
    if (await shortOption.isVisible().catch(() => false)) {
      await shortOption.click();
      await page.waitForTimeout(300);
    }
  }

  await playBtn.click();
  await page.getByText('Atemübung abgeschlossen!').waitFor({ state: 'visible', timeout: 70000 });
  await page.waitForTimeout(1500);
  await clickLearnStepNext(page);
  await waitForNextStep(page);
  return true;
}

/** LearnBodyMap: click Weiter (splash or map step). */
export async function stepBodyMap(page: Page): Promise<boolean> {
  const char = page.getByTestId('bodymap-character');
  const zeitZuFuehlen = page.getByText('Zeit zu Fühlen');
  if (!(await char.isVisible().catch(() => false)) && !(await zeitZuFuehlen.isVisible().catch(() => false)))
    return false;

  await clickLearnStepNext(page);
  await waitForNextStep(page);
  return true;
}

/** LearnTitleCard, LearnTask, LearnText, LearnImage, etc.: generic Weiter. */
export async function stepGenericWeiter(page: Page): Promise<boolean> {
  const nextBtn = page.getByTestId('learn-step-next');
  if (!(await nextBtn.isVisible().catch(() => false))) return false;

  await clickLearnStepNext(page);
  await waitForNextStep(page);
  return true;
}

// ─── Handler chain (order matters: most specific first) ──────────────────────

const HANDLERS: Array<(page: Page) => Promise<boolean>> = [
  stepLearningSummary,
  stepFeelingsDetective,
  stepFeelingsDetectiveStep1,
  stepTextInput,
  stepMultipleChoice,
  stepSortable,
  stepTimer,
  stepBreathe,
  stepBodyMap,
  stepGenericWeiter,
];

/** Execute one step; returns true if a handler ran. */
export async function stepLearnContent(page: Page): Promise<boolean> {
  for (const handler of HANDLERS) {
    if (await handler(page)) return true;
  }
  return false;
}

/** Click through all steps until back at learn list. Throws if stuck (no handler matched and not at /learn). */
export async function clickThroughLearnContent(page: Page, maxSteps = 100): Promise<void> {
  for (let s = 0; s < maxSteps; s++) {
    if ((await page.url()).match(/\/learn\/?$/)) return;

    const didStep = await stepLearnContent(page);
    if (!didStep) {
      const backBtn = page.getByText('Zurück zur Lernübersicht');
      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click();
        continue;
      }
      await page.getByTestId('tab-learn').first().click().catch(() => {});
      if ((await page.url()).match(/\/learn\/?$/)) return;
      throw new Error(
        `clickThroughLearnContent stuck at step ${s + 1}: no handler matched. URL: ${page.url()}`
      );
    }
  }

  if (!(await page.url()).match(/\/learn\/?$/)) {
    const backBtn = page.getByText('Zurück zur Lernübersicht');
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
    } else {
      await page.getByTestId('tab-learn').first().click();
    }
    if (!(await page.url()).match(/\/learn\/?$/)) {
      throw new Error(
        `clickThroughLearnContent hit maxSteps (${maxSteps}) without reaching /learn. URL: ${page.url()}`
      );
    }
  }
}
