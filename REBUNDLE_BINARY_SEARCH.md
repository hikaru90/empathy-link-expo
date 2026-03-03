# Binary search: find what triggers endless Android rebundle

**Test:** Run app on Android dev. If it rebundles in a loop, the trigger is still present. If it stays stable, the last thing we removed is involved.

## Order of removal (coarse → fine)

| Round | What we remove | If rebundle STOPS → trigger is in … |
|-------|----------------|-------------------------------------|
| 1 | Root layout: both useEffects (mount log + i18n) | Root layout effects (or running effects at all) |
| 2 | Root: don’t render (app); render minimal View + Text | (app) tree (auth, Index, Redirect, etc.) |
| 3a | If 1 stopped it: add back only mount-log effect | i18n effect (initializeI18n) |
| 3b | If 2 stopped it: root renders Stack but (app)/_layout returns empty View | Something under (app)/_layout |
| 4 | (app)/_layout returns empty; (app)/index.tsx returns plain View (no Redirect, no useAuth) | Index screen or Redirect / useAuth |
| … | Keep narrowing in the same way | … |

**Round 1 result:** Rebundle STOPPED when both root useEffects were commented out → trigger is in root layout effects.

**Round 3a result:** With only mount-log effect in root, app stayed stable → **i18n initialization in root was the trigger.**

**Fix:** `initializeI18n()` is now called in `(app)/_layout.tsx` in a useEffect. Root layout has no i18n effect. App stays stable and i18n still runs when (app) mounts.
