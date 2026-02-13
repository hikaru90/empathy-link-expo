import type { Page } from '@playwright/test';

const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ?? 'https://pbempathy.clustercluster.de';

export interface LearnTopic {
  id: string;
  slug: string;
  expand?: {
    currentVersion?: {
      id: string;
      content?: any[];
    };
  };
}

/** Fetch topics with content from PocketBase. Returns empty array if fetch fails. */
export async function fetchLearnTopics(): Promise<LearnTopic[]> {
  try {
    const url = `${POCKETBASE_URL.replace(/\/$/, '')}/api/collections/topics/records?expand=currentVersion,currentVersion.category&sort=order&perPage=500`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.items ?? data;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

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
  console.log('stepFeelingsDetectiveStep1');
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
  console.log('stepFeelingsDetective3/4');
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

  // Wait for feelings to load (category headers or chips appear)
  await page.waitForTimeout(800);

  // Expand all categories so feeling chips are visible (categories start collapsed)
  const categoryHeaders = page.getByTestId('feeling-category-header');
  const headerCount = await categoryHeaders.count();
  for (let i = 0; i < headerCount; i++) {
    const h = categoryHeaders.nth(i);
    if (await h.isVisible().catch(() => false)) {
      await h.click({ force: true });
      await page.waitForTimeout(300);
    }
  }

  const chip = page.getByTestId('feeling-chip').first();
  await chip.waitFor({ state: 'visible', timeout: 10000 });
  await chip.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
  await chip.click({ force: true });
  await page.waitForTimeout(500);

  // Close drawer by clicking overlay in the dark area (top of screen)
  const overlay = page.getByTestId('drawer-overlay');
  await overlay.click({ position: { x: 100, y: 100 }, force: true });
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

/** LearnAIQuestion, LearnNeedsDetective, LearnNeedsRubiksCube, LearnFeelingsDetective step 0/2 (text input steps): fill and send. */
export async function stepTextInput(page: Page): Promise<boolean> {
  console.log('stepTextInput');
  const input = page.getByTestId('learn-text-input');
  if (!(await input.isVisible().catch(() => false))) return false;

  await input.click();
  await input.pressSequentially('test', { delay: 50 });
  await page.waitForTimeout(150);
  await page.getByTestId('learn-send').click();
  await page.getByTestId('learn-step-next').waitFor({ state: 'visible', timeout: 20000 });
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

  const bucketA = page.getByTestId('sortable-dropzone-A');
  const bucketB = page.getByTestId('sortable-dropzone-B');

  // Helper to drag an item to a bucket
  const dragItemToBucket = async (itemTestId: string, bucket: 'A' | 'B', offsetCount = 0) => {
    const item = page.locator(`[data-testid="${itemTestId}"]`).first();
    const target = bucket === 'A' ? bucketA : bucketB;
    
    await scrollIntoView(page, itemTestId);
    await page.waitForTimeout(400);

    const itemBox = await item.boundingBox();
    const targetBox = await target.boundingBox();

    if (itemBox && targetBox) {
      console.log(`[Sortable] Dragging "${itemTestId}" to Bucket ${bucket} (Offset: ${offsetCount})`);
      
      // 1. Pick up from center
      await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);

      // 2. Small "wiggle" to trigger gesture activation
      await page.mouse.move(itemBox.x + itemBox.width / 2 + 5, itemBox.y + itemBox.height / 2 + 5);
      await page.waitForTimeout(100);

      // 3. Move to target center (well within the container)
      const destX = targetBox.x + (targetBox.width / 2) + (offsetCount * 10);
      const destY = targetBox.y + (targetBox.height / 2);
      
      await page.mouse.move(destX, destY, { steps: 20 });
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(800); // Allow for state update
    }
  };

  // 1. Get all items initially
  const allItems = await page.locator('[data-testid^="sortable-item-"]').all();
  const itemData: Array<{ testId: string }> = [];
  for (const item of allItems) {
    const testId = await item.getAttribute('data-testid');
    if (testId) itemData.push({ testId });
  }

  // 2. Initially sort ALL items to Bucket A (to trigger validation)
  for (const item of itemData) {
    await dragItemToBucket(item.testId, 'A');
  }

  // Wait for validation to trigger and colors to update
  await page.waitForTimeout(2000);

  // 3. Identify wrong items (red background) and move them to the other bucket
  const getNextWrongItem = async () => {
    return await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid^="sortable-item-"]'));
      const wrongEl = items.find((el) => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        // Robust color check: Look for #ef4444 or any "very red" variant
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return bg === '#ef4444';
        const [_, r, g, b] = match;
        return parseInt(r) > 200 && parseInt(g) < 100 && parseInt(b) < 100;
      });
      if (!wrongEl) return null;
      
      const testId = wrongEl.getAttribute('data-testid');
      const match = testId?.match(/sortable-item-(.+)--([AB])/);
      return { 
        text: match ? match[1] : '', 
        correctBucket: match ? match[2] : '',
        testId: testId || ''
      };
    });
  };

  let wrongItem = await getNextWrongItem();
  let attempts = 0;
  let lastFailedTestId = '';
  let retryOffset = 0;

  while (wrongItem && attempts < 50) {
    attempts++;
    if (wrongItem.testId === lastFailedTestId) retryOffset++;
    else retryOffset = 0;
    
    lastFailedTestId = wrongItem.testId;
    console.log(`[Sortable] Wrong item ${attempts}: "${wrongItem.text}" to Bucket ${wrongItem.correctBucket}`);
    await dragItemToBucket(wrongItem.testId, wrongItem.correctBucket as 'A' | 'B', retryOffset);
    
    // Re-scan after each move to ensure we catch any shifted or newly revealed red items
    await page.waitForTimeout(400);
    wrongItem = await getNextWrongItem();
  }

  // 4. Click Next if enabled
  await scrollIntoView(page, 'learn-step-next');
  const nextBtn = page.getByTestId('learn-step-next');
  if (await nextBtn.isEnabled({ timeout: 5000 }).catch(() => false)) {
    await nextBtn.click({ force: true });
    await waitForNextStep(page);
    return true;
  }

  return false;
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

