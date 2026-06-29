# Open-Data API usage tracking + admin visibility

## Goal
Confirm the public open-data API works, start recording when/how it's used, and show that usage cleanly in the admin dashboard. Today the API (`/api/public/v1/*`) responds correctly (verified: `index.json` returns HTTP 200 with the full manifest), but **no usage is logged anywhere**, so "has it been used?" is currently unanswerable. This adds privacy-safe tracking and an admin panel.

## What we'll track
For every successful request to the v1 endpoints (`index`, `aggregates`, `totals`, `timeseries`, `risk-factors`, `methodology`):
- which endpoint
- timestamp
- which filters were used (state / municipality / date range) — useful to see what data consumers care about
- coarse caller hints: referer host and a truncated/normalized user-agent (no IPs, no PII)

No personal data is stored — this is anonymous API-consumer telemetry, consistent with how `funnel_events` already works.

## Approach

### 1. Database (migration)
- New table `public.api_usage_events`:
  - `id uuid pk`, `endpoint text`, `filters jsonb`, `referer_host text`, `user_agent text`, `created_at timestamptz default now()`
  - Locked down like `funnel_events`: `ENABLE ROW LEVEL SECURITY`, **no anon/authenticated grants**, `GRANT ALL ... TO service_role` only. Writes happen via service role inside route handlers; reads via a security-definer RPC.
- New RPC `get_api_usage_metrics(_window_hours int)` (`SECURITY DEFINER`, `search_path = public`) returning a single `jsonb`:
  - total calls in window, calls per endpoint, calls per day (sparkline), top referer hosts, most-used filters, and last-call timestamp.

### 2. Logging helper (server-only)
- New `src/lib/api-usage.server.ts` with `logApiUsage(endpoint, filters, request)`:
  - fire-and-forget insert via `supabaseAdmin` (loaded inside the function), wrapped in try/catch so it can never break or slow the API response (same pattern as `trackFunnelStep`).
  - Extracts referer host + a trimmed user-agent from request headers.
- Call it from each handler in `src/routes/api/public/v1/*.ts` right before returning (skipped for `OPTIONS` preflight).

### 3. Admin read path
- Add `getApiUsageMetrics` server function in `src/lib/funnel.functions.ts` (or a small new `stats` companion), gated by the existing `VOLUNTEER_ADMIN_SECRET` exactly like `getFunnelMetrics`, calling the RPC.

### 4. Admin UI (elegant, in the existing "Datos" tab)
- New `src/components/admin/ApiUsagePanel.tsx`, rendered in the `tab === "datos"` block of `src/routes/admin.index.tsx`, under a `SectionTitle` ("API de datos abiertos" / "Open data API"):
  - Stat row: total calls (last 7 days), calls today, unique endpoints used, last call (relative time, US Eastern).
  - A compact per-endpoint list with call counts + share bars (reusing the existing bar/`Stat` visual language so it matches the rest of the dashboard).
  - Small "Estado: operativo / Status: live" badge confirming the API is reachable.
  - Empty state: "Aún no se ha consultado la API" / "The API hasn't been queried yet" so a zero reads clearly rather than looking broken.
- Bilingual i18n keys added to `src/lib/i18n.tsx`.

## Important caveat (called out in the panel)
The API responses are CDN-cached (`Cache-Control: s-maxage`). Repeated identical requests can be served from cache without reaching the origin, so logged counts are a **lower bound** on real usage. The panel will note this in small print so the numbers aren't misread. (We keep caching — it's the right behavior for a public API; we just label the metric honestly as "requests reaching the server".)

## Out of scope
- No API keys, rate-limit dashboards, or per-consumer identity.
- No changes to the API responses, schemas, or the public data itself.
- No changes to the existing funnel/photo/quality panels.

## Verification
- Curl each `/api/public/v1/*` endpoint locally, confirm rows land in `api_usage_events`.
- Load `/admin`, enter the secret, open the Datos tab, confirm the API usage panel shows the test calls with correct per-endpoint counts and last-call time.
- Confirm an unauthenticated/empty state renders cleanly and that logging failures never affect API responses.
