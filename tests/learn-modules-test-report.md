# "All learn modules: complete..." test – potential issues

Summary of findings from reviewing the test, `learn-helpers.ts`, and the learn UI (including a partial Playwright run and Playwright MCP checks).

## Test flow (brief)

1. Go to `/learn`, wait for `learn-list` and `learn-topic-card`s.
2. For each topic card:
   - Click card (JS click with fallback to force click).
   - Race: **restart drawer** ("Neu starten" / "Ergebnisse ansehen") vs **direct navigation** to `/learn/:slug`.
   - If restart drawer: click "Neu starten" (or "Ergebnisse ansehen" → complete flow → reopen → "Neu starten").
   - If already on detail: `clickThroughLearnContent` to end, then back, reopen, "Neu starten".
   - Wait for `/learn/:slug` and `learn-detail-content`.
   - `clickThroughLearnContent` again to complete the module.
   - Assert back at `/learn`.

## Potential issues

### 1. Card click and overlay (RN Web)

- The test uses **JS `evaluate` click** first, then **`force: true`** as fallback so clicks work through React Native Web overlays.
- **Risk:** If the card is covered (e.g. by another element or a different overlay), the click can still fail after both attempts → "click did not open topic" with URL/backend hint.
- **Check:** Ensure no extra overlays or modals sit on top of the learn list; keep card scroll/visibility logic in sync with the UI.

### 2. Restart drawer timing

- After "Neu starten", the test waits for `waitForURL(/\/learn\/.+/)` (10s) and `learn-detail-content` (15s).
- **Risk:** Slow backend (PocketBase) or slow navigation can cause timeouts.
- **Check:** If tests flake on "in progress" topics, consider increasing these timeouts or adding a more specific "loading finished" condition.

### 3. `clickThroughLearnContent` handler order and coverage

- Handlers run in this order: LearningSummary → FeelingsDetective (step 4 → step 3) → FeelingsDetective step 1 → TextInput → MultipleChoice → Sortable → Timer → Breathe → BodyMap → GenericWeiter.
- **Audio steps:** No dedicated handler; the **global** `LearnNavigation` (Weiter) is used, so `stepGenericWeiter` should work as long as the bottom nav is visible.
- **Risk:** If a new step type is added (e.g. new component that hides parent nav and uses a different button/testID), the chain might not handle it and the test could get stuck or exit early.
- **Check:** When adding new learn block types, either add a handler in `learn-helpers.ts` or ensure they expose `learn-step-next` (or another selector already waited on in `waitForNextStep`).

### 4. FeelingsDetective step 4 – "Zusammenfassung erstellen"

- `stepFeelingsDetective` waits for "Zusammenfassung erstellen", clicks it, then waits for **Weiter** inside step 4 (timeout **60s**) for the summary to load.
- **Risk:** Slow or failing AI/summary API can hit the 60s timeout and fail the test.
- **Check:** If failures concentrate on FeelingsDetective topics, consider a longer timeout or a more robust "summary ready" signal.

### 5. Breathe and Timer durations

- **Breathe:** Helper selects "0:15" if the "Dauer" picker is visible, then waits for "Atemübung abgeschlossen!" (timeout 70s). If the picker isn’t found, the default duration may be longer.
- **Timer:** Helper waits for "Abgeschlossen" (timeout 65s).
- **Risk:** If copy or UI changes (e.g. "Abgeschlossen" removed or changed), the test will time out or fail.
- **Check:** Keep these strings in sync with the components (e.g. `LearnBreathe`, `LearnTimer`) or centralize them (e.g. test ids or constants).

### 6. Sortable – `data-testid` convention

- Items use `data-testid="sortable-item-${item.text}--${item.correctBucket}"`; the helper infers bucket from the `--A` / `--B` suffix.
- **Risk:** If `item.text` or bucket format changes, selectors or drag logic could break.
- **Check:** Keep `learn-helpers` in sync with `LearnSortable` testID and content shape.

### 7. German copy and test stability

- The test relies on exact German strings: "Neu starten", "Ergebnisse ansehen", "Zurück zur Lernübersicht", "Atemübung abgeschlossen!", "Abgeschlossen", "Zusammenfassung erstellen", "Weiter", etc.
- **Risk:** Copy changes or i18n could break selectors.
- **Check:** Consider `data-testid`s for critical actions (e.g. restart, view results, back to list) to reduce dependency on visible text.

### 8. Backend and auth

- The test depends on **auth setup** (`playwright/.auth/user.json`) and a **running backend** (PocketBase). Error message: "Backend (PocketBase) running? Card visible and not covered?"
- **Risk:** If auth expires or backend is down/slow, the test fails with navigation or timeout errors.
- **Check:** Run with `PLAYWRIGHT_SKIP_WEBSERVER=1` when the app is already running; ensure auth setup runs and PocketBase is up for full runs.

### 9. Test timeout (5 min)

- `test.setTimeout(300000)` for the whole "all learn modules" test.
- **Risk:** Many topics × (restart + full click-through) can exceed 5 minutes on slow runs.
- **Check:** If the test times out often, increase the timeout or run a smaller subset (e.g. first N topics) for CI.

---

## Playwright MCP / manual checks

- **Browser:** Navigated to `http://localhost:8081` and `/login`; onboarding and login page rendered as expected.
- **Chrome DevTools MCP:** Unavailable (browser profile conflict: "The browser is already running for ... chrome-profile").
- **Actual test run:** Auth setup passed; the "all learn modules" test was started but the run was aborted before completion (e.g. long duration). So the test is wired correctly; failures are likely environment (backend, timing) or the issues above.

## Recommendations

1. **Run the test to completion** with app and PocketBase up:  
   `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test -g "all learn modules"`.
2. **Add or stabilize test IDs** for restart drawer actions and key learn CTAs so the test is less sensitive to copy changes.
3. **Keep `learn-helpers` in sync** with any new learn block types and with `waitForNextStep` selectors.
4. **Monitor** failures on FeelingsDetective (summary timeout), Breathe/Timer (completion text), and card click (overlay/visibility).
