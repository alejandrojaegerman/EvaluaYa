# Deduce building names & group same-building reports

Many addresses already embed a building/house name — `edificio uracoa`, `Res.Doral Plaza`, `C.R. Bosques del Neveri`, `Qta. ...` — while plenty are just neighborhoods with none. We'll extract a building name where one exists, store a normalized key, and use it so two evaluations of the same building are recognized — in the resident's result, the AI triage, and the admin views.

## How a building is identified

A building match = same **estado + municipio + normalized building key**. We never group on address text alone (too messy) and never across municipios. Records with no detectable building name simply have no key and are never grouped.

## 1. Extraction logic (parser + AI fallback)

New file `src/lib/building.ts`:
- `extractBuilding(address)` — deterministic parser. Recognizes Venezuelan markers: `Edificio/Edif/Ed.`, `Residencias/Res./Resd.`, `Conjunto Residencial/C.R./Cjto`, `Torre`, `Quinta/Qta.`, `Bloque`, `Urb.`-named buildings, etc. Returns `{ name, key } | null`.
- `buildingKey(name)` — accent-stripped, lowercase, punctuation-collapsed key for grouping (reuses the same normalization style as `venezuela.ts`).
- Pure, offline, no cost — runs at assessment time for every new record.

AI fallback is used only where the parser finds nothing, during the backfill (below) — it's the accuracy boost without adding latency/credits to every live analysis.

## 2. Database

Migration adds to `public.assessments`:
- `building_name text` (display) and `building_key text` (grouping)
- `building_inferred boolean default false` (idempotency guard for backfill, mirrors `geo_inferred`)
- index on `(state, municipality, building_key)`

New `SECURITY DEFINER` RPCs (search_path pinned, mirroring existing ones):
- `get_building_peers(_state, _municipality, _building_key)` → anonymized counts only: total + green/yellow/red breakdown + last_report. **No addresses, ids, or photos.**
- `get_admin_building_clusters(_state default null)` → buildings with 2+ reports: name, municipio, counts by risk, last report — admin-only via existing service-role broker.

## 3. Auto-extract on new assessments

In `analyzeAssessment` (`src/lib/assessment.functions.ts`): run `extractBuilding(property.address)` before insert and persist `building_name` / `building_key`.

## 4. AI analysis context

Before the triage call, look up `get_building_peers` for the new record's building. If prior analyzed reports exist, add one line to the prompt (e.g. *"N previous evaluations from this same building: X red / Y yellow / Z green"*) so the model weighs neighbor damage. Purely additive context; deterministic safety rules unchanged.

## 5. Resident result card

New `SameBuildingCard.tsx` shown on `/a/$publicId` only when a building key resolved **and** peer count > 0:
- "Otras N evaluaciones de este edificio" with a small red/yellow/green breakdown
- Plain-language note: structural problems often affect a whole building; encourage comparing with neighbors / sharing with the building's administration
- Bilingual via `i18n.tsx`
- Fed by a public server fn wrapping `get_building_peers` (counts only — keeps the privacy posture you set: building grouping stays on the owner's result + admin, never the public map).

## 6. Admin

Add a "Buildings with multiple reports" panel to `/admin` (and the zona drill-down) using `get_admin_building_clusters`: building name, municipio, report count, risk mix. Helps spot a single structure generating several red flags.

## 7. Backfill existing records

New `scripts/backfill-buildings.ts` (mirrors `scripts/backfill-geo.ts`):
- DRY-RUN by default; `--apply` to write
- Only rows with `building_inferred = false`; only fills empty `building_key`; sets `building_inferred = true` when it fills something (idempotent, re-runnable)
- Parser first; for rows where the parser finds nothing, batch the addresses to the AI gateway (same pattern as geo backfill) to propose a building name, accepted only when clearly a named structure
- Prints a plan first so you can review before applying

## Technical notes
- New table columns get GRANTs in the same migration; RPCs are `SECURITY DEFINER` with `set search_path = ''`/`'public'` consistent with existing functions, and execute is not granted to anon (brokered through the service role like the other stats RPCs).
- Resident peer counts and admin clusters expose **aggregates only** — no addresses, report ids, or photos — preserving the existing "no re-identification" stance.
- No change to the public map or `/zona` SEO surfaces.

## Files
- **New:** `src/lib/building.ts`, `src/components/SameBuildingCard.tsx`, `scripts/backfill-buildings.ts`
- **Edited:** `src/lib/assessment.functions.ts` (extract + peer context), `src/lib/assessment-types.ts` (add `buildingName` to `PropertyInfo`/record), `src/lib/stats.functions.ts` (peer + cluster server fns), `src/routes/a/$publicId.tsx`, `src/routes/admin.index.tsx`, `src/routes/zona.$estado.tsx`, `src/lib/i18n.tsx`
- **Migration:** columns + index + two RPCs
