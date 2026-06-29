## Goal

When someone taps the **Mapa** nav, they should see the actual map right away — not a wall of text and counters first.

## Problem

Today `/mapa` renders in this order:

```text
Header (title + subtitle + story intro)
Stat counters (2 cards)
Severity spotlight        (desktop only)
Trend chart               (desktop only)
Risk distribution gauge   (desktop only)
→ Interactive map         ← user has to scroll to reach this
Top areas list, sharing, etc.
```

So the map — the whole point of the page — sits below everything else, off the fold on both mobile and desktop.

## Change

Reorder the page so the **interactive map leads**, with a tightened header above it:

```text
Compact header (smaller title + one-line subtitle)
→ Interactive map (DamageMap)   ← now top of the fold
Stat counters (2 cards)
Severity spotlight       (desktop)
Trend chart              (desktop)
Risk distribution gauge  (desktop)
Top areas list, sharing, etc.
```

Details:
- Move the map `<Reveal>` section (currently after the counters/spotlight/trend/distribution) to sit directly under the header, before the counters.
- Trim the header so it takes less vertical space: keep the H1 and subtitle, drop or shrink the secondary "story intro" line so the map crests the fold on a typical phone.
- Keep all existing content — nothing is removed, only resequenced. The counters, spotlight, trend, distribution, and top-areas list all stay, just below the map.
- Loading and empty states stay as-is.

## Scope

- Single file: `src/routes/mapa.tsx` (JSX reordering inside the `!loading && hasData` block plus the header).
- No data, query, or component-logic changes; `DamageMap` and all sections render exactly as before, just in a new order.

## Verification

- Load `/mapa` on a mobile viewport and confirm the map is visible without scrolling.
- Confirm desktop still shows spotlight/trend/distribution below the map.
- Confirm the bubble interactions and zone navigation still work.
