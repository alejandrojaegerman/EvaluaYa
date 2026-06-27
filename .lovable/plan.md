# EvalúaYa — required municipio dropdown, then full-flow testing

Two parts: first the municipio UX change you asked for, then the test suite from before.

## Part 1 — Make municipio a required, state-dependent dropdown

Today the Municipio field is an optional free-text input, and we only have centroids for ~33 municipios. Free text hurts data quality (typos, aliases) and the field is skippable. Change it to a required picker driven by the selected state.

### Data
- Add a complete `MUNICIPIOS_BY_STATE: Record<string, string[]>` to `src/lib/venezuela.ts` listing every official municipio for all 24 federal entities (335 total), each grouped under its state and sorted alphabetically.
- Keep the existing curated `MUNICIPIOS` centroids as-is for the map; names not in that subset still roll up to the state centroid via `resolveMunicipio` (unchanged).
- Add a `nearestMunicipio(lat, lng, state)` helper that snaps a detected coordinate to the closest curated municipio centroid within the detected state (used only for geo autopopulate).

### Property screen (`src/routes/assess/property.tsx`)
- Replace the free-text Municipio `Input` with a `<select>`:
  - Options come from `MUNICIPIOS_BY_STATE[state]`; the control is disabled with a "Selecciona primero el estado" placeholder until a state is chosen.
  - Mark it required (red asterisk like Estado), add it to the `missing` list and the `valid` gate, and add a `property.miss.municipality` validation hint.
  - When the state changes, reset the municipio selection so a stale value from another state can't persist.
- Geo autopopulate: in the existing geolocation effect, after setting the detected estado, call `nearestMunicipio` and prefill the municipio select (only when the user hasn't already chosen one) so location-based detection fills both fields.
- Draft load: if a saved draft has a municipio that exists in the current state's list, preselect it.

### i18n (`src/lib/i18n.tsx`)
- Update the Municipio label to drop the "(optional)" suffix, add the `property.miss.municipality` and a "select state first" placeholder string, in ES and EN.

### Notes / decisions
- The server schema (`assessment.functions.ts`) keeps `municipality` optional for backward compatibility with existing records and the engineer/offline paths; the requirement is enforced client-side in the flow.
- To avoid new drop-off, the dropdown will include a final **"No estoy seguro" / "Not sure"** option so a resident who genuinely doesn't know can still proceed while we still capture a controlled value instead of free text. (If you'd rather force a real municipio with no escape hatch, say so and I'll remove that option.)

## Part 2 — Full-flow tests (unchanged from prior plan)

After the municipio change is in, add the permanent suite and run the one-off verification pass with real AI:
- **Unit (Vitest):** `safety-rules`, `risk`, `building`, `phone`, `shakemap.spectralDemand`, `provisional`, AI-JSON parsing, plus `nearestMunicipio` / `MUNICIPIOS_BY_STATE` integrity (every state has ≥1 municipio, no dupes).
- **E2E (Playwright):** drive `/assess/property` → `/assess/checklist` → `/assess/analyze` → `/a/$publicId`, now also asserting Continue stays disabled until a municipio is picked; verify the result card, PDF, share/WhatsApp, and save-reports actions; a Red-forcing run validates safety rules end-to-end; and no-draft redirects.
- Run once, screenshot each step, fix any real bugs surfaced.

### Technical notes
- Dev deps `vitest` + `@playwright/test`; add `test`, `test:unit`, `test:e2e` scripts. Tests under `tests/`.
- E2E targets the running sandbox dev server (port 8080); real AI uses the existing `LOVABLE_API_KEY`.
- No changes to assessment scoring/prompts beyond genuine bug fixes.
