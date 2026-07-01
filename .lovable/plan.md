## Goal
Tidy the Sala de datos (`/datos`) page: drop the "Revisado por evaluador" KPI, reduce how often the word "hallazgos" appears, and — on mobile only — lead with the Tendencia (trend) chart.

## 1. Remove the "Revisado por evaluador" KPI
In `src/routes/datos.tsx` (headline counters, ~lines 825–838), delete the fourth `<Stat>` that renders `totals.verified` / `t("map.verified")`. Change the grid from `grid-cols-2 md:grid-cols-4` to `grid-cols-3` so the three remaining counters (Evaluaciones, Municipios, Hallazgos serios o severos) stay balanced.

The `map.verified` i18n key and the `verified` field stay in place — they're still used by the map bubbles and the glossary/dictionary — only the headline KPI tile is removed.

## 2. Reduce repetition of "hallazgos"
Currently the Resumen tab shows "hallazgos" three times above the fold: the KPI "Hallazgos serios o severos", the Severidad card titled again "Hallazgos serios o severos", and the Distribución card "Distribución de hallazgos".

- Reword the Distribución card title key `map.distribution`: "Distribución de hallazgos" → "Distribución por nivel" (ES) / "Distribution by level" (EN). This reads clean and also improves the shared usage on the map/zona pages.
- On `/datos`, give the Severidad card a distinct title so it no longer echoes the KPI verbatim: keep the "Severidad" eyebrow and set the card title to "Casos que priorizar" (ES) / "Priority cases" (EN) via a small datos-scoped key. The KPI keeps the exact metric name "Hallazgos serios o severos".

Net effect on the Resumen tab: "hallazgos" drops from 3 mentions to 1 (the KPI metric name). No changes to result-page, methodology, or legal copy.

## 3. Mobile: lead with the Tendencia chart
In the Resumen `TabsContent` (~lines 880–919), the order is currently: severity+distribution grid, then the trend chart. Convert that container to `flex flex-col gap-4` and apply order utilities so on mobile the trend block is `order-1` and the severity/distribution grid is `order-2`, while at `md:` and up both reset to `md:order-none` (natural document order — grid first, then trend). Desktop layout is unchanged.

## Files
- `src/routes/datos.tsx` — remove KPI + adjust grid; reorder Resumen tab for mobile; point the Severidad card title at the new key.
- `src/lib/i18n.tsx` — reword `map.distribution` (ES + EN); add the new Severidad card title key (ES + EN).
