# Pin every shared link to evaluaya.app

## Problem
Several share/copy actions build their link from `window.location.origin`. When the app is opened from the Lovable preview or the `tremor-check.lovable.app` published URL (instead of the custom domain), every shared message, WhatsApp link, copied link, and share-card footer carries that non-branded host. That's the "lovable one" you saw.

We already have the right source of truth: `SITE_URL` (`https://evaluaya.app`) and the `absoluteUrl()` helper in `src/lib/site.ts`. The fix is to route all outbound share links through it.

## Changes

### 1. `src/components/ShareApp.tsx`
- Import `SITE_URL` from `@/lib/site`.
- `shareUrl()` returns `SITE_URL` instead of `window.location.origin` (used by the WhatsApp button, native share, and copy-link).

### 2. `src/routes/a/$publicId.tsx` (result share)
- Import `SITE_URL` and `absoluteUrl`.
- `shareWhatsApp()` and `shareCard()` build the link from the canonical domain. For a specific report, link directly to the report itself: `absoluteUrl(\`/a/${record.publicId}\`)` so the recipient lands on the actual assessment with the correct risk-specific OG preview, on the branded domain.
- The card footer URL (`url:` passed to `generateResultCard`) uses `SITE_URL` (the card already strips the protocol for display).

### 3. `src/routes/mapa.tsx` (map stats share)
- Import `SITE_URL`.
- The CSV download stays as-is (local filename only).
- `shareStatsCard` text + card `url` use `absoluteUrl("/mapa")` / `SITE_URL` instead of `window.location.origin`.

## Notes / non-changes
- `src/lib/site.ts` already defaults to `https://evaluaya.app` and honors an optional `VITE_SITE_URL` override — no change needed.
- `head()` OG/canonical tags in `__root.tsx`, `a/$publicId.tsx`, and `mapa.tsx` already use absolute `evaluaya.app` URLs — left untouched.
- PDF/CSV local filenames keep their `evaluaya-` prefix — they're not links.

## Technical detail
`SITE_URL` is a build-time constant, safe in SSR (no `window` access), so it also fixes the minor SSR concern of reading `window` during render. After the change, `rg "window.location.origin" src` should return no results in share paths.
