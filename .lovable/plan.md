## Problem

In the assessment flow, each step renders a `StepFooter` (Back / Continue) that is `fixed inset-x-0 bottom-0 z-30`. But every page wrapped in `AppShell` also renders the global `BottomNav`, which is `fixed inset-x-0 bottom-0 z-40`. Two bars stacked at the same spot — the higher z-index nav bar covers the Continue button on mobile.

## Fix

Suppress the global bottom nav on the focused wizard steps that already have their own Back/Continue footer. This is the standard pattern for a multi-step flow (the tab bar is noise during a guided task and there's no room for both bars).

### 1. `src/components/AppShell.tsx`
- Add an optional `hideBottomNav?: boolean` prop.
- Only render `<BottomNav />` when `hideBottomNav` is not set.
- Keep the existing `pb-28` bottom padding on `<main>` so content still clears the fixed `StepFooter` (its height is similar to the nav's).

### 2. `src/routes/assess/property.tsx`
- Pass `hideBottomNav` to `<AppShell>` so only the `StepFooter` shows.

### 3. `src/routes/assess/checklist.tsx`
- Same: pass `hideBottomNav` to its `<AppShell>` (it also uses `StepFooter`), including the loading/empty state shell so the layout is consistent.

`analyze.tsx` does not use `StepFooter`, so it keeps the normal bottom nav — no change there.

## Verification

- On mobile viewport, open `/assess/property`: the Continue button is fully tappable with no nav bar over it.
- Confirm `/assess/checklist` Back/Continue are likewise unobstructed.
- Confirm other pages (home, map, reports) still show the global bottom nav.
