# Volunteer matching + Admin analytics

Two workstreams, scoped to your answers: deepen volunteer matching, and add a dedicated admin analytics dashboard. The public **mapa** page stays damage-only — no changes there.

## 1. Volunteer matching build-out

### a. Auto-notify engineers (email) when a relevant request arrives
When a resident submits a help request, find approved engineers who cover that estado **and** have an email on file, and send each a best-effort branded email with the area, risk level, note, and a one-tap link to their private panel. Never blocks the resident's submission (same best-effort pattern already used for signup alerts).

- New email template `help-request-notification.tsx` (Spanish-first, teal brand), registered in the template registry.
- `submitHelpRequest` extended to look up covering engineers and enqueue notifications.

### b. Notify resident on claim (WhatsApp)
Residents only give a WhatsApp number today, so "notify on claim" works via a prefilled WhatsApp deep link rather than an automated send:
- In the engineer panel, claiming a request reveals a **"Contactar al residente"** button that opens WhatsApp with a prefilled bilingual intro ("Hola, soy ingeniero(a) voluntario(a) de EvalúaYa…") to the resident's number.
- The claim action records `claimed_at` (already in schema) so response time can be measured for analytics.

### c. Smarter matching
Improve how requests are surfaced to engineers and expose gaps:
- **Ranking** in the panel: red → yellow → green, then oldest-unclaimed first (so urgent + waiting longest rises to top), with a subtle "espera Xh" age indicator.
- **Specialization hinting**: lightweight keyword tagging so an engineer's specialization (e.g. "estructural", "geotécnico") is shown against requests; no rigid filtering, just a visible match badge.
- **Coverage-gap detection** (surfaced in the admin dashboard, see below): estados with open requests but zero approved engineers.

## 2. New admin analytics dashboard (`/admin`)

A new overview page gated by the existing `VOLUNTEER_ADMIN_SECRET` (same unlock as `/admin/voluntarios`, which stays as-is for review/approval). After unlocking, it shows:

**Assessments**
- Total assessments, split Green / Yellow / Red, completion rate (analyzed vs draft).
- Reports over time (last 30 days) line/area chart.
- Top estados by report volume.

**Volunteers**
- Engineers total with pending / approved / rejected breakdown.
- Individuals vs organizations.
- Coverage map: how many approved engineers cover each estado.

**Matching**
- Help requests: open / claimed / closed.
- Claim rate and average time-to-claim.
- **Coverage gaps** table: estados with open requests and no engineers — the actionable list for recruiting.

A clear link from `/admin` → `/admin/voluntarios` for the review queue.

## 3. Out of scope (per your choices)
- Public mapa stays damage-only; no volunteer/matching data exposed publicly.

---

## Technical notes

- **Analytics data**: new `src/lib/admin-analytics.functions.ts` with an `adminGetAnalytics` server fn gated by `adminSecret` (reusing the constant-time check). It uses `supabaseAdmin` and SECURITY DEFINER RPCs for the heavier aggregates (assessment time-series, engineer coverage counts, request stats + time-to-claim, coverage gaps) added via one migration. Charts use the existing `src/components/ui/chart.tsx` (recharts).
- **Admin route**: `src/routes/admin.index.tsx` → `/admin`, `noindex`, secret-gated client unlock mirroring `admin.voluntarios.tsx`. No new auth system.
- **Matching emails**: `submitHelpRequest` queries approved engineers via a new RPC `get_engineers_to_notify(_state)` (returns id/email/access_token for approved engineers with non-null email covering the state), then calls `sendSystemEmail` per recipient through the existing `notify-email.server.ts` pipeline.
- **Panel changes**: `src/routes/voluntarios.panel.$token.tsx` (+ any panel component) gets the post-claim "Contactar al residente" WhatsApp link and the age/specialization indicators; `getEngineerPanel` ranking updated.
- **i18n**: new bilingual keys for the dashboard, panel contact button, and email copy.
- **No changes** to `src/routes/mapa.tsx`, the public stats functions, or existing RLS — all reads go through service-role server fns gated by the admin secret or per-row access token.
