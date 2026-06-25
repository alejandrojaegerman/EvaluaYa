# Build-out: Shareable Stat Cards + OG Images & Field Robustness

Two tracks, both aimed at ground users / influencer reach.

---

## Track A — Shareable stat cards + OG images

Today every share is a plain text + homepage link. We'll make shares visual and on-brand so they spread on WhatsApp.

### A1. Dynamic stat cards (the thing people actually post)
A new `src/lib/share-card.ts` renders a branded PNG **client-side via canvas** (no server/edge raster constraints), then shares it as an image file through `navigator.share({ files })`, with download + copy-link fallbacks.

Two card types:
- **Result card** (`/a/$publicId`): risk color block (Green/Yellow/Red), the recommended action ("Permanecer / Uso limitado / Evacuar"), EvalúaYa logo, and `evaluaya.app`. Personalized, shareable straight from the phone.
- **Stats card** (`/mapa`): national totals (total reports, % red/yellow/green), top affected estado, and a call to action. Lets the influencer post live momentum ("X reportes, Y en rojo").

Wire these into the existing share buttons in `src/routes/a/$publicId.tsx`, `src/routes/mapa.tsx`, and `src/components/ShareApp.tsx` (image-first when supported, link otherwise). Uses brand colors from `styles.css` and `RISK_HEX`.

### A2. OG link previews (when the link itself is pasted)
Per-route `head()` `og:image` / `twitter:image`. Because the workspace blocks public buckets and the Worker can't raster images at the edge, we use a **small set of pre-generated, on-brand Spanish OG images** stored as Lovable CDN assets:
- `og-result-green.jpg`, `og-result-yellow.jpg`, `og-result-red.jpg`
- `og-mapa.jpg`
The result route already has `riskLevel` in loader data, so `head()` selects the matching image; `/mapa` uses its own. Each leaf also gets self-referencing `og:url` + `canonical` (per head rules). Result pages stay `noindex` (private slugs).

> Note to user: WhatsApp/Facebook cache previews, so already-shared links may keep old previews until each platform re-scrapes.

---

## Track B — Field robustness (low-bandwidth / offline)

### B1. Resume & auto-submit pending assessments
Right now a completed-but-unsent assessment lives in IndexedDB but isn't surfaced once you leave `/assess/analyze`.
- Add a **"Pending submission" card on the home page** (`src/routes/index.tsx`) when a complete draft exists and hasn't been sent — one tap to resume/submit. Auto-fires when back online.
- Tag drafts with a `status` (`in_progress` | `ready_to_send`) in `src/lib/draft-store.ts` so we know when a draft is complete and just waiting on connectivity.

### B2. Tougher submit flow (`/assess/analyze`)
- Add **bounded retry with backoff** around `analyzeAssessment` (transient network failures), on top of the existing reconnect auto-retry.
- Add an **overall timeout guard** so a stalled upload surfaces a clear retry instead of an infinite spinner.
- Clearer queued/waiting copy ("Se enviará automáticamente al reconectar").

### B3. Multiple photos per item (record-only)
Allow up to 3 photos per checklist item in `src/routes/assess/checklist.tsx` for better documentation for engineers/authorities and the PDF.
- **Important:** to honor the earlier "one key photo per item" cost decision and the credit-drain protection, only the **first (key) photo per item is sent to the AI**; the rest are stored with the record and shown on the result page / PDF.
- Touches: `assessment-types.ts` (answers carry `photoDataUrls: string[]`), `checklist.tsx` UI (thumbnail strip + add/remove), `assessment.functions.ts` (upload all, send only key photo to vision), result page gallery, and `pdf.ts`.

All new strings added to `src/lib/i18n.tsx` in ES + EN.

---

## Technical notes
- Stat/result cards: HTML canvas → `toBlob()` PNG; share via `navigator.share` with `files` (feature-detected), fallback to download + existing link/WhatsApp paths. No new deps.
- OG images generated with the image tool, stored via `lovable-assets` as `.asset.json` pointers, imported into route `head()`.
- B3 keeps AI input at one photo per item — no change to per-analysis credit cost.
- No schema migration required: photos already live in `answers`/storage as JSONB-backed data; we extend the per-item shape.

## Out of scope (deferred)
Institutional dashboard, engineer-review/verified badges, public API — not part of this build-out.

---

If you'd rather I trim Track B to just offline/resume (B1+B2) and skip multi-photo for now, say so and I'll drop B3.
