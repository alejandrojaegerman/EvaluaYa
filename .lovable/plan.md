# Closing Vero's remaining feedback (#3, #4, #5)

Audit result: #1 (legend), #2 (✅/❌ visuals), #6 (Orange tier) and #7 (new-damage banner) are already live. Three gaps remain. Building smallest → largest.

## Phase 1 — #4 Optional building / tower name

Today the building name is only guessed from the address via regex (`src/lib/building.ts`), so most residents never contribute one and the community/building aggregation stays sparse. Add an explicit, optional input.

- `src/lib/assessment-types.ts`: add `buildingName?: string` to `PropertyInfo`.
- `src/routes/assess/property.tsx`: add an optional "Building / tower name" input under Address. Prefill it (once) from `extractBuilding(address)` when the user types an address, but let them edit/clear it. Helper text: *don't include your apartment number*. Save to draft.
- `src/lib/assessment.functions.ts`: add `buildingName` to `analyzeSchema.property`. At insert, prefer the user-typed name over the inferred one; set `building_inferred = false` when the name came from the field, compute `building_key` from it.
- i18n keys (ES/EN): `property.buildingName`, `property.buildingNamePlaceholder`, `property.buildingNameHint`.

No schema change — `building_name` / `building_key` / `building_inferred` columns already exist.

## Phase 2 — #3 Onboarding: someone can inspect on your behalf

People in shelters or abroad need this most but the flow assumes you're standing in the building. Add framing + a clear share nudge.

- `src/routes/index.tsx`: add a short callout near the top CTA — *"Outside the country or in a shelter? A relative or neighbor can run this inspection for you and share the result."*
- `src/routes/assess/property.tsx`: one-line hint at the top of step 1 reinforcing that you can inspect on behalf of an absent owner.
- `src/routes/a/$publicId.tsx` (result): add a line above the existing WhatsApp/PDF share encouraging the user to send the result to the owner or an engineer.
- i18n keys (ES/EN): `home.behalfTitle`, `home.behalfBody`, `property.behalfHint`, `result.shareWithOwner`.

Presentation-only; reuses the existing share + PDF machinery.

## Phase 3 — #5 Resident vs. professional reports (via engineer panel link)

`report_type` and `verified_by_engineer` columns exist but are unused (all 113 rows are `resident`). Wire engineer-certified reports through the existing private panel token and differentiate them on the map.

**Submission path**
- `src/routes/voluntarios.panel.$token.tsx`: add a "Start a professional evaluation" button that launches the normal assessment flow carrying the engineer token (passed via search param `?eng=<token>`, persisted into the draft so it survives the multi-step flow).
- `src/lib/assessment.functions.ts`: add optional `engineerToken` to `analyzeSchema`. In the handler, look up `volunteer_engineers` by `access_token` (approved + non-expired) with `supabaseAdmin`. If valid → set `report_type = 'professional'` and `verified_by_engineer = engineer.id`; otherwise default `'resident'`. Never trust the flag without a valid token.
- `getAssessment`: map `report_type` and `verified_by_engineer` into `AssessmentRecord`.

**Surfacing**
- `src/routes/a/$publicId.tsx`: show a "Professional report · verified by engineer" badge when `report_type === 'professional'`.
- `src/components/DamageMap.tsx`: the aggregates already return a `verified` count per area. Add a verified marker to bubbles that contain ≥1 professional report (e.g. a solid ring/✓ outline vs. the dashed/plain self-reported style), show "X verified by an engineer" in the popup, and add a legend row distinguishing verified vs. self-reported pins.
- `src/routes/mapa.tsx`: thread the `verified` value into `mapBubbles` and the legend.
- i18n keys (ES/EN): `result.professionalBadge`, `map.legendVerified`, `map.legendSelfReported`, `map.verifiedCount`, `panel.startProfessional`.

No schema change — both columns already exist.

## Technical notes
- Engineer-token validation happens server-side in the analyze handler; the panel token is a UUID `access_token` already used by `getEngineerPanel`.
- Pin differentiation is by aggregate (municipality/state) since pins are aggregated — a verified area gets a distinct outline, not a per-report pin.
- All other changes are frontend/presentation plus the one server-function field addition.

## Out of scope
- An in-flow "I'm an engineer" self-toggle (you chose panel-link only).
- Re-validating the AI risk model against local engineers (Vero's side-suggestion in #6) — separate effort.
