## Privacy Policy + Open Data API

Two deliverables: a Privacy Policy page, and a documented public data API for LLMs/agents. Terms of Service are deferred per your choice. All copy bilingual (ES primary, EN secondary), reusing the existing teal design system.

### 1. Privacy Policy (`/privacidad`)

New public route `src/routes/privacidad.tsx`, drafted from what the app actually does. Sections:

- **Quién es responsable** — EvalúaYa.app, contact `contacto@evaluaya.app`.
- **Qué datos recogemos** — assessment answers, optional photos, approximate location (state/municipality/address text), building details; email only if you create an account, sign up as a volunteer, send feedback, or submit an institution lead. No login required to run an assessment.
- **Cómo se usan** — AI structural triage (analysis is automated), generating your report, anonymized aggregates for the map/data room, connecting residents with verified engineers.
- **Compartir** — photos stay in private storage (signed links only); public surfaces show anonymized counts only — never addresses, photos, or report IDs.
- **Conservación y tus derechos** — access/deletion requests via the contact email.
- **Procesadores** — hosting/database/AI/email infrastructure described in plain language (no vendor names per app conventions).
- **Cookies/almacenamiento** — local device storage for drafts/offline outbox; analytics.

Footer gets a "Legal" column linking to the policy; `llms.txt` and the sitemap get the new page.

Note on `contacto@evaluaya.app`: I can list it as the contact and keep sending app/auth mail from your `notify.evaluaya.app` sender. But **receiving** mail at that address is a separate mailbox/inbound service the app can't host — you'd point `contacto@evaluaya.app` at a free email-forwarding service (e.g. your registrar's forwarding or Cloudflare Email Routing) so messages land in an inbox you already use. I'll flag this and give you the exact steps; the policy ships either way.

### 2. Open Data API (for LLMs & agents)

Public, read-only JSON endpoints under `src/routes/api/public/` (this prefix is unauthenticated by design), each reusing the existing aggregate RPCs in `stats.functions.ts` — so they return the same anonymized counts already powering the map and data room, never raw reports. All include CORS headers (so agents/browsers can fetch) and `Cache-Control`.

Endpoints:
- `GET /api/public/v1/aggregates.json` — counts by state/municipality + risk level (`getDamageAggregates`), optional `?state=&from=&to=` filters.
- `GET /api/public/v1/timeseries.json` — daily trend, last 90 days.
- `GET /api/public/v1/totals.json` — national headline totals.
- `GET /api/public/v1/risk-factors.json` — the "why" breakdowns (flagged checklist items, age/type, intensity bands, safety rules), optional filters.
- `GET /api/public/v1/methodology.json` — machine-readable risk taxonomy (green/yellow/orange/red meanings), the deterministic safety rules, and the glossary/definitions, so an agent interprets the numbers correctly.
- `GET /api/public/v1/index.json` — a discovery manifest listing every endpoint, its params, the license, and the attribution string.

Each payload wraps data in `{ license, attribution, source, generated_at, data }`.

### 3. Attribution & discoverability

- **License:** dataset published as **CC BY 4.0** (separate from the MIT code license). Required attribution string: *"Datos de EvalúaYa (evaluaya.app), CC BY 4.0"*.
- **Data Room (`/datos`):** add an "Datos abiertos / Open data" section listing the endpoints, the license, the attribution string, and a copy-able example request.
- **`llms.txt`:** add an "API / Open data" section pointing to `/api/public/v1/index.json` and the endpoints, with the attribution requirement, so LLMs and agents discover it.
- **`robots.txt`:** keep `/a/` disallowed; the API is allowed.

### Technical notes

- Endpoints are TanStack server routes (`createFileRoute(...).server.handlers.GET`), not `createServerFn`, so they're plain HTTP for external callers. `supabaseAdmin` is imported inside each handler (never module scope).
- Reuse the validated filter schema from `stats.functions.ts` for query params; clamp/validate all input with Zod.
- Methodology endpoint derives from existing `risk.ts`, `safety-rules.ts`, and the glossary i18n keys — single source of truth, no duplicated copy.
- Light per-IP rate limiting reusing `rate-limit.server.ts` to protect the endpoints.
- New routes added to the sitemap where indexable (privacy page yes; JSON endpoints no).
