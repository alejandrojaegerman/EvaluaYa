# Test the latest volunteer features

Goal: prove the new volunteer workflow works end-to-end — progress stepper, professional verdict, and the daily digest — with both committed automated tests and a one-time live check against current data.

## Scope (what we're testing)
- Engineer panel (`/voluntarios/panel/$token`) + `EngineerRequestCard`
- `claimHelpRequest` → `updateRequestProgress` (contacted → visited → resolved, resolved also closes)
- `submitEngineerVerdict` (agree; adjust + level override → patches assessment to `professional`/verified, preserves `prior_risk_level`)
- Daily digest: `get_engineer_digest` RPC → `/lovable/cron/engineer-digest` route → `help-request-digest` email enqueue

## Part 1 — Automated tests (committed to repo)

### A. Unit tests — `tests/unit/volunteers.test.ts`
Pure-logic coverage of the Zod schemas and helpers (no DB), validating the rules in `volunteers.functions.ts`:
- `progressSchema`: rejects bad stage / over-long note; accepts the three stages.
- `verdictSchema`: `adjust` without `level` fails with `level_required`; `agree` passes without a level.
- Digest panel-URL builder: asserts the `utm_source/medium/campaign=email/email/help_digest` params are appended.
  (Extract the tiny `panelUrl` helper from `engineer-digest.server.ts` into a pure exported function so it can be imported without pulling server-only deps, or duplicate the assertion against the same logic.)

### B. E2E — `tests/e2e/volunteer-panel.spec.ts`
A self-contained Playwright spec that seeds and tears down its own data so it never depends on live records:
- **Setup** (`tests/e2e/fixtures/volunteer-seed.ts`): using `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`, insert one approved engineer (known `access_token`, future `token_expires_at`, a known state) + one analyzed assessment in that state + one open help request linked to it. Return the token.
- **Flow** drives the real UI:
  1. Open `/voluntarios/panel/<token>` → request list renders.
  2. Claim the request → stepper shows `claimed`.
  3. Advance progress: contacted → visited → resolved; assert stepper + that resolved removes it from open list.
  4. On a second seeded claimed request, submit verdict "adjust" to a different level + note → assert success toast.
- **Assertions** (DB read-back via service role): `help_requests.progress_stage='resolved'`, `status='closed'`; linked `assessments.report_type='professional'`, `engineer_verdict`, `engineer_verified_at` set, `prior_risk_level` preserved, `risk_level` overridden.
- **Teardown**: delete the seeded rows by id.

These run with the existing `playwright.config.ts` (localhost:8080) and `vitest` setup.

## Part 2 — Live interactive check (one-time, no files committed)
Run now against current data (1 approved engineer w/ token, 2 open + 3 claimed requests):
- Headless Playwright: query the real engineer token (service role), open the panel, screenshot the list, exercise one progress step on a claimed request, and capture the verdict UI. Report final URL + screenshots.
- Digest endpoint: `POST /lovable/cron/engineer-digest` with the service-role bearer; expect `{ ok, sent, total }`. Cross-check `get_engineer_digest()` output and confirm a `help-request-digest` row appears in `email_send_log` (pending→sent).
- Report what passed and any gaps.

> Note: the live check mutates one real claimed request's progress stage. I'll pick a claimed (not open) request and revert the `progress_stage` afterward so map/admin data is unchanged.

## Technical notes
- Service-role seeding/readback in tests uses `process.env.SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_URL` (available in the sandbox); never hardcoded.
- E2E seed data uses an obvious sentinel (e.g. name `__TEST__ Digest Engineer`, address marker) for safe cleanup.
- No app/runtime code changes expected unless a test surfaces a real bug; the only possible refactor is exporting the `panelUrl` helper for unit testing.

## Deliverables
- `tests/unit/volunteers.test.ts`
- `tests/e2e/volunteer-panel.spec.ts` + `tests/e2e/fixtures/volunteer-seed.ts`
- Live check results (screenshots + endpoint/email confirmation) reported in chat.