/** LearnBreathe: select shortest duration (15s), start, wait for completion. Component auto-advances via onNext() after 1s. */
export async function stepBreathe(page: Page): Promise<boolean> {
  console.log('stepBreathe');
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
  await clickLearnStepNext(page);
  // await page.getByText('Atemübung abgeschlossen!').waitFor({ state: 'visible', timeout: 70000 });
  // await page.waitForTimeout(2000);
  // const stillBreathe = await page.getByTestId('breathe-container').isVisible().catch(() => false);
  // if (stillBreathe) {
  //   await clickLearnStepNext(page);
  //   await waitForNextStep(page);
  // }
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

/** Get current learn block type from page (data-testid="learn-block-{type}"). Deterministic for test flow. */
export async function getCurrentLearnBlockType(page: Page): Promise<string | null> {
  const el = await page.locator('[data-testid^="learn-block-"]').first().elementHandle().catch(() => null);
  if (!el) return null;
  const testId = await el.getAttribute('data-testid');
  if (!testId || !testId.startsWith('learn-block-')) return null;
  return testId.replace('learn-block-', '');
}

/** NeedsDetective: step 0/2 = text input; step 1 = Genau; step 3 = Zusammenfassung erstellen (wait for AI) then Weiter. */
async function stepNeedsDetective(page: Page): Promise<boolean> {
  const step3 = page.locator('#learn-needs-detective-step-3');
  const step3Summary = page.locator('#learn-needs-detective-step-3-summary');

  if (await step3.isVisible().catch(() => false)) {
    const createBtn = step3.getByText('Zusammenfassung erstellen');
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await createBtn.click({ force: true });
      
      // Check if error message appeared
      const errorMsg = page.getByText(/Bitte fülle zuerst/i);
      if (await errorMsg.isVisible().catch(() => false)) {
        console.error('NeedsDetective validation error visible:', await errorMsg.innerText());
      }

      // Button is replaced by spinner; wait for learn-step-next to appear inside step-3-summary
      await page.locator('#learn-needs-detective-step-3-summary').getByTestId('learn-step-next').waitFor({ state: 'visible', timeout: 60000 });
    }
  }

  if (await step3Summary.isVisible().catch(() => false)) {
    const nextBtn = step3Summary.getByTestId('learn-step-next');
    await nextBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    await nextBtn.click({ force: true });
    await waitForNextStep(page);
    return true;
  }

  const step1 = page.locator('#learn-needs-detective-step-1');
  if (await step1.isVisible().catch(() => false)) {
    const genauBtn = step1.getByTestId('learn-step-next');
    await genauBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    await genauBtn.click({ force: true });
    await waitForNextStep(page);
    return true;
  }

  if (await stepTextInput(page)) return true;
  return stepGenericWeiter(page);
}

