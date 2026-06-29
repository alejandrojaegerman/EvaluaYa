## Goal

Replace the abstract "Zonas" KPI on the `/mapa` page with a clearer **"Municipios"** count, and make the number accurate by counting distinct *normalized* municipios rather than raw, messy `state|municipality` strings.

## Why the count must change too

Today the KPI shows `totals.areas`, which the database computes as the count of distinct raw `state|municipality` text. That data is free-form and dirty, so it:
- counts `"Desconocido"` / unspecified locations as areas, and
- counts typos and casing variants separately (`petarr`, `baruta`, `Baruta` → 3 instead of 1).

So a plain relabel would show an inflated, imprecise "Municipios" number. The map page already imports `resolveMunicipio()` and uses it to build clean municipio groups, so we can derive an accurate count on the client with no database migration.

## Changes

1. **`src/routes/mapa.tsx`** — compute a normalized municipio count.
   - Derive a `municipioCount` from the existing `areas` (`AreaAggregate[]`) by running each through `resolveMunicipio(state, municipality)` and counting **distinct entries where `level === "municipio"`** (keyed by `stateName|name`). This naturally excludes "Desconocido"/unspecified and merges typos/casing.
   - Swap the KPI tile (currently `<CountUp value={totals!.areas} />` with `t("map.areasLabel")`) to display `municipioCount` with the new label key.

2. **`src/lib/i18n.tsx`** — update labels.
   - `map.areasLabel`: `"Zonas"` → `"Municipios"` (ES) and `"Areas"` → `"Municipalities"` (EN).
   - (Keep `map.topAreas` / other "zona" strings as-is — out of scope for this KPI.)

## Notes / scope

- Frontend + i18n only; no database migration. The RPC keeps returning `areas` (still used elsewhere); we just stop surfacing it in this KPI.
- The count reflects municipios with at least one report that resolve to a known curated municipio centroid — consistent with the rest of the map's municipio logic.

## Technical detail

```text
areas[] --resolveMunicipio()--> filter(level === "municipio")
        --dedupe by `${stateName}|${name}`--> municipioCount
```
