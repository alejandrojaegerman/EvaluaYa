## Goal

Turn `/mapa` from a stacked dashboard into a smooth, scroll-revealed data story. As the user scrolls, progressively deeper visuals fade/slide in — leading with **severity & urgency**, then **why the damage looks this way**, ending at the existing **export / share / participate** section. Motion stays subtle (gentle fade + slide-up, animated count-ups, chart draw-in). All data stays anonymized and public.

## Narrative order (top → bottom)

```text
1. Header + animated headline counters (count-up on reveal)
2. Severity spotlight        ← NEW (red+orange share, urgency framing)
3. Reports over time         ← NEW trend chart (animated area chart)
4. Risk distribution gauge   ← existing RiskGauge (kept)
5. Interactive map + legend  ← existing DamageMap (kept)
6. Most-affected areas list  ← existing, with per-area "why" drilldown (kept)
7. Why behind the data       ← NEW national risk-factors panel
8. Export your view          ← existing share-image + CSV (kept, framed as section)
9. Institutions / Share / Start CTA ← existing (kept)
```

Each section is wrapped in a reveal animation that triggers once when it enters the viewport.

## New data source (anonymized, public)

Add a public `get_damage_timeseries` DB function (SECURITY DEFINER, `search_path=public`), mirroring the existing admin timeseries but exposed publicly with **counts only** — no addresses, ids, or photos. Returns daily rows for the last 90 days: `day, total, green, yellow, orange, red`. Grant `EXECUTE` to `anon` and `authenticated`.

Add `getDamageTimeseries` to `src/lib/stats.functions.ts` (same brokered `supabaseAdmin` pattern as the other public stats fns) returning a plain `TimeseriesPoint[]` DTO.

## New components

- `src/components/Reveal.tsx` — IntersectionObserver wrapper. SSR-safe: same markup on server and first client render (no hydration mismatch); a post-mount effect adds the `is-visible` class to fade + slide-up (`opacity`/`translateY` CSS transition). Respects `prefers-reduced-motion` (renders fully visible, no transform).
- `src/components/CountUp.tsx` — animates a number from 0 to its final value when revealed. Renders the final formatted value on SSR/first render to avoid hydration mismatch, then animates after mount. Honors reduced motion.
- `src/components/SeveritySpotlight.tsx` — headline urgency block: big "X% of assessments are Orange/Red" with a thin stacked severity bar (red+orange vs rest), short plain-language caption, and the top most-affected area name. Uses existing `RISK_HEX` tokens.
- `src/components/TrendChart.tsx` — Recharts stacked `AreaChart` (red/orange/yellow/green by day) with built-in draw-in animation, ET day labels via `formatDayLabel`, responsive container, and a small empty-state.

## Edits to `src/routes/mapa.tsx`

- Load timeseries alongside totals/aggregates (extend the existing `Promise.all`); also fetch **national** risk factors (`getRiskFactors({})` with no state filter) for the new "why" section, lazy-loaded when that section first reveals.
- Wrap each major `<section>` in `<Reveal>`, applying a small stagger.
- Replace the two plain headline counters with `<CountUp>` values.
- Insert `SeveritySpotlight` and `TrendChart` near the top; insert the national `RiskFactorsPanel` (reusing the existing component) as the "why behind the data" section above the export block.
- Group share-image + CSV under a clearly headed "Export / open data" section (visual only; same handlers).
- Keep all existing behavior: map navigation to `/zona/$estado`, per-area why drilldown, institution form, ShareApp, start CTA.

## i18n

Add ES (primary) + EN keys for the new copy: severity spotlight title/caption/percent label, trend section title + subtitle + legend, "why behind the data" national section title/subtitle, and the "Export / open data" section heading. Follow the existing `map.*` key conventions in `src/lib/i18n.tsx`.

## Motion & styling

- Reveal: `opacity 0→1`, `translateY 12px→0`, ~450ms ease-out, triggered once.
- Count-up: ~900ms ease-out.
- Recharts `isAnimationActive` for chart draw-in.
- All colors via existing semantic tokens / `RISK_HEX`; no hardcoded colors. Mobile-first (page is 390px wide in preview).

## Technical notes

- New timeseries fn is public read-only and anonymized — consistent with the existing `get_damage_*` public RPCs.
- Reveal/CountUp are written SSR-safe so they don't reintroduce hydration warnings.
- No new dependencies (Recharts already installed; reveal uses native IntersectionObserver).

## Out of scope

No changes to assessment flow, admin, or the underlying assessments table. No new tracking of personal data.