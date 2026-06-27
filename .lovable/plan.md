## Goal
Remove all "fuera del país / outside the country" (diaspora) framing across the app and refocus copy on people most affected on the ground in Venezuela right now. Keep the genuinely useful "someone can inspect on your behalf" capability — but reframe it around in-country realities (can't safely enter the building, staying in a shelter, a relative or neighbor nearby helping), not being abroad.

## Where the language lives
All of it is UI copy in `src/lib/i18n.tsx` (both the Spanish `es` block and the English `en` block). No logic or backend changes needed.

| Key | Current (problematic) | Reframe |
|-----|----------------------|---------|
| `home.behalfTitle` (ES) | "¿Fuera del país o en un refugio?" | "¿No puedes entrar al edificio?" |
| `home.behalfTitle` (EN) | "Outside the country or in a shelter?" | "Can't safely enter the building?" |
| `home.behalfBody` (ES) | "...para decidir si es seguro regresar." (frames user as away) | "No tienes que estar dentro. Un familiar o vecino puede hacer la inspección y compartirte el resultado para decidir si es seguro entrar." |
| `home.behalfBody` (EN) | "...so you can decide whether it's safe to return." | "You don't have to be inside. A relative or neighbor can run the inspection and share the result so you can decide whether it's safe to enter." |
| `property.behalfHint` (ES/EN) | "¿No estás en el sitio?..." / "Not on site?..." | Keep the helper idea, swap "regresar/return" → "entrar/enter"; no country reference (already clean, light wording polish only). |
| `result.shareOwnerTitle` / `result.shareOwnerBody` (ES/EN) | "...decida si es seguro regresar / safe to return." | Change "regresar/return" → "entrar/enter" so it reads for someone nearby, not returning from afar. |

## Approach
- Edit only the affected string values in the `es` and `en` translation maps in `src/lib/i18n.tsx`. Keys stay identical, so every consumer (`src/routes/index.tsx`, `src/routes/assess/property.tsx`, result page) picks up the new copy with no component edits.
- Wording principle: speak to a resident who is here and affected — displaced to a shelter, unable to enter a damaged building, or relying on a nearby relative/neighbor — never someone abroad or "returning to the country."
- Leave `public/llms.txt` as-is (it has no diaspora language) unless you'd like the summary reviewed too.

## Out of scope
No changes to the on-behalf feature behavior, sharing flow, or data model — copy only.