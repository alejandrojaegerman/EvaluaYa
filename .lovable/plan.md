# Closer admin tracking of help requests

## The core problem
A `claimed` request only means an engineer tapped "claim" — it is **not** proof they did anything. The database already tracks the real lifecycle (`progress_stage`: claimed → contacted → visited → resolved, plus engineer note + timestamp + professional verdict), but the admin panel ignores all of it and nothing alerts you when a claimed request stalls.

## What you'll get
1. **Full lifecycle visible in the admin panel** (Voluntarios + dashboard).
2. **A "stalled" flag** for requests claimed >24h ago with no progress past `claimed`.
3. **Admin email alerts**: new request, resolved request, and a daily digest of stalled + unclaimed-backlog requests.

---

## 1. Surface the real data (backend)

New `SECURITY DEFINER` SQL function `get_admin_help_requests(_limit)` returning per request:
- location (state, municipality), risk level, age (created_at)
- `status` (open/claimed/closed) **and** `progress_stage` + `progress_updated_at` (time-in-stage)
- claimed engineer **name** (join `volunteer_engineers` on `claimed_by`) + `claimed_at`
- `engineer_note`
- professional verdict vs AI (join `assessments` on `assessment_public_id` → `risk_level` vs `prior_risk_level`, `report_type`)
- computed `stalled` boolean: `status='claimed' AND coalesce(progress_stage,'claimed') IN ('claimed') AND claimed_at < now() - interval '24 hours'`

New function `get_admin_matching_progress()` returning stage breakdown counts (claimed-only, contacted, visited, resolved) + stalled count, for the dashboard.

`adminListHelpRequests` server fn is rewired to call the new RPC and return the richer `AdminHelpRequest` shape.

## 2. Enhanced admin panel (UI)

**`/admin/voluntarios` — request list:** replace the one-line rows with lifecycle cards showing a progress stepper (claimed → contacted → visited → resolved), claimed-by engineer name, time since last update, the engineer's note, verdict-vs-AI chip, and a red **"Stalled · needs follow-up"** badge when flagged. Add quick filter chips (All / Open / Claimed / Stalled / Resolved).

**`/admin` dashboard — Matching section:** add a progress-stage breakdown row and a "Stalled" stat (highlighted when > 0) alongside the existing open / claim-rate / avg-claim stats.

## 3. Admin notifications (email to the existing admin address)

Reuses the existing system-email helper and the admin recipient already used for volunteer/feedback alerts.

- **New request** → immediate admin email when a resident submits a help request (added alongside the existing engineer notification).
- **Resolved** → immediate admin email when an engineer marks a request `resolved`.
- **Daily digest** → one email/day listing stalled claimed requests (>24h, no progress) + the unclaimed open backlog. Sent via a new cron route, idempotency-keyed by date so it's at most one digest per day.

Three new branded email templates (Spanish-first, teal identity) registered in the email registry: `admin-help-new`, `admin-help-resolved`, `admin-help-digest`.

## 4. Bilingual strings
Add ES/EN keys for stage labels, "stalled / needs follow-up", time-in-stage, verdict chips, and the new filter chips.

---

## Technical notes
- **DB:** one migration adding `get_admin_help_requests` and `get_admin_matching_progress` (both `SECURITY DEFINER`, `search_path=''`/`public`, no anon grant — called only through admin-secret-guarded server fns). No new columns needed; stalled is computed and the daily digest dedupes via email idempotency key.
- **Cron:** new `/lovable/cron/admin-help-digest` route mirroring the existing `engineer-digest` auth pattern (Bearer service-role), plus a `pg_cron` schedule (~9am ET daily) registered via the insert tool.
- **Server fns:** extend `submitHelpRequest` (new-request admin email) and `updateRequestProgress` (resolved admin email); both best-effort so a mail failure never breaks the user action.
- **Stall window** fixed at 24h (per your choice); easy to change in one place later.
