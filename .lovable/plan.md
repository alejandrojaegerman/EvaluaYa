# EvalúaYa — Engineering-grade triage upgrade

Adds professional structural-triage logic on top of the existing AI flow. New seismic-intensity, building-type, and inspection inputs feed a **deterministic safety-rule engine** that can override the AI result for life-safety-critical findings.

## 1. ShakeMap auto-intensity (GPS + event)

USGS publishes a compact MMI coverage grid per event (~64 KB, regular lat/lng grid). I'll interpolate the resident's coordinates against the active event's grid — no heavy downloads on the phone, all server-side.

- New table `seismic_events` (active event id, label, MMI grid JSON, bounding box). Seeded with the current event (M7.5 Yumare, `us6000t7zp`).
- Public server fn `getSeismicIntensity({ lat, lng })` → reads the active grid, bilinearly interpolates, returns an MMI number + Roman numeral (or `null` if outside coverage / no active event). Returns only the intensity, never the grid.
- Guarded server fn `setActiveShakemapEvent({ eventId, adminSecret })` → fetches the latest event's MMI coverage from USGS and stores it, so a new quake can be activated without a code change. Protected by a generated `SHAKEMAP_ADMIN_SECRET`.
- `property.tsx`: the existing GPS step (already used to detect estado) additionally calls `getSeismicIntensity` and stores the result on the draft. A small line shows "Intensidad sísmica estimada: VII" when available.

## 2. Property screen — structural building type (new question)

Keeps the current House / Apartment / Commercial question; adds a separate **structural type** question with plain-language labels:

- **URM** — Mampostería sin refuerzo (bloque/ladrillo sin estructura de concreto)
- **CMF** — Pórtico de concreto armado
- **CIW** — Pórtico de concreto con paredes de relleno
- **PCF** — Concreto prefabricado
- **RML** — Mampostería reforzada (baja altura)
- **No estoy seguro** (no rule applied)

(No "NBC" text exists in the app, so nothing to remove there.)

## 3. Inspection checklist — six new questions

Added to the existing 7, grouped by area:

- **Foundation** → new *liquefaction* question: sand boils, ground flooding away from water, lateral spreading/fissures, buried objects surfacing, tilted/sunk structures. (signs summarized in the help text)
- **Exterior walls** → new *pounding* question: did the building collide with an adjacent building?
- **Interior** → new *flooring* (buckling/displaced tiles, gaps at baseboards), *plumbing* (leaks/cracks/separation, rushing water or gas smell — "severe?"), *electrical* (tripped panels, damaged outlets, exposed wiring), *fixtures* (uneven light fixtures, pulled-apart junction boxes).

## 4. Deterministic safety-rule engine (overrides AI)

New `src/lib/safety-rules.ts`, applied server-side after the AI returns.

**Force RED — "No seguro para ingresar":**
- Structural type = URM
- Any liquefaction sign = Yes
- Pounding with adjacent building = Yes
- Severe plumbing damage = Yes

**Escalate to at least YELLOW — "Precaución adicional":**
- Seismic intensity ≥ VII
- More than 7 floors
- Structural type = CMF, CIW, PCF, or RML

Final level = the most severe of {AI level, rule floor}. Triggered rules append clear bilingual reasons to the result's findings and next steps so the resident sees *why* (e.g. "Edificio de mampostería sin refuerzo: no es seguro ingresar"). The new inputs are also passed into the AI prompt so its written explanation stays consistent.

Risk level drives the result card, PDF, share cards, and community map already, so overrides flow through automatically. New questions appear in the result list and PDF since those iterate the checklist.

## Technical notes

- **Types** (`assessment-types.ts`): add `StructuralType`; extend `PropertyInfo` with `structuralType?` and `seismicIntensity?`; add checklist item ids `liquefaction`, `pounding`, `flooring`, `plumbing`, `electrical`, `fixtures`; extend `CHECKLIST_ITEMS`.
- **Server validation** (`assessment.functions.ts`): widen `answerSchema` id enum and `answers` max to 13; add `structuralType` + `seismicIntensity` to the property schema; build prompt with the new context; run `safety-rules` after `parseAiJson`, override `risk_level`, merge reasons; store new property fields.
- **i18n**: add ES/EN keys for structural types, the six new questions + help text, intensity labels, and rule-reason strings.
- **DB**: migration creates `seismic_events` with GRANTs (service_role full; no anon — read happens via server fn) and RLS; seed the active event grid via a data insert after the table exists.
- **Intensity math**: bilinear interpolation over the regular grid (start/stop/num axes); MMI→Roman mapping; clamp to coverage bbox.
- Worker-safe: only `fetch` + JSON parsing server-side; nothing Node-native.

## Out of scope
- No login/admin UI for switching events (handled by the guarded server fn + secret).
- Existing records keep their stored risk level; rules apply to new assessments only.
