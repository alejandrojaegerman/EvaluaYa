## Goal
Replace the hard-to-read concentric-arc donut in the "Distribución de riesgo" card with the chosen **ranked horizontal progress bars**, so the four risk tiers can be compared on a shared baseline at a glance.

## Scope
Rewrite only the internals of `src/components/RiskGauge.tsx`. Its props stay identical (`green`, `yellow`, `orange?`, `red`, `label?`), so all four call sites work unchanged with no other edits:
- `src/routes/mapa.tsx`
- `src/routes/datos.tsx`
- `src/routes/admin.index.tsx`
- `src/routes/zona.$estado.tsx`

## New layout (per selected prototype)
- **Header row**: title is supplied by the parent card already, so inside the component show the total count prominently on the right (large, bold, `tabular-nums`) with the `label` (e.g. "Evaluaciones") as a small muted caption beneath it.
- **Four ranked bars**, ordered most-severe → least-severe (red → orange → yellow → green):
  - Row top line: colored dot + tier name on the left; bold count + muted percent on the right.
  - Row bottom: a full-width track (`bg-muted`) with a colored fill whose width = that tier's share of the total.
- Drop the Recharts `RadialBarChart` entirely (remove the `recharts` import from this file).

## Colors & labels (reuse existing system)
- Keep using `RISK_HEX` via the existing `rgb()` helper for dots and bar fills — no hardcoded color utilities, consistent with the rest of the app.
- Keep the current i18n tier labels already wired in this component: `map.high` (red), `map.urgent` (orange), `map.moderate` (yellow), `map.low` (green). The prototype's English/placeholder names are not used.
- Track background uses the `bg-muted` token; text uses `text-foreground` / `text-muted-foreground` tokens (the prototype's slate/white literals are mapped to these so light/dark mode stays correct).

## Edge cases
- `total === 0`: render every bar at 0% width with `0` / `0%` so the card never shows a divide-by-zero or a misleading full bar.
- Percentages rounded to whole numbers (matching current behavior).
- Component stays SSR-safe and a pure function of props (no chart lib, no client-only APIs).

## Out of scope
No data, query, filter, or surrounding-page-layout changes; no new dependencies; the "Ver detalles" footer link from the prototype is omitted since these cards already live inside pages with their own navigation.

## Verification
Build, then capture the card on `/datos` (and spot-check `/admin`) at mobile width to confirm bars render with correct proportions, colors, counts, and the zero-state.
