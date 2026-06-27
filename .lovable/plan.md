# Add UTM tracking to all shared links

## Goal

Stop the flywheel traffic from collapsing into "Direct" in analytics. Every link the app emits when a user shares it — or that we send in app emails — gets `utm_source`, `utm_medium`, and `utm_campaign` so you can see exactly which button, on which page, drives visits.

## Tracking taxonomy

`utm_medium` = the type of loop. `utm_source` = the channel. `utm_campaign` = the surface/context.

```text
utm_medium   share | email
utm_source   whatsapp | native | copy | image | email
utm_campaign app_share | result | map | data | volunteer_panel | help_request
```

Examples of what lands in analytics:
- WhatsApp share of a result page → `medium=share, source=whatsapp, campaign=result`
- Copy-link from the map page → `medium=share, source=copy, campaign=map`
- Volunteer-approved email CTA → `medium=email, source=email, campaign=volunteer_panel`

This lets you compare, e.g., "WhatsApp result shares vs map shares" and prune the weak ones.

## What gets tagged

Per your choices: user shares (app, result, map, data cards) + outbound emails. Person-to-person and admin links stay clean.

1. **App share block** (`ShareApp`, shown on several pages) — WhatsApp, native share, copy.
2. **Result page** (`/a/:publicId`) — native share, copy, WhatsApp, and the branded result image's share text.
3. **Map page** (`/mapa`) — stats card share text.
4. **Data room** (`/datos`) — stats card share text.
5. **App emails we control** — volunteer-approved and help-request notification CTA links.

## What is deliberately left untouched

- **`og:url` and `canonical` tags** — these must keep pointing at the clean page URL for SEO; adding UTMs there would break canonicalization.
- **Auth emails** (magic link, signup, recovery, etc.) — their CTA is a one-time token URL; appending params can break the token, so they stay as-is.
- **Person-to-person and admin WhatsApp links** (engineer↔resident, admin panel copy) — not part of the viral loop.
- **The URL printed inside the share images** stays clean/short; the UTM goes on the clickable text link that accompanies the image (a long UTM string would clutter the card and isn't tappable anyway).

## Technical details

**`src/lib/site.ts`** — add a small helper:

```ts
export type Utm = { source: string; medium: string; campaign: string; content?: string };

export function withUtm(path: string, utm: Utm): string {
  const url = new URL(absoluteUrl(path));
  url.searchParams.set("utm_source", utm.source);
  url.searchParams.set("utm_medium", utm.medium);
  url.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) url.searchParams.set("utm_content", utm.content);
  return url.toString();
}
```

**`src/components/ShareApp.tsx`** — accept an optional `campaign` prop (default `"app_share"`); build the shared URL with `withUtm("/", { source, medium: "share", campaign })`, using `whatsapp` / `native` / `copy` as the source per action. Keep the visible page unchanged.

**`src/routes/a/$publicId.tsx`** — replace the four `absoluteUrl(/a/:id)` share usages (native share, copy, WhatsApp text, result-card share text) with `withUtm`, `campaign: "result"`, source per channel (`image` for the card). Leave the `head()` `og:url` on the plain URL.

**`src/routes/mapa.tsx`** and **`src/routes/datos.tsx`** — in the stats-card share handlers, tag the accompanying text URL with `withUtm("/mapa"|"/datos", { source: "image", medium: "share", campaign: "map"|"data" })`. Leave the URL drawn on the canvas and the `head()` tags clean.

**`src/lib/volunteers.functions.ts`** — append UTMs to the two server-built panel URLs:
- volunteer-approved email → `?utm_source=email&utm_medium=email&utm_campaign=volunteer_panel`
- help-request notification → `...&utm_campaign=help_request`

(Done by wrapping the existing `https://evaluaya.app/voluntarios/panel/...` strings; the admin-notification URL is left clean.)

## Verification

- Unit test `withUtm` (correct params, no double `?`, preserves path) in `tests/unit/`.
- Manually confirm a generated WhatsApp/result link in the preview carries the three params and still resolves to the right page.
- After publish, GA/analytics should begin attributing these visits to `share` / `email` instead of Direct.

No assessment logic, risk scoring, or UI layout changes — this is purely link-generation plumbing.
