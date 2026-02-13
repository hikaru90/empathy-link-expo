# All Learn Modules – MCP Browser Test

**Purpose:** Simulate a real user flow across all learn topics: complete if in progress, restart, then click through whole content per topic. Uses the browser MCP (cursor-ide-browser or chrome-devtools) so you can see each action.

**Credentials:** Read from `.env`: `TEST_USERNAME`, `TEST_PASSWORD`.

**Base URL:** `http://localhost:8081` (Expo web must be running).

---

## Phase 1: Login

1. **Navigate** to `http://localhost:8081/login`
2. **Snapshot** (interactive) to get refs for the form
3. **Fill form:**
   - Email: value from `TEST_USERNAME`
   - Password: value from `TEST_PASSWORD`
4. **Click** sign-in button (e.g. "Anmelden" or `signin-button`)
5. **Wait** for URL to leave `/login` (or for main tabs to appear)
6. If onboarding appears: **Click** "Überspringen" to skip

---

## Phase 2: Open Learn List

7. **Navigate** to `http://localhost:8081/learn`
8. **Snapshot** to confirm `learn-list` and `learn-topic-card`s are visible
9. **Count** topic cards (from snapshot or evaluate)

---

## Phase 3: For Each Topic (i = 0 to cardCount - 1)

### 3a. Open topic

10. **Scroll** the topic card into view if needed
11. **Click** the i-th `learn-topic-card`
12. **Wait** 1–2 seconds
13. **Snapshot** to see what appeared:
    - **Restart drawer:** "Neu starten" and/or "Ergebnisse ansehen"
    - **Detail page:** URL `/learn/:slug` and `learn-detail-content`

### 3b. Handle restart drawer or in-progress

14. **If restart drawer with "Neu starten":**
    - **Click** "Neu starten"
    - **Wait** for URL to be `/learn/:slug`
15. **If restart drawer with "Ergebnisse ansehen" only:**
    - **Click** "Ergebnisse ansehen"
    - **Go to Phase 3c** (click through content)
    - **Then** go back to learn list, click same topic again, click "Neu starten"
    - **Wait** for URL to be `/learn/:slug`
16. **If detail page already (no drawer):**
    - **Go to Phase 3c** (click through content)
    - **Then** go back to learn list, click same topic again, click "Neu starten"
    - **Wait** for URL to be `/learn/:slug`

### 3c. Click through learn content

17. **Snapshot** to identify current step:
    - `learn-step-next` / "Weiter"
    - `learn-text-input` + `learn-send`
    - `feelings-choose-btn`
    - `multiple-choice-option-0` + `multiple-choice-submit`
    - `sortable-container`, `sortable-item-*`, `sortable-bucket-A/B`
    - `timer-play`
    - `breathe-play` (optionally choose "Dauer" → "0:15")
    - `bodymap-character`
    - "Zurück zur Lernübersicht" (summary)
18. **Perform** the action for that step (click Weiter, fill "test" and send, select option, drag sortable, play timer/breathe, click body map, or click "Zurück zur Lernübersicht")
19. **Repeat** snapshot + action until URL is `http://localhost:8081/learn` (back on learn list)
20. **Snapshot** to confirm `learn-list` and topic cards visible

### 3d. Next topic

21. **Increment** i and repeat from step 10 until all topics are done

---

## Step Handlers (for Phase 3c)

| Step type | Action |
|-----------|--------|
| Generic Weiter | Click `learn-step-next` or "Weiter" |
| Text input | Fill `learn-text-input` with "test", click `learn-send` |
| Feelings Detective | Click `feelings-choose-btn` → expand category → click chip → close drawer → click Weiter |
| Feelings step 4 | Click "Zusammenfassung erstellen" if visible, wait for summary, then Weiter |
| Multiple choice | Click `multiple-choice-option-0`, click `multiple-choice-submit` |
| Sortable | Drag each `sortable-item-*` to its bucket (`sortable-bucket-A` or `sortable-bucket-B`), click Weiter |
| Timer | Click `timer-play`, wait for "Abgeschlossen", click Weiter |
| Breathe | Click "Dauer" → "0:15", click `breathe-play`, wait for "Atemübung abgeschlossen!", click Weiter |
| Body map | Click `bodymap-character` or Weiter |
| Summary | Click "Zurück zur Lernübersicht" |

---

## Success Criteria

- All topic cards open and load detail content
- Restart drawer handled correctly (restart or view-results flow)
- All steps within each topic are completed
- Back at learn list after each topic
