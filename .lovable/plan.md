# Update Ayuda (Help Center) content

The help center copy predates several shipped features. Goal: bring it current without redesigning the page. All changes are copy-only, in `src/lib/i18n.tsx` (ES + EN `help.*` keys) plus one small array edit in `src/routes/ayuda.tsx`.

## What's out of date

1. **Risk colors show only 3 tiers.** `help.faq.resultsA` and `help.step3Desc` still say "Verde / Amarillo / Rojo". The app now uses a 4-tier taxonomy including 🟠 **Naranja / Orange (Serious)**.
2. **No mention of requesting a verified engineer.** The app now lets residents send a help request after their assessment and get contacted by a verified volunteer engineer at no cost. There's no FAQ explaining this.
3. **No "report only NEW damage" guidance**, which is now part of the assessment framing.
4. **No guidance on assessing on behalf of someone else** (a neighbor or relative in a shelter), which onboarding now supports.

## Changes

### A. Fix risk-level copy (existing keys)
- `help.faq.resultsA` (ES/EN): rewrite to 4 tiers — Verde (sin riesgo evidente), Amarillo (precaución, busca revisión), Naranja (daño serio, limita el uso y busca revisión pronto), Rojo (peligro grave, evacúa y contacta autoridades).
- `help.step3Desc` (ES/EN): change "(Verde / Amarillo / Rojo)" to "(Verde / Amarillo / Naranja / Rojo)".

### B. Add new FAQ entries (new keys + render list)
Add three new FAQ pairs to both language blocks in `src/lib/i18n.tsx`:
- `help.faq.engineerQ/A` — "¿Puedo pedir que un ingeniero revise mi caso?" → after the assessment you can send a free request; a verified volunteer engineer is notified and may contact you by WhatsApp to confirm or adjust the result. Links conceptually to the results screen.
- `help.faq.newDamageQ/A` — "¿Qué daños debo reportar?" → report only NEW damage caused by the recent quake, not pre-existing cracks, so results stay accurate.
- `help.faq.behalfQ/A` — "¿Puedo evaluar por otra persona?" → yes, you can complete an assessment on behalf of a neighbor or relative (e.g. someone in a shelter) using what you can observe or photos they send.

Then update `FAQ_KEYS` and the `faqs` array in `src/routes/ayuda.tsx` to include `engineer`, `newDamage`, `behalf` so they render in the page and in the FAQ JSON-LD schema. Order: place `engineer` after `results`, `newDamage` after `photos`, `behalf` after `signup`.

### C. Light wording refresh
- `help.faq.officialA`: keep, already accurate (mentions licensed engineer + Civil Protection).
- Verify all engineer references say "verified" (not geographic proximity), consistent with prior copy decisions.

## Out of scope
- No layout/visual changes to the page.
- No changes to the actual assessment, results, or engineer-request logic — copy only.
- `public/llms.txt` already lists `/ayuda`; no change needed there.

## Technical notes
- `src/lib/i18n.tsx` has two parallel maps (ES around lines 533–577, EN around 1626–1670). Every new key must be added to BOTH or the typed `t()` lookups break.
- `FAQ_KEYS` in `ayuda.tsx` drives both the rendered accordion and the `FAQPage` JSON-LD, so the new keys must exist before referencing them.
