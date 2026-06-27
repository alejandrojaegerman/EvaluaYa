# Make the assessment flow easier to understand

Three improvements, all Spanish-first (with matching English), focused on the evaluation flow:

1. **Simple line illustrations** inside each checklist item's existing "¿Cómo se ve?" toggle
2. **Plainer wording** for the 13 checklist questions and the Property Info screen
3. **A mini glossary** — tap-to-define helper for unavoidable technical terms

Nothing changes in the analysis logic, scoring, or data model — this is wording + visuals only.

---

## 1. Visual examples (line illustrations)

Generate one clean, two-panel line illustration per checklist item: left panel shows the damage (❌), right panel shows the healthy version (✅), drawn in the brand teal (#0f3443) on a light background — minimal, diagram-style, no photos.

- 13 illustrations (foundation, liquefaction, exterior walls, pounding, interior walls, columns/beams, doors/windows, roof, stairs, flooring, plumbing, electrical, fixtures).
- Stored as externalized CDN assets (via lovable-assets) so the repo stays light; a small map (`src/lib/checklist-illustrations.ts`) links each item id → image URL.
- Rendered **inside the existing collapsible toggle**, above the ✅/❌ text. Because the toggle is collapsed by default, images load lazily (`loading="lazy"`) only when a user taps "¿Cómo se ve?" — keeps the page fast on low bandwidth.
- Each image gets descriptive bilingual alt text; the ✅/❌ text stays as the primary explanation so the meaning never depends on the image alone.

## 2. Plainer wording

Rewrite the inspection questions in everyday Spanish, keeping the technical term in parentheses so engineers/authorities still recognize it. Examples:
- "¿Hay concreto desprendido (descascarado) o acero (cabilla) expuesto?" → "¿Se cayó un pedazo de concreto y se ven las varillas de metal por dentro (cabilla expuesta)?"
- "licuefacción del suelo" → "el suelo se ablandó y brotó agua o arena (licuefacción)"
- "golpeteo entre edificios" → "tu edificio chocó con el de al lado (golpeteo)"
- "nuevos espacios entre el piso y el rodapié" → "espacios nuevos entre el piso y el borde de la pared (rodapié)"

Property Info screen: simplify labels and add a short plain-language helper line under building type and approximate age (e.g. age ranges phrased as "Antes de 1970 — construcción más antigua").

English strings updated to match.

## 3. Mini glossary

A small, accessible tap-to-define helper for the handful of unavoidable terms (cimientos, cabilla, viga, columna, licuefacción, rodapié, golpeteo, breaker).

- New `GlossaryTerm` component built on the shadcn Popover (keyboard + screen-reader friendly): a term shown with a dotted underline that opens a 1–2 sentence plain definition on tap.
- Definitions stored in the i18n dictionary (`glossary.*`) in both languages.
- Surfaced as a compact "Términos" chip row beneath each relevant checklist question, so only the terms used in that item appear. This avoids fragile inline text parsing while keeping definitions one tap away.

---

## Technical notes

- **Files touched:** `src/lib/i18n.tsx` (reworded questions, property labels, new `glossary.*` keys), `src/routes/assess/checklist.tsx` (render illustration + glossary chips in the toggle), `src/routes/assess/property.tsx` (simpler labels/helpers).
- **New files:** `src/components/GlossaryTerm.tsx`, `src/lib/checklist-illustrations.ts`, and 13 `*.asset.json` pointers for the illustrations.
- **No DB / server-function / scoring changes.** Item ids and answer values are untouched, so existing reports, the AI prompt, and the map stay compatible.
- **Performance:** illustrations are lazy-loaded only when the example toggle is opened.

I'll verify with a typecheck and a quick render check of an expanded checklist item before finishing.
