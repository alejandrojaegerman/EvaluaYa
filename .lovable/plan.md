# One consistent risk vocabulary + a data dictionary

## The problem

"Riesgo alto" currently means two different numbers:

```text
Data Room top card   →  red + orange  = 85   labeled "Riesgo alto"
Distribution gauge   →  red only      = 27   labeled "Riesgo alto"
```

Same words, different math. A secondary mismatch: orange is "Riesgo serio" on
the map/gauge but "Riesgo moderado a serio" on result cards.

## The canonical scale (one name per level, everywhere)

```text
🟢 green   Riesgo bajo                 (low)
🟡 yellow  Riesgo moderado             (moderate)
🟠 orange  Riesgo moderado a serio     (serious)   ← unified
🔴 red     Riesgo alto                 (high)       ← red ONLY, always
```

Plus one clearly-named **derived** metric:

```text
🟠+🔴  Riesgo serio o alto             (orange + red combined = the 85)
```

"Riesgo alto" will never again be used for the combined count.

## Changes

### 1. Fix the mislabeled Data Room card (`src/routes/datos.tsx`)
The top card keeps its value (`red + orange`) but its label changes from
`map.high` ("Riesgo alto") to a new `map.seriousOrHigh` ("Riesgo serio o alto").
This is the single line causing the 85-vs-27 collision.

### 2. Unify the orange label (`src/lib/i18n.tsx`)
Update `map.urgent` so the gauge/map/trend match the result-card wording:
- ES: "Riesgo serio" → "Riesgo moderado a serio"
- EN: "Serious risk" → "Moderate-to-serious risk"

This flows automatically into `RiskGauge`, `DamageMap`, `TrendChart`, and the
`/mapa`, `/datos`, `/zona/$estado` pages (they all read the same key). No other
edits needed for consistency — verified that `/mapa` headline only shows
total + zones, so no stray "Riesgo alto" card lives there.

### 3. Add the new combined-metric key (`src/lib/i18n.tsx`)
- `map.seriousOrHigh` → ES "Riesgo serio o alto", EN "Serious or high risk"

### 4. Data dictionary — collapsible on `/datos`, canonical on Metodología
Best practice is one authoritative definition source that surfaces lightweight
in-context. So:
- Add a **collapsible "¿Cómo leer estos datos? / How to read this"** panel near
  the bottom of `/datos` (above Export & share), using the existing
  `Collapsible` UI primitive. It defines: the 4 risk levels, "Riesgo serio o
  alto" (= orange + red), "Verificado por ingeniero", "Zonas", and what one
  "Evaluación" represents (a single assessment, not a unique building).
- End that panel with a link to **`/metodologia`** ("Ver metodología completa")
  as the full canonical reference — it already documents the level escalation
  rules, so it stays the source of truth.
- Add the supporting i18n keys (`data.dict.*`) in ES + EN.

## Technical notes

- Only presentation/copy changes: i18n strings + `datos.tsx` JSX. No backend,
  RPC, or risk-computation logic changes — the 85 and 27 numbers stay correct,
  only their labels become unambiguous.
- The collapsible reuses `@/components/ui/collapsible` (already in the project),
  matching the existing card styling (`rounded-2xl border bg-card`).
- Existing `result.orange.tag` ("Riesgo moderado a serio") is already the chosen
  canonical orange name, so result cards and methodology need no change.
