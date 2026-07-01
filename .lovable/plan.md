# Reframe photos as "encouraged" in the evaluation flow

## Goal
In the evaluation flow, stop calling photos "optional." Reframe them elegantly as **not required, but incredibly useful** — encouraged without adding friction or new UI.

## Scope
Copy-only edits in `src/lib/i18n.tsx` (Spanish + English). No layout, logic, or methodology changes. Only strings that appear during the assessment flow are touched; FAQ, privacy, and methodology descriptions stay as-is since they aren't part of the flow itself.

## Changes

**1. `property.effortHint`** (Step 1 subtitle) — currently: "Solo toma unos minutos. Las fotos son opcionales."
- ES → "Solo toma unos minutos. Las fotos no son obligatorias, pero ayudan muchísimo al análisis."
- EN → "It only takes a few minutes. Photos aren't required, but they help the analysis a lot."

**2. `checklist.photoHint`** (hint under a photo-less item) — reinforce encouragement without the word "optional."
- ES → "Una foto no es obligatoria, pero mejora mucho el análisis. Puedes usar fotos que ya tengas."
- EN → "A photo isn't required, but it greatly improves the analysis. You can use photos you already have."

**3. `checklist.photosOptional`** — realign the string so no stray "optional" phrasing remains if surfaced.
- ES → "Las fotos no son obligatorias, pero mejoran mucho el análisis."
- EN → "Photos aren't required, but they greatly improve the analysis."

`checklist.photoPromptYes` already frames photos as helpful and stays unchanged.

## Out of scope
- No changes to `help.faq.photosA`, `privacy.collect.b3`, or `methodology.checklistBody` (not part of the in-flow experience).
- No changes to scoring, validation, or which steps require input.
