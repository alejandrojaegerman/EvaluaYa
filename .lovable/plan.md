# Follow-through for help requests — unified admin

## Goal
Make it easy for you to push every help request to resolution from a single `/admin`, with priority on RED/ORANGE. Today the actionable triage list lives in `/admin/voluntarios`, the main `/admin` shows only aggregate counts, idle cases stay invisible for 24h, and nothing escalates requests that are never claimed.

## What changes (your choices)
- Levers: **assign/push a specific engineer** + **auto-escalation alerts** (no resident-WhatsApp or admin-records-progress for now).
- Idle threshold for RED/ORANGE: **6 hours** (lower-risk stays at 24h).
- **Unify everything under `/admin`** — fold the volunteer + triage management into the main dashboard.

---

## 1. Unify the admin under `/admin` (tabs)
Restructure `/admin` into tabbed sections behind the single existing passcode gate:

```text
/admin
 ├─ Seguimiento (Follow-through)   ← NEW default tab: the worklist
 ├─ Resumen (Overview)            ← current analytics/quality/matching stats
 ├─ Voluntarios (Volunteers)      ← approvals (moved from /admin/voluntarios)
 └─ Datos (Data)                  ← building clusters, accounts, funnel
```

- One passcode unlock for all tabs (currently you re-enter it on `/admin/voluntarios`).
- `/admin/voluntarios` stays as a thin redirect to `/admin` (Volunteers tab) so existing links/emails keep working.

## 2. "Seguimiento" worklist — the core of follow-through
A single prioritized list of every request that needs a push:
- **Includes:** all `open` (never claimed) + all `claimed` that are idle past their threshold. Excludes resolved/closed.
- **Sort:** RED → ORANGE → YELLOW → GREEN, then oldest first. RED/ORANGE pinned to the top with a clear "needs follow-up" treatment.
- **Per card shows:** location, risk tag, age, who claimed it (or "Sin asignar"), current progress stage, time idle, resident note, linked report.
- **Actions per card:**
  - **Assign/push engineer** — dropdown ranked by state coverage; assigns and emails them (existing `adminReassignRequest`).
  - **Remind** the current engineer (existing `adminRemindEngineer`).
  - **Return to pool** (existing `adminReclaimRequest`).
- **Top summary strip:** counts of "Sin asignar (rojo/naranja)", "Estancadas", "En progreso", "Resueltas", each clicking through to filter the list.

## 3. 6-hour idle flag for RED/ORANGE
Update the matching RPCs so "needs follow-up" is risk-aware:
- A `claimed` request with no progress is flagged when idle > **6h for RED/ORANGE**, > 24h otherwise.
- `open` RED/ORANGE requests are flagged as soon as they pass 6h unclaimed.
- The Overview "Estancadas" stat and the worklist both use this new logic, so urgent cases surface same-day instead of after a full day.

## 4. Auto-escalation alerts
Extend the existing hourly completion engine so nothing slips:
- **Unclaimed RED/ORANGE > 6h:** send a Slack alert (existing Slack wiring) linking to `/admin` + an email to engineers covering that state. Today only *claimed* requests get nudged — open ones are escalated to no one.
- **Claimed RED/ORANGE idle > 6h:** send the staged engineer reminder earlier than the current 24h.
- **De-dup:** each escalation fires once per request per stage (tracked with a new `escalated_at` column) so you and the engineers don't get spammed.
- Lower-risk requests keep the current 24h cadence.

---

## Technical notes
- **DB migration:**
  - Add `escalated_at timestamptz` to `public.help_requests` (de-dup for escalation).
  - Update `get_admin_help_requests`, `get_admin_matching_progress`, and `get_requests_needing_action` to compute a risk-aware idle/`stalled` flag (6h for red/orange, 24h otherwise) and add `open red/orange unclaimed` detection + a `needs_followup` flag.
- **Server functions** (`src/lib/volunteers.functions.ts`): reuse existing `adminListHelpRequests`, `adminReassignRequest`, `adminRemindEngineer`, `adminReclaimRequest`. Add escalation logic to `src/lib/completion-engine.server.ts` (Slack via `src/lib/slack-notify.server.ts`, email via covering-engineer lookup like `get_engineers_to_notify`). No new public endpoints; the hourly cron already drives the engine.
- **UI:** convert `src/routes/admin.index.tsx` to a tabbed shell; move the triage worklist + volunteer approval blocks from `src/routes/admin.voluntarios.tsx` into tab components; lift the passcode to the shell. Replace `src/routes/admin.voluntarios.tsx` with a redirect.
- **i18n:** add ES/EN strings for the new tab labels, summary strip, and escalation states in `src/lib/i18n.tsx`.
- Resident PII (`resident_whatsapp`) stays unexposed, consistent with current behavior.

## Out of scope
Resident-direct WhatsApp from admin and admin-records-progress-on-behalf (not selected). Easy to add later if you want to handle cases personally.
