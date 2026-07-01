## Goal

Replace the large legal/consent block at the end of the evaluation checklist (Step 2) with a standard, minimal-footprint disclaimer: a single line of fine print that summarizes the notice and links to the full legal notice. Consent becomes **implied** by tapping **Analyze** — no checkboxes — so the button is reachable immediately.

## Current state

At the bottom of `src/routes/assess/checklist.tsx`, `LegalConsentInline` renders a boxed section with a title, subtitle, three icon+text clauses, a "read full notice" link, and **two required checkboxes**. The Analyze button is disabled until both are checked (`nextDisabled={!allRequired || !consentGiven}`). Consent is stamped into the draft only when both boxes are checked.

## Changes

### 1. `src/components/LegalConsentInline.tsx` — shrink to fine print
- Remove the boxed card, icons, three clauses, and both checkboxes.
- Render a single compact fine-print paragraph (small, muted text) that summarizes: independent/non-official initiative, preliminary visual findings only (no technical ruling), and that tapping Analyze accepts the legal notice and authorizes data processing for report management.
- Inline link "Leer el aviso legal completo / Read the full legal notice" → `/legal` (opens in new tab), reusing the existing `gate.readFull` key.
- Drop the checkbox props (`acceptLegal`, `acceptData`, `onChangeLegal`, `onChangeData`, `showError`). The component becomes presentational fine print with no state.

### 2. `src/routes/assess/checklist.tsx` — implied consent
- Remove `acceptLegal` / `acceptData` / `consentError` state and the `consentGiven` derived value.
- Update the footer to gate only on answers: `nextDisabled={!allRequired}`.
- On continue (tapping Analyze), always stamp a fresh versioned consent record into the draft (call `setLegalConsent()` unconditionally in `persist`), since tapping the button now constitutes acceptance.
- Render the compact `LegalConsentInline` fine print directly above the `StepFooter` (so the resident sees the summary right before the button).
- Remove now-unused imports/handlers tied to checkbox state.

### 3. `src/lib/i18n.tsx` — new summary string
- Add one key (ES + EN), e.g. `gate.finePrint`:
  - ES: "EvalúaYa es una iniciativa independiente y comunitaria (no oficial) que solo genera hallazgos visuales preliminares, no dictámenes técnicos. Al tocar Analizar aceptas el aviso legal y autorizas el tratamiento de tus datos para gestionar tu reporte."
  - EN: equivalent.
- Keep the existing `gate.readFull` key for the link. Existing `gate.*` clause/checkbox keys stay in place (still used on the `/legal` page and unaffected elsewhere).

## Notes / preserved behavior
- The versioned consent record (`LEGAL_VERSION` / `CONSENT_VERSION` via `setLegalConsent()`) is still persisted per assessment, so the legal audit trail is unchanged — only the UX shifts from explicit checkboxes to implied acceptance on the Analyze tap.
- No scoring/methodology logic changes.
- The `/legal` route already exists and remains the full-text destination.
