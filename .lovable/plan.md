# Drill into the "why" behind risk results

Today the map and admin pages only show Green/Yellow/Red counts per area. This adds an expandable panel that explains *what drove those results* — broken down by the four factors you picked, color-coded by risk level. On the public map it stays fully anonymized; in the gated admin view you can also drill all the way to individual reports.

## What you'll see

**On the map (`/mapa`)** — tap any area in the "Top areas" list to expand a "Why these results" panel showing:
- **Flagged structural issues** — which checklist items (cracks, columns/beams, roof, foundation…) were most often answered "Yes" or "Unsure", with Red/Yellow/Green split per issue.
- **Building age & type** — how risk breaks down across pre-1970 / 1970–2000 / post-2000 and house / apartment / commercial.
- **Seismic intensity** — distribution across shaking bands (light / moderate / strong / severe) behind those reports.
- **Safety rules triggered** — count of reports forced to Red/Yellow by deterministic rules (older masonry, liquefaction, pounding, gas/plumbing risk, strong shaking + damage).

All aggregate-only — no addresses, photos, or individual reports on the public map.

**On the admin dashboard (`/admin`)** — tap any state in "Top states" to expand the same four-factor panel, *plus* a "Recent reports" list (date, risk tag, building type/age, intensity, number of issues flagged) where each row links to the full report at `/a/{id}`.

```text
Top areas
┌─────────────────────────────────────────┐
│ ● Chacao            Miranda · 42  R Y G ⌄│
│   ▸ expands ▾                             │
│   ┌─ Why these results ─────────────────┐│
│   │ Flagged issues                      ││
│   │  Columns/beams   ███ 18  R12 Y4 G2  ││
│   │  Exterior walls  ██  11  R6  Y3 G2  ││
│   │ Building age      pre-1970 ▆ mostly R││
│   │ Seismic intensity strong ▆▆▆        ││
│   │ Safety rules      URM ×7 · Pounding ×3│
│   └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Technical approach

All "why" data already lives in the `assessments` table JSONB columns (`property`, `answers`, `ai_result`) plus `risk_level` — no schema changes, only new read-side aggregation.

### Database (migration — new SECURITY DEFINER functions, execute restricted to `service_role` per existing hardening)

1. `get_risk_factors(_state text default null, _municipality text default null)` — returns a normalized long-format table `(factor_group text, factor_key text, total int, green int, yellow int, red int)` covering all four factor groups, optionally filtered by state/municipality. Implementation:
   - **checklist**: unnest `answers` JSONB, count rows where each item's `value in ('yes','unsure')`, grouped by item `id`, split by `risk_level`.
   - **age** / **type**: group by `property->>'age'` and `property->>'buildingType'`.
   - **intensity**: bucket `(property->>'seismicIntensity')::numeric` into bands (<5, 5–5.9, 6–7.9, ≥8).
   - **safety_rule**: boolean detection of the main deterministic triggers directly from the JSONB (`structuralType = 'URM'`, `liquefaction/pounding/plumbing = 'yes'`, severe shaking via MMI≥8 or PGA≥0.5), mirroring `src/lib/safety-rules.ts`.
   - Scoped to `status = 'analyzed' AND risk_level IS NOT NULL`.
2. `get_admin_state_reports(_state text, _limit int default 25)` — recent individual reports for a state: `public_id, created_at, risk_level, building_type, age, structural_type, seismic_intensity, flagged_count`. No address / no PII.

### Server functions
- `src/lib/stats.functions.ts`: add `getRiskFactors({ state, municipality })` (public, anonymized) brokering `get_risk_factors` through the service-role client, same pattern as `getDamageAggregates`. Returns a typed `RiskFactors` shape grouped client-side.
- `src/lib/admin-analytics.functions.ts`: add `adminGetStateDrilldown({ adminSecret, state })` — gated by `VOLUNTEER_ADMIN_SECRET` (constant-time compare, existing `adminOk`), returning both the factor aggregates (`get_risk_factors`) and individual reports (`get_admin_state_reports`).

### UI
- New shared component `src/components/RiskFactorsPanel.tsx` — renders the four-factor breakdown from a `RiskFactors` object (bars + Red/Yellow/Green chips), reused by both pages. Loading + empty states.
- `src/routes/mapa.tsx`: add expand/collapse state to each `Top areas` row; on first expand, lazy-fetch `getRiskFactors` for that area and render `RiskFactorsPanel`. Keep existing state-link chevron behavior accessible (chevron still navigates to the regional page; a separate "Why" affordance toggles the panel).
- `src/routes/admin.index.tsx`: make each `Top states` row expandable; on expand call `adminGetStateDrilldown` (reusing the unlocked secret already in state) and render `RiskFactorsPanel` + a "Recent reports" list linking each row to `/a/{publicId}`.
- `src/lib/i18n.tsx`: add ES (primary) + EN keys for panel headings, factor-group labels, intensity-band labels, and safety-rule labels. Checklist item names and age/type labels already exist and will be reused.

### Privacy
- Public map: aggregate counts only, never individual rows or addresses.
- Admin individual reports: exposed only behind the existing admin secret, and contain no address/photos — each links out to the existing `/a/{publicId}` report page for full detail.

No new tables, no new dependencies, no changes to assessment capture or scoring logic.