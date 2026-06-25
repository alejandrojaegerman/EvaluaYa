# Plan: Data-driven seismic logic from the ShakeMap HDF

Today the only geographic signal is one rule (`MMI ≥ 7 → caution`) plus an MMI line in the AI prompt. The uploaded `shake_result.hdf` (real M7.5 Yumare / Venezuela event `us6000t7zp`) contains much richer per-location data. We'll extract it, store it as the active event, and use it to drive **both** the deterministic safety rules and the AI context.

## New seismic signals we'll use

- **PGA** (peak ground acceleration, in %g) — graduated shaking-demand bands
- **PGV** (peak ground velocity, cm/s) — secondary demand indicator
- **Period-matched spectral demand** — estimate the building's natural period `T ≈ 0.1 × floors`, then read the matching spectral acceleration band (0.3s for low-rise, 1.0s/3.0s for taller). This is the most building-specific engineering signal: it asks "how hard was *this kind of building* shaken?"
- **Soft-soil amplification (vs30)** — flag NEHRP soil class D/E (vs30 < 360 / < 180 m/s) where shaking amplifies and liquefaction risk rises

## What changes for the resident / SME

- The result card gains a short "Seismic context" block (PGA, soil class, demand at building's height).
- Red/Yellow can now be raised by graduated, defensible seismic thresholds — not just MMI ≥ 7.
- The methodology page and validation docs get updated so the SME can still trace every rule to code.

## Decision logic (graduated, conservative)

Seismic metrics mainly **amplify** observed damage and add caution; they only force Red in extreme combinations, to avoid false "evacuate" calls on visibly-undamaged buildings.

```text
MMI:        VI–VII  -> caution      VIII+ -> strong caution (red if any structural "yes")
PGA:        >=0.25g -> caution      >=0.50g -> strong caution
Spectral:   high demand at building period -> caution; +vulnerable structure -> red
Soft soil:  vs30<360 -> caution + amplification note; vs30<180 -> reinforce liquefaction
Combos:     (MMI VIII+ or PGA>=0.5g) AND (URM / any structural "yes") -> red
```

## Build steps

### 1. Extract the HDF into a compact multi-layer grid (one-off)
Python script reads `arrays/imts/GREATER_OF_TWO_HORIZONTAL/{MMI,PGA,PGV,SA(0.3),SA(0.6),SA(1.0),SA(3.0)}/mean` and `arrays/vs30`, converts the ln-unit IMTs to physical units (PGA/SA → g via `exp`, PGV → cm/s), downsamples ~3× (≈0.05°/~5 km) to keep the JSON ~1–2 MB, and writes a `SeismicGrid` JSON. Output seeded into the `seismic_events` row for event `us6000t7zp` as the single active event (replacing the MMI-only grid).

### 2. Extend the seismic types & lookup (`src/lib/shakemap.ts`)
- Generalize `MmiGrid` to `SeismicGrid` (shared axes + `layers: Record<LayerKey, (number|null)[]>`).
- Add `seismicAt(grid, lat, lng)` → `{ mmi, roman, pga_g, pgv_cms, sa: {0.3,0.6,1.0,3.0}, vs30 }` reusing the existing bilinear interpolation, plus helpers `buildingPeriod(floors)`, `spectralDemandAt(grid, lat, lng, floors)`, and `soilClass(vs30)`.
- Keep `intensityAt` as a thin wrapper for backward compatibility.

### 3. Lookup server function (`src/lib/shakemap.functions.ts`)
`getSeismicIntensity` returns the full enriched object (MMI + PGA + PGV + period-matched SA + soil class) instead of MMI only. The full grid still never leaves the server.

### 4. Property capture (`src/lib/assessment-types.ts`, `src/routes/assess/property.tsx`)
Add optional fields to `PropertyInfo`: `pga`, `pgv`, `vs30`, `soilClass`, `spectralDemand`, `buildingPeriod`. GPS auto-detection already runs here; populate these from the enriched lookup alongside the existing MMI fields. No new user input required.

### 5. Deterministic rules (`src/lib/safety-rules.ts`)
Replace the single `intensity` rule with the graduated rule set above (new i18n keys `rule.pga.*`, `rule.spectral.*`, `rule.softsoil.*`, graduated `rule.intensity.*`). Pass the new property fields + `floors` into `evaluateSafetyRules`. Findings surface in plain Spanish/English.

### 6. AI context (`src/lib/assessment.functions.ts`)
Extend the property zod schema and `buildPrompt` to include PGA (%g), PGV, the building's estimated period and the spectral demand at that period, and soil class — with short decision-guidance lines. `SYSTEM_PROMPT` gets a sentence on interpreting demand vs. building height.

### 7. Result display (`src/routes/a/$publicId.tsx`)
Compact "Contexto sísmico / Seismic context" block: shaking (PGA %g + MMI), soil class, and demand at the building's height.

### 8. Docs (methodology + validation)
Update `src/routes/metodologia.tsx` and regenerate the Spanish/English validation PDFs so every new threshold maps 1:1 to the code for the SME.

## Technical notes
- HDF IMTs are natural-log; convert during extraction so stored/displayed values are physical units.
- Grid stays server-side; only the per-point result is returned.
- `seismic_events.grid` already holds JSON — schema unchanged, just a richer payload (well within jsonb limits after downsampling).
- USGS multi-metric live refresh for *future* quakes is intentionally out of scope (per your choice); `setActiveShakemapEvent` keeps working for MMI and can be extended later.
