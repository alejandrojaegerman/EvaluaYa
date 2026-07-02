# Be factual: "most reported", not "most affected"

## Goal
Stop implying earthquake impact ("zona más afectada" / "most affected" / "hardest-hit"). Always describe what EvalúaYa has actually **evaluated / reported**, never extrapolate beyond our own data. Align every offending string with the framing already used by `map.topAreas` ("Zonas con más reportes" / "Areas with most reports").

## Scope
Copy-only edits in `src/lib/i18n.tsx` (Spanish + English). No layout, logic, or data changes. Internal code comments in `src/lib/impact.ts`, `stats.functions.ts`, and route files mention "hardest-hit"/"most affected" but are never shown to users, so they stay untouched.

## Changes (Spanish + English)

**1. `picker.mostAffected`** — grouping label in every location picker (home, property step, volunteers, data room filters).
- ES: "Zonas más afectadas" → "Zonas con más reportes"
- EN: "Most-affected areas" → "Areas with most reports"

**2. `map.severityTopArea`** — the label in the screenshot (Severity spotlight on `/datos` and `/mapa`).
- ES: "Zona más afectada" → "Zona con más reportes"
- EN: "Most affected area" → "Area with most reports"

**3. `dataroom.narrativeArea`** — data room summary sentence on `/datos`.
- ES: "…{area} es la zona más afectada." → "…{area} es la zona con más reportes."
- EN: "…{area} is the hardest-hit area." → "…{area} is the area with the most reports."

## Already correct (no change)
- `map.topAreas` already reads "Zonas con más reportes" / "Areas with most reports".
- `map.severityCaption`, `dataroom.narrative`, and `dataroom.narrativeLow` already speak in terms of "evaluaciones/assessments" and "reporta daños/report damage" — factual, left as-is.

## Verification
Grep `src/lib/i18n.tsx` after the edit to confirm no user-facing "afectad" / "affected" / "hardest-hit" strings remain, then spot-check `/datos` (Severidad card) and a location picker.