/** Map block type to primary handler. Uses deterministic structure: block type → action. Summary has no learn-block- wrapper. */
const BLOCK_TYPE_HANDLERS: Record<string, (page: Page) => Promise<boolean>> = {
  feelingsDetective: stepFeelingsDetective,
  aiQuestion: stepTextInput,
  needsDetective: stepNeedsDetective,
  needsRubiksCube: stepTextInput,
  multipleChoice: stepMultipleChoice,
  sortable: stepSortable,
  timer: stepTimer,
  breathe: stepBreathe,
  bodymap: stepBodyMap,
  text: stepGenericWeiter,
  heading: stepGenericWeiter,
  list: stepGenericWeiter,
  image: stepGenericWeiter,
  audio: stepGenericWeiter,
  task: stepGenericWeiter,
};

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

/** Execute one step; returns true if a handler ran. Uses block type when available for deterministic flow. */
export async function stepLearnContent(page: Page): Promise<boolean> {
  const blockType = await getCurrentLearnBlockType(page);
  const blockHandler = blockType ? BLOCK_TYPE_HANDLERS[blockType] : null;
  if (blockHandler && (await blockHandler(page))) return true;
  for (const handler of HANDLERS) {
    if (await handler(page)) return true;
  }
  return false;
}

type StepHandler = (page: Page) => Promise<boolean>;

/** Get handler for (component, internalStep). Mirrors [slug].tsx switch logic. */
function getStepHandler(component: string, internalStep: number): StepHandler {
  switch (component) {
    case 'title':
      return stepGenericWeiter;
    case 'summary':
      return stepLearningSummary;
    case 'text':
    case 'heading':
    case 'list':
    case 'image':
    case 'audio':
    case 'task':
      return stepGenericWeiter;
    case 'timer':
      return stepTimer;
    case 'sortable':
      return stepSortable;
    case 'multipleChoice':
      return stepMultipleChoice;
    case 'breathe':
      return stepBreathe;
    case 'aiQuestion':
      return internalStep === 0 ? stepTextInput : stepGenericWeiter;
    case 'feelingsDetective':
      if (internalStep === 0 || internalStep === 2) return stepTextInput;
      if (internalStep === 1) return stepFeelingsDetectiveStep1;
      return stepFeelingsDetective; // step 3 and 4
    case 'bodymap':
      return stepBodyMap;
    case 'needsDetective':
      return internalStep === 3 ? stepNeedsDetective : (internalStep === 0 || internalStep === 2) ? stepTextInput : stepGenericWeiter;
    case 'needsRubiksCube':
      return internalStep === 0 ? stepTextInput : stepGenericWeiter;
    default:
      return stepGenericWeiter;
  }
}

/** Click through steps using content-driven plan. Falls back to DOM-based stepLearnContent when plan handler fails. */
export async function clickThroughLearnContentWithPlan(
  page: Page,
  totalStepsArray: Array<{ component: string; internalStep: number; blockIndex: number }>,
  maxSteps = 150
): Promise<void> {
  let planIndex = 0;

  for (let s = 0; s < maxSteps; s++) {
    if ((await page.url()).match(/\/learn\/?$/)) return;

    const stepData = totalStepsArray[Math.min(planIndex, totalStepsArray.length - 1)];
    const handler = getStepHandler(stepData.component, stepData.internalStep);
    const didStep = await handler(page);
    if (didStep) {
      planIndex++;
    } else {
      const fallbackDidStep = await stepLearnContent(page);
      if (fallbackDidStep) {
        planIndex++;
      } else {
        const backBtn = page.getByText('Zurück zur Lernübersicht');
        if (await backBtn.isVisible().catch(() => false)) {
          await backBtn.click();
          continue;
        }
        await page.getByTestId('tab-learn').first().click().catch(() => {});
        if ((await page.url()).match(/\/learn\/?$/)) return;
        throw new Error(
          `clickThroughLearnContentWithPlan stuck at step ${s + 1} (plan: ${stepData.component}[${stepData.internalStep}]). URL: ${page.url()}`
        );
      }
    }
    await page.waitForTimeout(300);
  }

  if (!(await page.url()).match(/\/learn\/?$/)) {
    const backBtn = page.getByText('Zurück zur Lernübersicht');
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
    } else {
      await page.getByTestId('tab-learn').first().click();
    }
  }
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
