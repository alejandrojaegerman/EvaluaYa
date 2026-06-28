… keep existing context …

# Goal

Make volunteer-engineer onboarding more trustworthy and partly automated, and turn the help-request lifecycle into a system that actively drives cases to completion — supporting engineers at each step while tracking progress and reducing abandoned requests.

This builds on what already exists (claim → contacted → visited → resolved stages, `engineer_note`, verdicts, daily engineer + admin digests, the `stalled` flag) and fills the gaps: no credential checks, no auto-reclaim, no per-stage nudges, no resident-facing status, no engineer stats.

---

## 1. More robust + automated validation

**At signup** (`/voluntarios`), add two fields:
- **Número CIV / colegiatura** (license number) — required for individuals, optional for organizations.
- **Credencial / constancia** — upload one image (CIV card, company registry, or letterhead) to a new private `engineer-credentials` bucket, mirroring the existing private `assessment-photos` flow.

**Automatic pre-checks** run server-side on submit and produce a stored trust score + flags (no auto-approval — admin still decides):
- License-number format sanity (non-empty, plausible length/characters).
- Duplicate detection: same email, WhatsApp, or license already in the table → flag.
- Disposable / free-domain email heuristic → informational flag.
- Missing credential image or missing license → flag.
- Score = simple weighted tally surfaced to the admin.

**Admin review** (`/admin/voluntarios`) gains, per pending volunteer: the trust score, the list of flags, and a one-tap **View credential** (signed URL preview). Approve/reject stays manual but is now evidence-based.

## 2. Drive requests to completion (completion engine)

A new hourly cron (`/lovable/cron/completion-engine`) running three deterministic passes:

**a) Auto-reclaim stalled requests** — a claimed request with no stage progress past its deadline (default 48h on `claimed`, configurable per stage) is released back to the open pool: `status='open'`, `claimed_by` cleared, `reclaim_count++`. Other approved engineers in that state are re-notified, and the previous engineer gets a courteous "released" email.

**b) Staged auto-reminders** — for still-claimed requests sitting in a stage past its soft SLA (e.g. 24h), email the assigned engineer a nudge to advance or hand back, tracking `reminder_count` / `last_reminder_at` so we don't spam (max reminders before reclaim kicks in).

**c) Resident-side updates & loop closure** — every request gets a `resident_token`. On submission the resident sees/keeps a private status link (`/solicitud/$token`, low-bandwidth public page) showing the live stage (Solicitud recibida → Ingeniero asignado → En contacto → Visita → Resuelto) and a **Confirmar que recibí ayuda** button. Resident confirmation sets `resident_confirmed_at` and notifies the admin — the real signal that a case truly completed. When an engineer advances a stage, the resident status page reflects it immediately.

## 3. Support engineers + track progress

**Per-request guidance** in the engineer panel: each claimed request shows stage-specific next steps and a short on-site checklist (contact resident → schedule visit → inspect key elements → submit verdict), so engineers know exactly what to do and capture findings consistently. Presentation only, bilingual copy.

**Completion stats & recognition**: the panel header gets a "Tu impacto" card — resolved count, open/claimed in your area, average response time — plus a recognition tier badge (e.g. Bronce/Plata/Oro by resolved count). The same badge appears next to the engineer's name in the `/voluntarios` verified showcase (names only, no contact info — unchanged privacy rule).

**Admin visibility**: the admin matching view surfaces reclaimed counts and resident-confirmed resolutions alongside the existing stalled metric, and the daily admin digest includes reclaims + resident confirmations.

---

## Technical details

**Migration (schema only):**
- `volunteer_engineers` add: `license_number text`, `credential_path text`, `trust_score int default 0`, `trust_flags jsonb default '[]'`.
- `help_requests` add: `resident_token uuid default gen_random_uuid()` (unique), `reclaim_count int default 0`, `reminder_count int default 0`, `last_reminder_at timestamptz`, `resident_confirmed_at timestamptz`. Backfill `resident_token` for existing rows.
- New RPCs (SECURITY DEFINER, `search_path=public`, service-role): `get_requests_needing_action()` (returns stalled-for-reclaim + reminder-due sets with engineer email/token/area), `get_engineer_stats(_engineer_id uuid)` (resolved, claimed, open-in-area, avg response seconds, badge tier), and extend `get_admin_matching_progress` with `reclaimed` + `resident_confirmed`.
- Private storage bucket `engineer-credentials` (via storage tool) + `storage.objects` RLS mirroring `assessment-photos`.

**Server (TanStack `createServerFn` / `.server.ts`, never expose service role):**
- Extend `signupSchema` + `submitEngineerSignup` with license/credential + `runValidationPrechecks()` writing `trust_score`/`trust_flags`.
- New `credential upload` path reusing the existing photo-upload mechanism.
- `runCompletionEngine()` in `completion-engine.server.ts` (reclaim + reminders + resident nudges), exposed at `src/routes/lovable/cron/completion-engine.ts` with the same Bearer service-role guard as existing cron routes.
- `getResidentRequestStatus({token})` and `confirmResidentResolved({token})` (public, token-scoped) for `/solicitud/$token`.
- `getEngineerStats` for the panel; admin list/review extended to return trust data + signed credential URL.

**Email templates (registry):** add `engineer-reminder`, `engineer-reclaimed`, `admin-resident-confirmed`; reuse `help-request-notification` for re-notify after reclaim. All Spanish-primary with the existing ❤️/🇻🇪 footer.

**Cron:** add one `pg_cron` job calling `/lovable/cron/completion-engine` hourly, using the same vault service-role Bearer pattern as the current digest jobs.

**Routes/UI:** new public `/solicitud/$token`; enhancements to `voluntarios.panel.$token.tsx` (impact card, badges, per-stage guidance), `admin.voluntarios.tsx` (trust score/flags/credential view, reclaim & confirmation metrics), `voluntarios.index.tsx` (recognition badges, new signup fields). All new strings added to `src/lib/i18n.tsx` (ES + EN).

**Constraints respected:** no resident login; WhatsApp stays manual (we link the status page rather than auto-messaging); contact info never exposed in the public roster; deterministic safety/verdict logic untouched.
