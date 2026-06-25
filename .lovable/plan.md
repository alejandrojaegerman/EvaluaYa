# EvalúaYa — Growth Flywheel Plan

The influencer traffic is real but leaking: of ~50 home visits, only ~10 start, ~6 reach the checklist, and ~3 finish the AI analysis. Almost all traffic is mobile, from Instagram, inside Venezuela. The flywheel is: **more people finish → more data on the public map → the map becomes the thing worth sharing → more people come and finish.** This plan builds all three loops plus the privacy-safe data foundation.

```text
  Influencer / shares ──▶ Land on home ──▶ Finish assessment ──▶ Result + WhatsApp share
         ▲                                          │                        │
         └──────── Public damage map ◀── anonymized aggregate ◀─────────────┘
```

## Phase 1 — Fix the conversion funnel
Goal: more of the existing traffic actually completes an assessment.

- **Home page**: add a live trust counter ("X edificios evaluados · X zonas"), a clear "2 minutos, sin registro" promise, and a secondary CTA to the public map. Make the primary CTA unmistakable on mobile.
- **Progress + reassurance**: show a step indicator (1 of 3, "7 preguntas rápidas") across property → checklist → analyze so the length feels finite. Reinforce "las fotos son opcionales."
- **Property step**: keep it to one screen; make address optional and add a simple **Estado / Municipio** picker (drives the map later) so location is structured but coarse.
- **Resilience on analyze**: keep the existing offline-retry; add a friendly fallback so a single AI/photo failure never dead-ends the user.

## Phase 2 — Community sharing loop
Goal: every finisher recruits the next.

- **Result page**: add a prominent **WhatsApp share** (dominant channel in VE) with a pre-filled Spanish message + link, plus an "Evalúa tu edificio también" invite back to home.
- **Rich link previews**: generate a per-result, risk-colored Open Graph share image and wire dynamic `og:image`/`twitter:image` from the result loader so shared links look credible in WhatsApp/Instagram.
- **Local proof**: on the result, show "X evaluaciones en tu zona" and a CTA to the public map, closing the loop from a private result to the shared public good.

## Phase 3 — Public damage map + stats dashboard
Goal: the visible payoff that makes the project worth talking about and useful to authorities/press.

- New public route `/mapa` (linked from home, result, and nav):
  - **Map** with markers per Estado/Municipio, sized by report count and colored by dominant risk (green/yellow/red). Coarse area only — never an exact address or building-level pin.
  - **Summary stats**: total assessments, % red/yellow/green, most-affected areas, last-updated.
  - **Area breakdown list** for low-bandwidth/no-map fallback.
- Fully public, no login, bilingual, mobile-first and lightweight (map library lazy-loaded only on this route).

## Phase 4 — Data foundation for institutions
Goal: keep the door open for government / NGOs / private sector (audience TBD) without exposing anyone.

- A public **anonymized aggregate** layer (counts by area + risk, no addresses, no photos) is the only thing ever exposed publicly — this powers Phase 3 and any future partner use.
- Add a **public JSON/CSV download** of the aggregated, non-PII data on `/mapa` so analysts can use it immediately.
- Add a lightweight **"¿Eres autoridad u organización?"** capture (name, org, email) to collect interested institutions and learn who actually shows up before we build deeper access.

---

## Technical details

**Database (migration)**
- Add to `assessments`: `state text`, `municipality text` (structured coarse location; free-text address stays optional and is never exposed publicly). Keep raw table service-role-only as today.
- Create a SQL **view** `public_damage_aggregates` grouping by `state`/`municipality` with per-risk counts and a total — **no** address, photos, or `public_id`. `GRANT SELECT ... TO anon` on the view only.
- Create `institution_leads` table (org, contact name, email, note) with `INSERT`-only for anon, no public SELECT; reads brokered server-side.

**Location handling**
- Add a static lookup of Venezuela's 24 estados (and key municipios) with centroid lat/lng so the map needs no per-request geocoding — low bandwidth, no exact-location storage. Map markers render at estado/municipio centroids, not user coordinates.

**Server functions**
- `getDamageAggregates` — public read via the publishable (anon) client against `public_damage_aggregates`; cache-friendly; returns only counts. Used by `/mapa` loader (safe for SSR/prerender).
- `getHomeStats` — small public counts for the home trust counter.
- `submitInstitutionLead` — validated (Zod) insert into `institution_leads`.
- Extend `analyzeAssessment` input to persist `state`/`municipality`.

**Sharing / OG image**
- Result route `head()` already loads from the loader; add `og:image`/`twitter:image` pointing to a generated risk card (static per-risk asset to start; dynamic per-result image is a possible follow-up). `twitter:card` = `summary_large_image`.

**Map rendering**
- Use the Google Maps connector (already available) lazy-loaded only on `/mapa`, markers via `google.maps.Marker`, no `mapId`. Always-available list fallback so the page is useful even if the map script is blocked or slow.

**Robustness**
- Add `errorComponent`/`notFoundComponent` to routes with loaders (result + map).
- Keep existing rate limiting; aggregates are read-only and cacheable.
- Re-run the security scan after the migration to confirm only the intended anon view/insert are exposed.

## Out of scope (flagging for later)
- Per-result dynamic OG image generation, full institutional API/auth, and verified partner dashboards — deferred until we see which institutions engage via the lead capture.