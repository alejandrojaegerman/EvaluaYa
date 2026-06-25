# Spanish share preview + viral sharing

Two goals: (1) the link-preview text shown when EvalúaYa is shared must be in Spanish, and (2) make it effortless for anyone — not just people who finished an assessment — to promote the app to their network, especially via WhatsApp.

## 1. Fix the English social preview text

In `src/routes/__root.tsx` there are three leftover meta tags (English and cut off mid-sentence: "...self-assessment in") that the social-image tool added. Because social crawlers use the *last* matching tag, these override the correct Spanish ones.

- Remove the duplicate English `description`, `og:description`, and `twitter:description` entries.
- Keep the existing Spanish copy that's already in the file:
  - Title: "EvalúaYa — Evaluación estructural"
  - Description: "Autoevaluación de daños estructurales tras un sismo. Gratis, sin registro y funciona con poca señal."
- Result: WhatsApp/Facebook/X/Telegram previews show fully Spanish text alongside the (already good) preview image.

Note: platforms cache the last preview they scraped, so the old English text may linger in already-shared links until each platform re-fetches. New shares will be correct immediately.

## 2. Make sharing/promotion easy everywhere (the flywheel)

Today the only WhatsApp button lives on the result page. We add a single reusable share affordance and place it where reach is highest.

### Reusable `ShareButton` / share section
- Create `src/components/ShareApp.tsx`: a small component with a primary "Compartir por WhatsApp" button (green WhatsApp styling) plus a secondary "Copiar enlace" / native share fallback.
- It shares the app homepage URL with a compelling Spanish invite message (reusing/extending the existing `result.whatsappMessage` style), e.g. "Evalúa los daños de tu vivienda tras el sismo con EvalúaYa — gratis, sin registro: {url}".
- Uses `navigator.share` when available, falls back to a `wa.me` link and clipboard copy.

### Placement
- **Home (`src/routes/index.tsx`)**: add a prominent "Ayuda a difundir" / share card near the top (under the hero), so every visitor can spread it in one tap. This is the biggest flywheel lever.
- **Map (`src/routes/mapa.tsx`)**: add the share section so people viewing community damage are nudged to invite their area.
- **Result page (`src/routes/a/$publicId.tsx`)**: keep existing WhatsApp + invite section (already good); optionally swap its inline logic to the shared component for consistency.

### Copy / i18n
Add bilingual keys (ES primary) in `src/lib/i18n.tsx` for the new share section:
- `share.title` — "Ayuda a tu comunidad" / "Help your community"
- `share.body` — short line on why sharing matters (more reports = better area data)
- `share.whatsapp` — "Compartir por WhatsApp" / "Share on WhatsApp"
- `share.copy` — "Copiar enlace" / "Copy link"
- `share.message` — the invite text used in the WhatsApp/native share payload

## Technical notes
- Share URL uses `window.location.origin` (production resolves to https://evaluaya.app) so the shared link always points to the public site, not a draft.
- No backend, schema, or server-function changes — this is metadata + frontend/presentation only.
- Verify the build passes and spot-check the rendered meta tags and the home/map share buttons.

## Out of scope
- No changes to assessment logic, AI, or the database.
- No new analytics/referral tracking (can be a follow-up if you want to measure share-driven growth).
