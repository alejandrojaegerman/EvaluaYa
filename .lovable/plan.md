## Goal

Take the look you liked on `/voluntarios` — the deep teal (`#0f3443`) background, the **EvalúaYa** wordmark, the friendly illustrated hard-hat engineer, and the shield-with-checkmark motif — and make it the consistent brand language across the app's other social previews, plus a few tasteful in-app accents.

## A. Branded social preview images (1200×630)

Regenerate the remaining share/OG images in the same illustrated teal style as `og-voluntarios.jpg`, so every link unfurl looks like one family:

1. **`public/og-home.jpg`** (new) — homepage / default. Teal background, EvalúaYa wordmark, the engineer-with-house illustration, shield-check, Spanish headline like "Evalúa el daño de tu vivienda tras un sismo." Wire it into `src/routes/__root.tsx`, replacing the current plain screenshot URL for both `og:image` and `twitter:image`.
2. **`public/og-map.jpg`** (replace) — same frame, map/location motif (pins over a stylized Venezuela), headline "Mapa de daños reportados."
3. **`public/og-result-green.jpg` / `-yellow.jpg` / `-red.jpg`** (replace) — same teal frame and wordmark, with the risk color as a strong accent band + status icon (check / caution / alert) and the matching Spanish status word. Keeps them color-coded but on-brand.

No route wiring changes needed for map/results — they already point at these filenames. Only `__root.tsx` gets the new home image reference.

## B. Light in-app branding touches

Keep these small and presentation-only:

1. **Home hero** (`src/routes/index.tsx`) — add the branded engineer/house illustration (transparent PNG, `src/assets/`) into the teal hero section so the in-app first impression matches the share image. Sized responsively, decorative (empty alt).
2. **Header lockup** (`src/components/AppShell.tsx`) — keep the existing shield mark but align its treatment to the brand (consistent rounded teal tile + wordmark), so the in-app logo and the OG wordmark read the same.

## Technical notes

- Images generated at 1200×630 JPG into `public/` (referenced by absolute URL via the existing `absoluteUrl()` / `SITE_URL` helpers — no code changes to `site.ts`).
- In-app illustration generated as a transparent PNG into `src/assets/` and imported normally.
- Risk colors pulled to match the app's `--risk-green/-yellow/-red` tokens for visual consistency.
- After publish, social platforms cache previews — the new images won't appear on already-shared links until each platform re-scrapes (forceable via their link-preview debuggers).

## Out of scope

- No copy/feature/logic changes; no changes to the volunteers image (it's the reference).
- No new routes or metadata structure changes beyond swapping the homepage image URL.
