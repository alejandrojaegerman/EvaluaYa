# Grow reach & visibility: regional landing pages + smoother assessment

You picked **Assessment experience** + **Reach & engagement**, optimizing for **Growth & visibility**. Today only 4 URLs are discoverable (home, property, map, methodology), and there's no organic on-ramp for someone Googling "daños sismo Miranda". This plan adds search-discoverable regional pages and tightens the path from "I found it" → "I finished an assessment" → "I shared it".

## 1. Public regional landing pages (the main growth engine)

A new public route `src/routes/zona.$estado.tsx` rendering one page per Venezuelan state (e.g. `/zona/miranda`, `/zona/distrito-capital`).

Each page includes:
- **Unique SEO head()** — title like *"Evaluación de daños estructurales en Miranda — EvalúaYa"*, matching meta description, canonical, Open Graph + Twitter card, and `JSON-LD` (`WebPage` + `BreadcrumbList`). Pulls the per-state OG image (reusing the existing branded result OG style).
- **Live anonymized stats for that state** — total assessments, green/yellow/red split, municipios covered, last report date. Sourced from a new public server fn that filters the existing `get_damage_aggregates` data by state (no new table; anonymized counts only, never addresses/photos).
- **Region-aware primary CTA** — "Evaluar mi vivienda en {estado}" that deep-links into the assessment with the state preselected.
- **Local trust + methodology + map** internal links.
- Bilingual via existing `useLang`.

Slugs map to `ESTADOS` in `src/lib/venezuela.ts` via a small slug↔name helper (added there). Unknown slugs → `notFoundComponent`; route also gets `errorComponent` per project rules.

## 2. Region-aware assessment entry (assessment experience)

- The property step (`src/routes/assess/property.tsx`) reads an optional `?estado=` search param and preselects the Estado field, so users arriving from a regional page or shared link skip a step.
- Small copy reassurance already exists; we keep it and ensure the preselected state shows clearly.

## 3. Internal linking + crawl depth (home & map)

- Home (`src/routes/index.tsx`): add a compact "Explora tu estado" section linking to the regional pages (also helps users self-route).
- Map (`src/routes/mapa.tsx`): make each state bubble / list row link to its `/zona/{estado}` page, turning the existing map into a hub that distributes crawl equity.

## 4. Dynamic sitemap + robots

- Replace the static `public/sitemap.xml` with a server route `src/routes/sitemap[.]xml.ts` that lists home, property, map, methodology, voluntarios, **and every `/zona/{estado}` page**, so new regional pages are always discoverable. (This migrates the current static file — included here as the explicit change for approval.)
- `public/robots.txt`: keep `Allow: /`, add the `Sitemap:` directive pointing at `https://evaluaya.app/sitemap.xml`.

## 5. Lighter assessment-experience polish (reduce drop-off)

- Per-checklist-item photo guidance: a one-line "qué fotografiar" hint under each item in `src/routes/assess/checklist.tsx` (text only, bilingual) so users know what a useful photo looks like — improves AI triage quality and reduces "unsure" answers.
- Keep photos clearly optional (already messaged) to avoid adding friction.

## Technical notes

- **New server fn** `getStateStats(estado)` in `src/lib/stats.functions.ts` — public GET, returns anonymized counts for one state by reusing the `get_damage_aggregates` RPC output (no DB migration, no new RLS surface).
- Regional route is a **public SSR route** (no auth gate) so `head()` OG tags render for crawlers and social unfurls; loader calls only the public stats fn (safe during prerender).
- Reuse existing `RiskBadge`, `ShareApp`, `absoluteUrl`, and OG image assets; no new design system tokens.
- i18n: ~15–20 new bilingual keys (regional page copy, "explore your state", photo hints).
- No changes to auth, admin, email, or volunteer logic.

## Out of scope (can follow later)
- Municipio-level pages (state-level first; revisit if traffic warrants).
- Re-assessment-over-time history and aftershock prompts.
- A dedicated SEO scan/keyword pass (can run after these pages exist).
