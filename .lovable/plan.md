# Bulk up Admin — two goals, action-first

Two outcomes drive every addition:
1. **More & better evaluations** — quality flags, verification push, data completeness.
2. **Drive help requests to done** — a hands-on stalled-request triage worklist.

Everything stays behind the existing admin secret. New panels live on the two pages that already exist (`/admin` for evaluation quality, `/admin/voluntarios` for resolution), so navigation doesn't change.

---

## Goal 1 — Evaluation quantity & validity (`/admin`)

### A. Quality & completeness scorecard (new top section)
A row of KPIs computed across analyzed reports:
- **Data completeness %**: share of reports with a real location (not "Desconocido"), building info, and a seismic intensity value — plus a breakdown of which field is most often missing.
- **With photos %** and **Low-quality count** (reports with no photos, or mostly "unsure"/single-answer).
- **Professional/verified %** and **AI↔engineer disagreement rate**.

Each KPI is a tappable stat; tapping reveals the relevant drill-down list below.

### B. "Needs attention" report worklist (new section + action levers)
A filterable list of flagged reports (chips: *No photos*, *Mostly unsure*, *Thin (1 answer)*, *Missing location*, *Unverified Red/Orange*). Each row links to the public report `/a/$publicId` and offers actions:
- **Request engineer review** — opens (or creates) a help request for that report so a verified engineer validates it. This directly raises validity.
- **Copy share link** — to re-engage the resident / push completion of a draft.

This is where "increase validity" becomes an action, not just a chart.

### C. Verification push panel (new section)
- Counts: professional vs self-assessment, engineer verdicts (agree / adjust), disagreement rate, recently verified reports.
- A short list of high-risk (Red/Orange) reports that are **still unverified**, each with the same **Request engineer review** button — closing the loop between risky self-assessments and professional confirmation.

---

## Goal 2 — Drive resolution (`/admin/voluntarios`)

### D. Stalled-request triage worklist (new section at top of requests)
A focused queue of at-risk requests (stalled >24h, claimed-no-progress, or open-with-no-coverage), each card showing the engineer, time-in-stage, reminder count, and reclaim count, with one-click levers:
- **Remind engineer** — sends the staged reminder email now and bumps the reminder counter (same mechanism the hourly engine uses, but on demand).
- **Reclaim → pool** — returns a stalled claimed request to the open pool immediately.
- **Reassign** — pick another approved engineer (filtered to ones covering the state) and hand the request to them directly (re-notifies the new engineer).

### E. Engineer worklist context
Inline per-request: which engineers cover that state (so reassign is one tap), and a compact "open in this state / no coverage" flag to spot gaps fast.

---

## What's intentionally NOT changing
- No new auth model, no schema for new tables beyond small helper columns already present.
- No changes to the resident-facing flow or public copy.
- Leaderboard, resident follow-up, and coverage-gap recruiting were considered but deprioritized per your selections (can add later).

---

## Technical notes

**New read RPCs (SECURITY DEFINER, search_path pinned, EXECUTE revoked from anon/authenticated — matching existing pattern):**
- `get_admin_quality_metrics()` → completeness %, photo %, low-quality counts, missing-field breakdown (parses `answers` jsonb for `yes/unsure`/photo presence and `property` for location/building/intensity).
- `get_admin_flagged_reports(_filter text, _limit int)` → flagged report rows (public_id, risk, municipality, reason flags) for the worklist.
- `get_admin_verification_metrics()` → professional share, verdict agree/adjust, disagreement rate, recent verified, unverified high-risk list.

**New action server fns (gated by `adminOk`, service-role via `await import("@/integrations/supabase/client.server")` inside handler):**
- In `admin-analytics.functions.ts`: `adminGetQualityMetrics`, `adminGetFlaggedReports`, `adminGetVerificationMetrics`.
- In `volunteers.functions.ts`: `adminRemindEngineer` (calls `mark_request_reminded` + sends `help-request-reminder` email), `adminReclaimRequest` (calls existing `reclaim_stalled_request`), `adminReassignRequest` (sets `claimed_by`/resets `progress_stage`, fresh `claimed_at`, re-sends access/notification email), and `adminCreateReviewRequest(publicId)` to spin up a help request from a flagged report.
- Reassign needs an approved-engineers-by-state read for the dropdown — reuse `get_approved_engineers` via a thin admin wrapper.

**UI:** extend `src/routes/admin.index.tsx` (sections A–C) and `src/routes/admin.voluntarios.tsx` (sections D–E) with the existing `Card`/`Stat`/`Group` components and `useServerFn` calls. New bilingual strings added to `src/lib/i18n.tsx` (ES + EN) for every label, filter chip, and action.

**Migration:** one migration adding the three read RPCs and grants/revokes. No new tables.

After build: typecheck with `tsgo --noEmit` and verify the admin panels load with the secret.
