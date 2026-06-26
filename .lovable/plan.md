## Goal

Let local engineers volunteer (name, org, WhatsApp, estados they cover), get vetted, and connect with residents who finish an assessment — prioritizing **Red** results, then **Yellow**. Two connection paths ("Both"), all over WhatsApp so we never get in the way:

1. **Resident → engineer (directory):** on a Red/Yellow result, show approved volunteers for the resident's estado; one tap opens WhatsApp pre-filled with the report link.
2. **Resident → board → engineer (callback):** a resident can opt in by leaving their own WhatsApp; this creates a help request that approved engineers see on a private panel and respond to.

Keep it simple: no engineer login. Identity comes from a unique panel link issued on approval.

## Data model (new tables, RLS locked, brokered via server functions)

**`volunteer_engineers`**
- `name`, `organization` (optional), `whatsapp` (E.164), `email` (optional), `states` (text[] of estados covered), `specialization` (optional), `note` (optional)
- `status` (`pending` / `approved` / `rejected`, default `pending`)
- `access_token` (uuid, set on approval — the engineer's private panel key)
- Insert allowed to anon/authenticated with validation (non-empty name, valid-looking WhatsApp, at least one estado). **No public read** — approved listings are served through a security-definer RPC / service-role function that returns only safe columns (name, org, whatsapp, states, specialization), never pending rows or email.

**`help_requests`**
- `public_id`, `assessment_public_id` (nullable link to the report), `state`, `municipality`, `risk_level`, `resident_whatsapp` (E.164), `note` (optional)
- `status` (`open` / `claimed` / `closed`, default `open`), `claimed_by` (engineer id), `claimed_at`
- Insert allowed with validation. **No public read.** Resident WhatsApp is shown only to an approved engineer through their tokened panel, scoped to estados they cover. Reuse the existing DB-backed rate limiter on insert.

Both tables get `created_at` / `updated_at` + the existing `update_updated_at_column` trigger, GRANTs (insert for anon/authenticated, ALL for service_role), and a security-definer RPC for the brokered reads (same pattern as `get_damage_aggregates`).

## Server functions (`src/lib/volunteers.functions.ts`)

Public:
- `submitEngineerSignup` — validated insert as `pending`.
- `getApprovedEngineersForState({ state })` — approved engineers covering that estado first, then nationwide/others as fallback. Safe columns only.
- `submitHelpRequest({ assessmentPublicId, state, municipality, riskLevel, whatsapp, note })` — rate-limited insert.

Engineer panel (gated by `access_token`):
- `getEngineerPanel({ token })` — engineer profile + open/claimed requests for their estados, **Red first** then Yellow, newest first.
- `claimHelpRequest({ token, requestId })` / `closeHelpRequest({ token, requestId })`.

Admin (gated by a generated `VOLUNTEER_ADMIN_SECRET` passed in a header):
- `listEngineerSignups` — pending + approved.
- `reviewEngineerSignup({ id, action })` — approve (generates `access_token`) or reject.
- `listHelpRequests` — oversight view.

All reads/writes go through `supabaseAdmin` inside handlers (tables stay locked), matching `stats.functions.ts`.

## UI

**`/voluntarios` (new, public):** bilingual landing explaining the volunteer program + signup form (name, org, WhatsApp, estado multi-select from `ESTADOS`, specialization, note). On submit: "thanks, we'll review and send your panel link." Recruiting CTA linked from the results community section and methodology page.

**`/voluntarios/panel/$token` (new):** engineer dashboard. Lists open requests for their estados (Red badge first), each with area, risk badge, optional note, "Estoy disponible / I'll respond" (claim) and a WhatsApp button pre-filled to the resident with the report link. Claimed items show who's on it; "Marcar como atendido" closes them. Invalid token → friendly not-found.

**`/admin/voluntarios` (new):** secret-gated (key field stored in session). Pending signups with Approve/Reject; approving reveals the engineer's panel link to copy and send them. Read-only help-request list.

**Result page `/a/$publicId` (edit):** for `red`/`yellow` only, add a "Hablar con un ingeniero voluntario / Talk to a volunteer engineer" section:
- Engineer directory for `record.property.state` (WhatsApp click-to-chat, message pre-filled with the report URL). Red styled more urgently than Yellow.
- "Pedir que me contacten / Request a callback" → inline form for the resident's WhatsApp + note, creating a `help_request`. Green results don't see this (keeps it out of the way).
- If no approved engineer covers the estado yet, show the callback option plus a line that we're expanding coverage.

**i18n (`src/lib/i18n.tsx`):** new ES/EN keys for the program, signup form, panel, admin, and result-page CTA + privacy line.

## Privacy & safety

- Resident WhatsApp stored only on explicit callback opt-in; visible only to approved engineers via tokened panel, scoped to their estados.
- Engineer WhatsApp is public **only after approval** (that's the point of the directory).
- Approval gate prevents impersonation/spam; validate phone format and field lengths client+server (zod); rate-limit resident requests; never index these routes (noindex).
- Update the security memory to document the intentional public exposure of approved-engineer WhatsApp and the locked `help_requests` table.

## Technical notes

- `VOLUNTEER_ADMIN_SECRET` created via `generate_secret` (no user prompt). Engineer panel auth is the per-row `access_token`, not a login.
- New routes are public TanStack routes (top-level), `noindex`; reads brokered server-side so base tables stay private.
- No changes to assessment/AI logic — this is additive frontend + a thin backend.
