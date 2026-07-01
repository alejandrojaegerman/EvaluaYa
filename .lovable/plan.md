## Goal

Clean up the Enciclopedia page (`src/routes/guia.index.tsx`): remove redundancy, simplify the layout, and stop duplicating "Cómo funciona EvalúaYa" content that already lives on the Metodología page — linking back to it instead.

## Changes (all in `src/routes/guia.index.tsx`, frontend only)

### 1. Reduce header redundancy
- Remove the "Enciclopedia" kicker badge (the `<h1>` already says "Enciclopedia", so the badge repeats it). Drop the now-unused `BookOpen` import usage in the header and the `kicker` copy key.
- Keep the H1 and a single tightened intro line.

### 2. Simplify the layout
- Keep the featured **Proceso oficial de FUNVISIS** card and the guide groups.
- Move the mid-page self-assessment CTA to the **bottom** of the page (just above the disclaimer) so the top flows cleanly from header → featured → guides, rather than interrupting the list with a CTA. Keep it as the compact card it is now.

### 3. Replace the "Cómo funciona EvalúaYa" group
- That concept is covered on the Metodología page, and its two items ("Contactos oficiales", "Ayuda y preguntas frecuentes") aren't really "how it works".
- Rename the group heading to **"Más recursos" / "More resources"** and keep the two links there.
- Add a small text link at the end of that group: **"¿Cómo funciona EvalúaYa? Ver la metodología → /metodologia"** (EN: "How does EvalúaYa work? See the methodology"), so the removed concept points to its real home instead of being duplicated.

### 4. Copy cleanup
- Update the inline `COPY` objects (ES/EN): remove `kicker`, keep `h1`, tighten `intro`, add the `methodologyLink` label used in step 3. Rename the group `heading` from "Cómo funciona EvalúaYa" / "How EvalúaYa works" to "Más recursos" / "More resources".

## Notes
- No route, schema, or SEO/JSON-LD structural changes beyond the copy that feeds them (the ItemList still lists the same guide links).
- Purely presentational/content cleanup; no methodology or assessment logic touched.
