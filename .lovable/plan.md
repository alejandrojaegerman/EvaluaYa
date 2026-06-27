## Goal

Give approved volunteer engineers a real working queue: see open requests (exists), get notified of new ones (exists + add a daily digest), **report progress** through stages, and **validate/compare the app's AI evaluation** with their own professional verdict — reflected everywhere public.

## 1. Database changes

**`help_requests`** — add progress tracking (status stays `open`/`claimed`/`closed` for matching/visibility):
- `progress_stage text` — `claimed` → `contacted` → `visited` → `resolved` (default null)
- `engineer_note text` — latest note the engineer leaves on the request
- `progress_updated_at timestamptz`

**`assessments`** — extend the existing engineer-verification fields (`verified_by_engineer`, `engineer_notes`, `prior_risk_level` already exist):
- `engineer_verdict text` — `agree` | `adjust`
- `engineer_verified_at timestamptz`

No RLS/policy changes: all writes go through the service-role server functions, and `help_requests` stays non-public-readable.

**New RPC `get_engineer_digest()`** (SECURITY DEFINER, `search_path=public`): returns each approved engineer with an email + valid access token, plus the count and a short list of still-**open** requests in their covered states. Used by the digest job.

## 2. Report progress (engineer panel)

New server fn `updateRequestProgress({ token, requestId, stage, note? })` in `volunteers.functions.ts`:
- Verifies the token's engineer claimed the request.
- Sets `progress_stage`, `engineer_note`, `progress_updated_at`; when `stage = resolved`, also sets `status = closed` (replaces the bare `closeHelpRequest`, which stays as a thin wrapper for compatibility).

Panel UI (`voluntarios.panel.$token.tsx`):
- On a claimed request, replace the single "Close" button with a compact stage stepper — **Contacted → Visited → Resolved** — plus an optional note field.
- Show the current stage as a badge and the last note/update time.

## 3. Validate / compare the AI evaluation

New server fn `submitEngineerVerdict({ token, requestId, verdict, level?, notes? })`:
- Loads the assessment via the request's `assessment_public_id`; requires an approved engineer covering the area.
- `verdict = agree`: keep the AI `risk_level`; mark verified.
- `verdict = adjust`: move current `risk_level` into `prior_risk_level` (if not already set), set `risk_level` to the engineer's `level`.
- Both: set `report_type = professional`, `verified_by_engineer`, `engineer_notes = notes`, `engineer_verdict`, `engineer_verified_at`.

Because the public map/Data Room RPCs key off `risk_level` and `report_type`, this makes the verified level + "verified" counts show up **everywhere public automatically** (map, Data Room, the resident's shareable report and PDF, with the existing `ShieldCheck` verified badge).

Panel UI per claimed request — a "Validar la evaluación de la app / Validate the app's assessment" block:
- Shows the AI risk level, with **"Estoy de acuerdo" (Agree)** and **"Ajustar nivel" (Adjust)** → level picker (green/yellow/orange/red) + notes.
- After submit, shows the verified state ("AI dijo X · verificado por ti como Y").
- Keeps the existing **full professional evaluation** link as the "optional full eval" path (prefilled with the assessment when available).

The `EngineerRequest` DTO + `getEngineerPanel` query gain: `progressStage`, `engineerNote`, `progressUpdatedAt`, and the linked assessment's `aiRiskLevel` / `engineerRiskLevel` / `verified` so the panel can render progress and verdict state.

## 4. Notifications — keep instant, add daily digest

Instant per-request emails already fire in `submitHelpRequest`; left as-is.

Add a once-daily summary of still-open requests in each engineer's area:
- New email template `help-request-digest.tsx` (brand-consistent, Spanish-first) + register it in `email-templates/registry.ts`; sent via the existing `sendSystemEmail` helper.
- New public cron route `src/routes/api/public/hooks/engineer-digest.ts` (POST, `apikey` auth): reads `get_engineer_digest()`, sends one digest per engineer who has ≥1 open request (skips empties), each linking to their panel with UTM tags.
- Schedule with pg_cron (via the insert tool, not a migration) once daily at ~8am ET.

## Technical notes

- New server fns follow the existing token-gated, service-role pattern; no auth middleware.
- Digest matching reuses state coverage (same logic as `get_engineers_to_notify`); idempotency key per engineer per day so retries don't double-send.
- `prior_risk_level` lets every surface show "AI said X → engineer confirmed/changed to Y" instead of silently overwriting.

## Verification

- Unit: verdict logic (agree keeps level, adjust swaps + records prior) and progress transitions in `tests/unit`.
- Manual: claim a request → step through Contacted/Visited/Resolved; submit an "adjust" verdict and confirm the resident report, map, and Data Room show the verified level + badge; trigger the digest route and confirm a matching engineer receives a summary.
