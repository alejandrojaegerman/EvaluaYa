# Dynamic risk visuals + drill-down everywhere

Bring the "why behind the risk" drill-down to the regional pages and give the map, regional and admin views a more engaging look using **radial gauges** for risk distribution and **animated segmented bars** for the factor breakdowns. No new dependencies — uses the existing `recharts` library plus CSS animation.

## What changes for the user

- **Regional pages (`/zona/$estado`)** gain a "Ver por qué / See why" toggle that reveals the same flagged-items, building age/type, seismic intensity and safety-rule breakdown already on the map — scoped to that state.
- **Risk distribution** (high/moderate/low) is shown as a polished **radial gauge** with the total in the center, on the map, regional and admin pages — replacing the current flat horizontal bar.
- **Factor breakdown bars** animate into place (segments grow on reveal) and read more clearly, making the drill-down feel alive.

## New / changed pieces

### 1. New component: `src/components/RiskGauge.tsx`
A reusable radial gauge that renders the green/yellow/red split as concentric `recharts` `RadialBarChart` rings, with the total count and a small high/moderate/low legend below. Colors come from `RISK_HEX` (no hardcoded colors). Built-in recharts animation gives the sweep-in effect. Props: `{ green; yellow; red; label? }`.

### 2. Upgrade `src/components/RiskFactorsPanel.tsx`
Keep the grouped structure but turn each factor row into an **animated segmented bar**:
- Risk-split segments (red/yellow/green) animate their width from 0 on mount using a CSS transition keyed to an "in view" state.
- Cleaner counts with a subtle count-up via CSS, consistent label/legend.
- Same `FactorGroup` API, so both map and admin drill-downs inherit the upgrade automatically.

### 3. Regional page: `src/routes/zona.$estado.tsx`
- Replace the flat distribution bar with `<RiskGauge>`.
- Add a "Ver por qué" toggle (matching the map's pattern) that lazily calls the existing `getRiskFactors({ state })` server function and renders `<RiskFactorsPanel>` inline. Reuses the existing chevron + `factors.why` / `factors.hideWhy` i18n keys.

### 4. Map page: `src/routes/mapa.tsx`
- Swap the manual distribution stacked bar (the `RiskStat` row) for `<RiskGauge>`.
- Drill-down list keeps working; it inherits the animated `RiskFactorsPanel`.

### 5. Admin dashboard: `src/routes/admin.index.tsx`
- Replace the `RiskBar` distribution block with `<RiskGauge>`.
- Per-state drill-down inherits the animated `RiskFactorsPanel`.
- Leave the existing trend `AreaChart` as-is (already styled).

## Technical notes

- No backend or schema changes; `getRiskFactors` already accepts an optional `state` and is the public, anonymized RPC powering the map drill-down.
- All colors stay on `RISK_HEX` / semantic risk tokens — no `text-white`/hex literals in components.
- Animations use existing Tailwind keyframes (`fade-in`, `scale-in`) and CSS width transitions plus recharts' built-in `isAnimationActive`; nothing new to install.
- Gauge and bars are SSR-safe (no `Date.now()`/`Math.random()` at render) to avoid hydration mismatches.

```text
RiskGauge (radial rings + center total)
 ┌───────────────┐
 │     ◜◝         │   used on: /mapa, /zona/$estado, /admin
 │   ◜  N  ◝      │
 │     ◟◞         │
 │ ● high ● mod ● low │
 └───────────────┘

RiskFactorsPanel (animated segmented bars)
 Grietas exteriores   ██████▓▓░░  12
 Muros interiores     ████▓░       7
```
