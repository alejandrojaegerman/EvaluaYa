# Technical Algorithm Spec for Expert Review

## Goal
Give your expert a single, code-level document that shows exactly how EvalúaYa decides Green / Yellow / Red — not the plain-language Methodology page. It will read like backend documentation: real source excerpts, the exact AI prompt, thresholds, and the override logic, with file references so he can see it maps to actual code.

## Deliverable
A downloadable **PDF spec** (`evaluaya-algorithm-spec.pdf`), hosted publicly so anyone with the link can open it, and linked from the Methodology page with a "Download technical spec" button.

## What goes in the spec
Pulled verbatim from the live code so it's accurate, not a paraphrase:

1. **Overview & pipeline** — the order of operations:
   ```text
   inputs (property + checklist answers + photos + GPS)
     -> ShakeMap MMI lookup (shakemap.ts)
     -> AI vision triage (Gemini 2.5 Flash, assessment.functions.ts)
     -> deterministic safety rules (safety-rules.ts)
     -> finalRisk = maxRisk(ai, rules)   // rules can only escalate, never downgrade
   ```
2. **Layer 1 — Deterministic safety rules** (`src/lib/safety-rules.ts`): the exact rule set and severity floors:
   - Force RED: URM structural type, liquefaction = yes, pounding = yes, severe plumbing/gas = yes.
   - Force ≥ YELLOW: MMI ≥ 7, floors > 7, vulnerable systems (CMF/CIW/PCF/RML).
   - The `maxRisk` merge function showing rules override the AI upward only.
3. **Layer 2 — AI triage** (`src/lib/assessment.functions.ts`): the **exact verbatim system prompt** (ATC-20-style), the model used (`google/gemini-2.5-flash`), the structured JSON output contract, and how photos (key photo per item) are passed.
4. **Seismic intensity** (`src/lib/shakemap.ts`): the bilinear MMI interpolation, conservative edge handling (max of neighbours), and MMI→Roman mapping.
5. **Inputs / schema** (`src/lib/assessment-types.ts`): the 13 checklist items (structural vs utilities), structural-system classifications, building age/type enums.
6. **Limits & disclaimers**: self-report, surface-level, not a certification, engineer confirmation required (mirrors the Methodology page).
7. **Source map**: a table listing each file and what it owns, so the expert can request specific files if he wants more.

## Hosting & linking
- Save the generated PDF to `public/evaluaya-algorithm-spec.pdf` so it's served at a stable public URL (`/evaluaya-algorithm-spec.pdf`).
- Add a "Download technical spec (PDF)" button in a new "For engineers / Para ingenieros" section on `src/routes/metodologia.tsx`, with bilingual i18n keys in `src/lib/i18n.tsx`.
- Also deliver the PDF as a downloadable artifact in chat so you can forward it to the expert immediately, before/independent of a publish.

## Technical notes
- The PDF is generated from the actual current source excerpts (monospace code blocks, syntax-faithful) so it can't drift into being a vague summary.
- No backend or schema changes; this is documentation + one static asset + a methodology-page link.
- The hydration console errors you may see on `/mapa` come from a browser password-manager extension (Dashlane) and are not an app bug — no fix needed.

## Out of scope
- Exposing a live "view source" route in-app (we chose the downloadable spec instead).
- Any change to the assessment logic itself — this only documents it.