# Fix awkward mobile footer spacing

## Problem
On mobile, vertical space stacks up around the footer:
- `<main>` in `AppShell.tsx` has `pb-28` (112px bottom padding) — needed to clear the fixed BottomNav **only when there's no footer**.
- The `Footer` adds `pt-10` (40px) on top of that.

So when the footer is visible, content → footer has ~150px of empty gap, which looks disconnected/awkward. The footer's own `pb-28` (to clear the BottomNav) is correct and stays.

## Fix (presentation only)
In `src/components/AppShell.tsx`, make the `<main>` bottom padding conditional:
- When the footer is shown (`!hideFooter`): use a small bottom padding (e.g. `pb-4`) since the footer immediately follows and already handles BottomNav clearance.
- When the footer is hidden (assessment flow): keep `pb-28` so content still clears the BottomNav.

Optionally trim the footer's top padding on mobile (`pt-10` → `pt-8`) and its top margin (`mt-12` → `mt-8`) for a tighter, more intentional transition, keeping desktop values via `md:` variants.

No changes to layout structure, links, or business logic — purely spacing.

## Technical detail
- File: `src/components/AppShell.tsx`, line ~76 — replace static `pb-28` with conditional padding based on `hideFooter`.
- File: `src/components/Footer.tsx`, line ~43-44 — optionally adjust `mt-12`/`pt-10` with responsive variants; keep `pb-28 md:pb-10`.
