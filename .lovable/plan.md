## Goal

Get EvalúaYa in front of people the moment they need it. Today ~75% of traffic is Direct/Instagram and only ~17 visits/week come from Google — yet Semrush shows large, low-difficulty demand for the "did an earthquake just happen?" moment: "hoy tembló" 8,100/mo, "temblor en venezuela hoy" 880, "funvisis" 880, plus English variants ("venezuela earthquake today") relevant to the US diaspora (your #2 country). We'll capture that intent, make the app quotable by AI assistants, and fix the open SEO issues.

## 1. Live "¿Tembló en Venezuela hoy?" page (highest-value)

New route `/temblo-en-venezuela-hoy` (with English peer `/earthquake-in-venezuela-today`) that answers the spike query directly and funnels into an assessment.

- **Data source:** USGS real-time earthquake GeoJSON feed (public, no key), queried in a `createServerFn`, filtered to the Venezuela bounding box + nearby, last 24h/7d/30d. Cached server-side (short TTL) so it stays fresh but cheap on low bandwidth.
- **Answer-first layout:** a bold yes/no headline ("Sí, hubo sismos cerca de Venezuela en las últimas 24h" / "No se han registrado sismos significativos hoy"), then a compact list of recent quakes (magnitude, location, time in your standard ET, distance). This is the exact format that wins featured snippets and AI overviews.
- **Strong CTA:** "¿Sentiste el temblor? Revisa tu vivienda" → `/assess/property`.
- **Freshness signals:** visible "actualizado hace X min", `dateModified` in structured data, short cache so crawlers see it change — critical for ranking on "hoy" queries.
- **Trust:** cites USGS + links to the FUNVISIS guide and methodology.

## 2. Full LLM / AI-search optimization

Make the content easy for ChatGPT, Perplexity, and Google AI overviews to quote.

- **Expand `public/llms.txt`:** add the live quake page, FUNVISIS guide, English pages, and a tighter one-line answer for "what to do after an earthquake in Venezuela." Keep counts-only data framing.
- **Answer-first content blocks:** add concise, self-contained Q&A summaries near the top of the key guides (que-hacer, grietas, funvisis) so an LLM can lift a clean answer.
- **Structured data across pages:**
  - `FAQPage` on guides (real questions from search: "de cuánto fue el temblor de hoy", "es mi edificio seguro").
  - `HowTo` on the post-quake safety guide.
  - `SpecialAnnouncement` / `Dataset` on the live page + open-data API for machine readability.
  - `BreadcrumbList` on deep guide/zone routes.
- **English-language reach:** ensure the live page and core guides have indexable English peers with `hreflang` alternates (es/en) so diaspora searches ("venezuela earthquake today") resolve.

## 3. FUNVISIS explainer expansion

Deepen the existing `/guia/funvisis-que-es-y-como-funciona` to own the ~880/mo "funvisis" cluster.

- Add answer-first FAQ entries for the real variant queries (e.g. "funvisis temblor hoy", "cómo leer un reporte de FUNVISIS").
- Cross-link FUNVISIS ⇄ the new live quake page ⇄ methodology, so the cluster reinforces itself.
- Refresh structured data (Article + FAQPage) and the internal links from home/guides.

## 4. Fix open SEO findings

- **Sitemap gaps:** the scan flags missing entries; add the genuinely public ones and confirm private/internal routes (`/mis-reportes`, `/admin/voluntarios`, `/a/$publicId`, `/assess/analyze`, `/unsubscribe`) stay excluded (these are intentionally not indexable — they'll be left out by design, not added). Add the two new live-page routes.
- **Contrast finding:** locate the low-contrast muted/placeholder text and bump to design-system tokens meeting WCAG AA. (Note: this finding reflects the last *published* build, so it only clears once you publish.)
- Mark both findings fixed after the changes.

## 5. Wire-in & internal linking

- Surface the live page from the home hero ("¿Acaba de temblar? Mira los sismos recientes") and the More/nav menu so it gets internal link equity.
- Add it to `sitemap.xml`, `llms.txt`, and the guide cross-links.

## Technical notes

- Live data via `createServerFn` calling the USGS feed (`earthquake.usgs.gov/.../summary/*.geojson`), filtered by lat/lon bbox for Venezuela; server-cached with a short TTL; graceful fallback to a static "check official sources" state if the feed is unavailable.
- All new head metadata follows the per-route `head()` pattern with self-referencing `canonical`/`og:url`, `hreflang` alternates, and inline JSON-LD.
- No schema/DB changes required. No new secrets (USGS feed is public).
- After publishing, OG/preview caches won't refresh instantly; a rescan in the SEO tab will re-verify the fixes.

## Out of scope (can follow up)

- Per-state "qué hacer" guides and the "is my building safe" checklist content (offered earlier, not selected now).
- Paid search / ongoing rank tracking (would need the Semrush connector).