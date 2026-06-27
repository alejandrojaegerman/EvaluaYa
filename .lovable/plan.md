# Drop-off instrumentation for the evaluation flow

## Why
Today, when evaluations dip, there's no way to tell a **traffic** drop (fewer people arriving) from a **flow** regression (people arriving but getting stuck). Lovable's built-in analytics shows page views but not step-to-step conversion in real time, and the admin dashboard only knows about assessments that reached the database (drafts/analyzed) — it can't see the earlier Home → Property → Checklist steps. This adds a tiny, privacy-safe event trail across the whole funnel plus an admin view and an alert.

Design priorities: **no added friction, no bulk, no PII.** Events are anonymous, fire-and-forget, skipped when offline, and never block a tap or the next screen.

## The funnel we'll measure
```text
Home CTA  →  Property started  →  Property completed  →  Checklist started  →  Analyze started  →  Result reached
```
Each step records: anonymous device id (existing `getDeviceId()`), step name, language, and timestamp. Nothing else.

## What gets built

### 1. Storage (Lovable Cloud)
- New `funnel_events` table: `id`, `device_id`, `step`, `language`, `created_at`.
- Locked down: RLS on, **no** anon/authenticated read or write. Inserts happen only through a server function using the service-role client (same brokering pattern as `getDamageAggregates`). This keeps the raw trail private, consistent with how assessment data is already handled.
- Indexed on `(created_at)` and `(step, created_at)` for fast windowed queries.

### 2. Tracking (client, fire-and-forget)
- A `trackFunnelStep` server function (POST) that inserts one event; failures are swallowed.
- A tiny `trackStep(step)` client helper that calls it without `await` blocking the UI and **no-ops when offline** — so low-bandwidth users are never slowed down.
- Wire one call at each transition:
  - Home: on "Iniciar evaluación" tap.
  - Property: on mount (`property_started`) and on "Continuar" (`property_completed`).
  - Checklist: on mount (`checklist_started`).
  - Analyze: on mount (`analyze_started`).
  - Result page `/a/$publicId`: on mount (`result_reached`).

### 3. Admin funnel view (`/admin`)
- A SECURITY DEFINER RPC `get_funnel_metrics(window_hours)` returning, for the window: count at each step, step-to-step conversion %, and a per-hour breakdown for the last 48 hours.
- A new card on the existing admin dashboard showing:
  - The funnel as counts + conversion % per step (so a single broken step stands out as a conversion cliff).
  - A last-48h hourly sparkline of "Property started" and "Result reached" so you can see the exact hour a dip began and whether it hit all steps (traffic) or one step (flow).
- Gated by the existing `VOLUNTEER_ADMIN_SECRET`, same as the rest of `/admin`.

### 4. Automated drop alert
- Extend the existing admin digest/cron path to run a lightweight hourly check: compare the most recent hour's **conversion** (e.g. Property→Result) against the trailing 7-day same-hour baseline.
- If conversion drops below a threshold **while traffic is still present** (i.e. people are starting but not finishing), email the admin a short "possible flow regression" alert. A pure traffic drop (fewer starts, same conversion) does **not** trigger it — that's the key distinction you asked for.

## Notes / decisions
- **Privacy:** anonymous device id only; no addresses, IPs, or report ids in the events table. Reuses the existing non-PII `getDeviceId()`.
- **Performance:** one ~100-byte POST per step, non-blocking, offline-skipped. No third-party scripts.
- **Backfill:** historical Home→Checklist steps can't be reconstructed (they were never recorded), but DB-side completion (`analyzed/total`) already exists in admin analytics and will sit alongside the new funnel for continuity.
- **No change to the resident UX** — purely additive tracking; the evaluation screens look and behave exactly as they do now (verified healthy this turn: no console/runtime errors, Continue button unobstructed on mobile).

## Files (technical)
- `supabase/migration` — `funnel_events` table + grants + RLS + `get_funnel_metrics` RPC.
- `src/lib/funnel.functions.ts` — `trackFunnelStep` (insert) + `getFunnelMetrics` (admin read).
- `src/lib/track.ts` — client `trackStep()` helper (non-blocking, offline-aware).
- `src/routes/index.tsx`, `src/routes/assess/property.tsx`, `src/routes/assess/checklist.tsx`, `src/routes/assess/analyze.tsx`, `src/routes/a/$publicId.tsx` — add step calls.
- `src/routes/admin.index.tsx` — funnel card + hourly sparkline.
- `src/lib/admin-help-digest.server.ts` (or a small new check in the existing cron route) — drop-alert logic.
- i18n keys for the new admin labels.
