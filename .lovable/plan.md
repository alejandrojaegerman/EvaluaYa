# Fix: checklist content cut off behind the fixed action bar

## The problem
On the `/assess/*` flow, the Back / Analizar daños bar is rendered with `position: fixed` at the bottom of the screen (the `StepFooter` component). To stop content from hiding behind it, `AppShell` reserves bottom space on the scrolling `<main>`.

But the reserved space is wrong at wider viewports:

```text
main classes:  ... md:pb-12  pb-28 ...
```

- `pb-28` = 112px (intended clearance, applies on phones)
- `md:pb-12` = 48px (applies at ≥768px and, because it's a more specific breakpoint variant, wins)

The fixed action bar is ~65px tall. At ≥768px the page only reserves 48px, so the bottom of the last checklist item (e.g. item 13) is hidden behind the bar and the scroll can't reveal it. This was confirmed live: at 897px wide, computed `padding-bottom` was `48px` vs a 65px bar.

## The fix
In `src/components/AppShell.tsx`, change the `<main>` padding logic so that when `hideFooter` is set (the assessment flow that shows the fixed `StepFooter`), the bottom clearance stays large enough at **every** breakpoint instead of being shrunk to `md:pb-12`.

Current:
```tsx
"mx-auto w-full flex-1 px-4 pt-5 md:pb-12",
hideFooter ? "pb-28" : "pb-4",
```

Updated approach: move the desktop `md:pb-12` into the non-`hideFooter` branch only, so flow pages keep their full bottom padding across breakpoints:
```tsx
"mx-auto w-full flex-1 px-4 pt-5",
hideFooter ? "pb-28" : "pb-4 md:pb-12",
```

This keeps normal pages unchanged (`pb-4` on mobile, `pb-12` on desktop) while guaranteeing the assessment flow always reserves 112px — comfortably clearing the ~65px fixed bar.

## Verification
- Re-check computed `padding-bottom` on `<main>` at 897px: should be 112px.
- Scroll the `/assess/checklist` page to the very bottom and confirm the last item and its helper text are fully visible above the action bar.
- Spot-check `/assess/property` (same `StepFooter`) at mobile and desktop widths.

## Scope
- One file: `src/components/AppShell.tsx` (a single className change). No logic, data, or component-structure changes.
