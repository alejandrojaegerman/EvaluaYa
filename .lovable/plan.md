# Quick wins: more completed assessments + better sharing

Tight, high-impact changes only — no new systems. Goal: get more people from Home all the way to a finished result, and make every finish spread the app. The public **Mapa** logic stays as-is; changes are frontend/presentation + copy.

## 1. Kill silent dead-ends in the flow (biggest conversion leak)

Right now the **Continue / Analyze** buttons just go disabled with no reason shown — a common drop-off cause on mobile.

- **Property step**: when Continue is disabled, show a small inline hint listing exactly what's still missing (e.g. "Falta: estado, tipo de edificio, antigüedad"). The button stays prominent; the hint sits just above the footer.
- **Checklist step**: when Analyze is disabled, show "Te faltan X de Y preguntas" inline instead of only a toast on tap.
- Make the disabled state visually clearly "almost there" rather than dead (keep enabled-looking with the hint), so people know it's reachable.

## 2. Lower perceived effort up front

- **Home hero**: tighten the sub-copy and reinforce the three things that reduce hesitation — free, ~3 minutes, no photos required. Keep the existing trust pills.
- **Property step**: add a one-line reassurance under the header ("Solo toma unos minutos. Las fotos son opcionales.") so people don't bail expecting a long form.
- **Checklist**: make the "photos optional" message more visible near the top so users don't think every item needs a photo.

## 3. Turn every finish into a share (growth flywheel)

- **Result page**: after a result, surface a focused "share so your neighbors check too" prompt with WhatsApp as the primary one-tap action (WhatsApp is the dominant channel in Venezuela), reusing the existing share-card image generation.
- **Consistent WhatsApp-first**: align share copy and ordering across `ShareApp`, the result page, and the map so WhatsApp is always the first, biggest button.
- **Sharper share copy**: rewrite `share.message` / `share.body` to be more compelling and action-oriented in both ES and EN (current copy is generic).

## 4. Whole-app polish

- **Spacing/overlap audit**: confirm the fixed `StepFooter` and global `BottomNav` never overlap content on small screens; add consistent bottom padding where missing.
- **Microcopy + empty states**: tighten loading, error, and empty-state wording for clarity and warmth (analyze states, map empty state, no-history home).
- **Touch targets & focus states**: quick pass to ensure tappable controls are ≥44px and have visible focus rings for accessibility.
- Quietly confirm the console hydration warning is only from the user's Dashlane browser extension (it injects `data-dashlane-*` attributes), not our code — no app fix needed.

## Technical notes

- Changes are confined to: `src/routes/index.tsx`, `src/routes/assess/property.tsx`, `src/routes/assess/checklist.tsx`, `src/routes/a/$publicId.tsx`, `src/components/ShareApp.tsx`, `src/routes/mapa.tsx`, and bilingual string additions in `src/lib/i18n.tsx`.
- No backend, schema, RLS, or server-function changes. No new dependencies.
- All new colors/styles use existing semantic tokens; new strings added to both `es` and `en` in `i18n.tsx`.

## Out of scope (per your choices)
- No bigger redesign or new features this round.
- Mapa stays damage-only.
