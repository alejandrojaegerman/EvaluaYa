# Impact-ordered location pickers

Use the real damage data to surface the hardest-hit states and municipios first across every place people pick a location — the assessment flow, the volunteer signup, and the data room — while keeping the full, inclusive list one tap away.

## Ranking definition (severity-weighted)

A pure scoring helper ranks each area:

```text
impactScore = red×4 + orange×2 + yellow×1 + (total × 0.25)
```

Red/Orange dominate so danger hotspots rise even with few total reports (e.g. La Guaira: 8 reports but 7 red ranks above busier-but-safer areas). Total adds a small tiebreaker. Areas with `score = 0` are never "featured", only listed.

"Featured" = the top areas with a non-zero score, capped at 6 states (and top 5 municipios per state). Everything else stays available in a full, alphabetical list.

## Presentation: featured group + full list

- **Dropdowns** (assessment + data room): two `<optgroup>`s — `Zonas más afectadas / Most-affected areas` for the featured set, then `Todos los estados / All states` (alphabetical) for the rest. Municipio dropdown groups the same way for the chosen state.
- **Volunteer chips**: a highlighted "most-affected" row of chips at the top (subtle accent ring + a small flame/alert marker), then the full chip list below under a muted "Otras zonas / Other areas" label. Selection logic is unchanged — volunteers can still pick anywhere.
- Graceful fallback: if impact data fails to load (offline/SSR error), everything falls back to today's alphabetical list — no blank pickers.

## Where it applies

1. `/assess/property` — estado + municipio selects (the priority surface for affected residents).
2. `/voluntarios` — state coverage chips.
3. `DataRoomFilters` (`/datos`) — estado + municipio filter selects.

## Technical notes

- **Scoring helper** (new, in `src/lib/venezuela.ts` or a small `src/lib/impact.ts`): pure functions `scoreArea(counts)`, `rankStates(aggregates)`, `rankMunicipios(aggregates, state)` returning `{ featured: string[], rest: string[] }`. Unit-tested.
- **Data source**: reuse the existing public, anonymized `getDamageAggregates` server fn (state + municipality + red/orange/yellow/total). No DB or schema changes.
- **New server fn** `getImpactRanking` in `src/lib/stats.functions.ts` (public GET): calls `get_damage_aggregates`, returns `{ states: { featured, rest }, municipiosByState: Record<state, { featured, rest }> }`. One round-trip, anonymized counts only.
- **Assessment route**: add a `loader` that calls `getImpactRanking` (public, SSR-safe — no auth) with `errorComponent`/`notFoundComponent`; feed the grouped lists into the selects. Geo auto-detect, drafts, and `?estado=` preselect behavior stay intact.
- **Volunteers route**: extend the existing loader (already loads engineers) to also fetch the ranking; render featured vs. rest chips.
- **DataRoomFilters**: accept an optional ranking prop (passed from `/datos`, which already loads aggregates) and reorder/group the `ESTADO_NAMES` and municipio lists; keep `availableStates`/`availableMunicipios` filtering behavior.
- Bilingual i18n keys added for the new group labels (`picker.mostAffected`, `picker.allAreas`, `picker.otherAreas`).
- Typecheck + unit tests for the scoring helper before finishing.
