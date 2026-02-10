# Learn modules – Playwright MCP test steps

Run these steps with the **Playwright MCP** (browser) so you can see each action. Use a snapshot first to get element `ref`s, then use those refs in the tools.

## 1. Login

1. **Navigate:** `browser_navigate` → `http://localhost:8081/login`
2. **Snapshot** (interactive) to get refs for the form.
3. **Fill form:**
   - Email field (ref from snapshot): value = `TEST_USERNAME` from `.env`
   - Password field (ref from snapshot): value = `TEST_PASSWORD` from `.env`
4. **Click** the sign-in button (ref from snapshot; e.g. "Anmelden" or `signin-button`).
5. **Wait** for URL to leave `/login` (or for learn/stats to appear).
6. If onboarding appears: **Click** "Überspringen" (ref from snapshot) to skip.

## 2. Open Learn and pick a topic

7. **Navigate** (or click Learn tab): `http://localhost:8081/learn`
8. **Snapshot** to get refs for `learn-list` and `learn-topic-card`s.
9. **Click** the first topic card (ref for first `learn-topic-card`).

## 3. Handle restart drawer or detail page

10. **Snapshot** to see what appeared:
    - **Restart drawer:** "Neu starten" and/or "Ergebnisse ansehen"
    - **Detail page:** URL `/learn/:slug` and `learn-detail-content`
11. If **restart drawer** with "Neu starten":
    - **Click** "Neu starten" (ref from snapshot).
    - Wait for URL to be `/learn/:slug`.
12. If **restart drawer** with "Ergebnisse ansehen" only:
    - **Click** "Ergebnisse ansehen", then continue with step 13 and later reopen to restart.
13. If **detail page** already:
    - Proceed to step 14.

## 4. Click through learn content

14. **Snapshot** to get ref for the current step (one of):
    - `learn-step-next` / "Weiter"
    - `learn-text-input` + `learn-send`
    - `feelings-choose-btn`
    - `multiple-choice-option-0` + `multiple-choice-submit`
    - `sortable-container`, `sortable-item-*`, `sortable-bucket-A/B`
    - `timer-play`
    - `breathe-play` (optionally choose "Dauer" → "0:15")
    - `bodymap-character`
    - "Zurück zur Lernübersicht" (summary)
15. **Do the action** for that step (click Weiter, fill "test" and send, select option, drag sortable, play timer/breathe, click body map, or click "Zurück zur Lernübersicht").
16. **Repeat** snapshot + action until URL is `http://localhost:8081/learn` (back on learn list).
17. **Snapshot** to confirm: `learn-list` and topic cards visible.

## 5. Optional: more topics

18. **Click** another `learn-topic-card` and repeat from step 10.

---

**Credentials:** Read from `.env`: `TEST_USERNAME`, `TEST_PASSWORD`.

**Important:** Always take a **snapshot** before click/fill so you have current `ref`s. Never hide MCP actions—run them so you can see what the Playwright MCP is doing.
