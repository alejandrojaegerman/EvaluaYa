# Revert the evaluation flow, keep everything else

## What I found

The **currently published** site (`tremor-check.lovable.app`) still runs the original evaluation flow:
- **3 steps**, with the technical inputs that feed the methodology: building type, **structural system**, **number of floors**, **approximate age** → these drive `safety-rules.ts` + seismic/`shakemap` demand.
- The 7 methodology-aligned checklist items: `foundation, exterior_walls, interior_walls, columns_beams, doors_windows, roof, stairs`.
- Photos optional.
- Already includes the legal rebrand ("hallazgos preliminares", "Evaluador Voluntario", legal consent gate).

The **current unpublished** code replaced that with the "Documento #2" simplification:
- Collapsed to a **2-step, photo-first flow** and consolidated the 7 items into a "4+1" set (`walls, columns, openings, tilt` + `damage_photos/facade` + a "señales graves" multi-select).
- This **breaks the strict item-by-item tie to the official methodology** (`assessment-types.ts` + `safety-rules.ts` were rewritten around the new IDs), which is exactly what you want reverted.

### The boundary
The clean split point is commit **`e743ece` (Jun 30, 21:11)** — *after* the legal rebrand but *before* the evaluation simplification began (~21:24 for `safety-rules.ts`, ~22:02 for `property.tsx`, ~00:19 Jul 1 for `checklist.tsx`). Restoring the evaluation files to that commit gives back the methodology-tied flow **and preserves the legal changes**. This matches what's live today. No DB migrations happened in this window, so restoring the old data shape is safe.

## Plan

### 1. Fully restore (pure evaluation-flow / methodology files)
Restore these from `e743ece` verbatim:
- `src/routes/assess/property.tsx` (brings back structural system / floors / age → methodology inputs, 3-step flow, legal gate intact)
- `src/routes/assess/checklist.tsx` (7 methodology items, Yes/No/Unsure per item)
- `src/routes/assess/analyze.tsx`
- `src/lib/assessment-types.ts` (original item IDs = single source of truth)
- `src/lib/safety-rules.ts` (methodology engine, original scoring)
- `src/lib/provisional.ts` (offline heuristic aligned to original items)
- `src/lib/assessment.functions.ts` (server save shape matching the live DB)
- `src/lib/checklist-illustrations.ts` (reconciled — see step 4)

### 2. Selectively reconcile mixed files (do NOT wholesale-revert)
These contain both reverted eval strings/logic **and** new keeper content:
- `src/lib/i18n.tsx` — revert only the evaluation-flow keys (property/checklist/step copy) to the `e743ece` versions; **keep** all new keys for official contacts, encyclopedia, breadcrumbs, remit-to-authorities, proceso oficial.
- `src/lib/pdf.ts` — restore the report layout to render the 7 original items; keep any purely additive/official framing.
- `src/routes/a/$publicId.tsx` — keep the "remit your report to authorities" additions; ensure it renders the reverted assessment data/items correctly.
- `src/components/ConnectEngineers.tsx`, `src/components/EngineerRequestCard.tsx` — **keep** (official-notice / remit links are non-methodology).

### 3. Delete files orphaned by the revert
Only referenced by the simplified flow:
- `src/lib/photo-guide-examples.ts`
- `src/lib/image-utils.ts` (image-validation used only by the new photo pipeline)
- `src/assets/photo-guide/*.jpg` (joint, rebar, scale, wide-close)
- `src/assets/checklist/tilt.jpg` (the `tilt` item does not exist in the restored flow)

`PhotoLightbox` stays — it's still used by `EngineerRequestCard`.

### 4. Keep the improved illustrations where the item survives
You explicitly liked the upgraded illustrations. The upgraded images for `doors_windows`, `roof`, `stairs`, `plumbing`, `liquefaction` map to items that **also exist in the restored methodology flow**, so I'll keep those upgraded JPGs and wire `checklist-illustrations.ts` to them for the original items. Only `tilt` (new-flow-only) is dropped.

### 5. Explicitly untouched (kept as-is — non-evaluation improvements)
Encyclopedia hub + all `guia.*` routes, `guia.proceso-oficial-funvisis`, `metodologia.tsx`, `OfficialDirectory` + `contactos-oficiales`, `EncyclopediaBreadcrumb`, `TopNav`/`BottomNav`/`Footer`/`AppShell` nav, `LiveQuakesPage`, homepage `index.tsx` cards/hero, `TransparencyBanner`, `venezuela.ts` location data, docs, official PDF assets, sitemap.

### 6. Verify
- `tsgo` typecheck + build (confirm no dangling imports after deletions).
- Run `tests/unit/safety-rules.test.ts` + `tests/e2e/assessment.spec.ts`.
- Playwright screenshot of `/assess/property` and `/assess/checklist` to confirm the flow matches the published 3-step methodology version.
- Spot-check that encyclopedia, official contacts, breadcrumbs, and nav remain intact.

## Technical notes
- Restoration uses `git checkout e743ece -- <file>` for step-1 files; steps 2 & 4 are hand-merged so nothing non-evaluation is lost.
- No schema/migration changes are involved; the reverted server function writes the same columns the live app already uses.
- If any kept file (e.g. `a/$publicId.tsx`) imports a symbol removed from `assessment-types.ts`, I'll adjust that reference during reconciliation so the build stays green.

## One confirmation before I build
I'm treating **`e743ece` (post-legal-rebrand, pre-simplification)** as the baseline — i.e. **keep** the legal rebrand (no automatic verdicts, "Evaluador Voluntario", consent gate) and revert only the flow simplification + methodology decoupling. If instead you want the legal rebrand also rolled back, tell me and I'll move the baseline earlier.