## Goal

Forward the new help request — Baruta, Miranda, 🔴 red, received 9:51pm ET — to the verified (approved) engineers, including the one who didn't get the automatic email.

This is a one-time send for this single request. No change to the normal matching logic.

## Why it didn't reach everyone

The automatic notifier only emails approved engineers whose coverage states include the request's state (Miranda). Of the two verified engineers:
- **Daniel Herrera Hidalgo** — covers Miranda → already received the email (confirmed "sent").
- **Gustavo Oliveira** — covers Carabobo, Distrito Capital, La Guaira, Aragua, but **not** Miranda → correctly skipped by the matcher, so he never got it.

## What I'll do

1. Add a small, admin-secret-protected one-off action that:
   - Loads the specific request `cab526f9-d061-4f93-ba3f-fbceb4ea7d5c` (Baruta / Miranda / red).
   - Loads **all approved engineers** that have an email and a valid panel access link — regardless of coverage state.
   - Sends each the existing `help-request-notification` email (same template the matcher uses) with their personal panel link, so they can open the panel and **claim** the request.
   - Uses a per-engineer idempotency key (`manual-forward:<requestId>:<engineerId>`) so Daniel isn't double-sent and re-runs are safe.

2. Run it once against this request.

3. Verify in the email send log that Gustavo's send shows `sent`, then confirm back to you.

## How claiming works (so it's clear)

The email contains a private panel link. The engineer opens it, sees the open request, and taps **claim** — which reveals the resident's WhatsApp and lets them report progress (Contacted → Visited → Resolved). Nothing about that changes here.

## Technical notes

- New file: a guarded server route under `src/routes/api/public/admin/forward-help-request.ts` that checks `VOLUNTEER_ADMIN_SECRET` (passed as a header), then reuses the existing `sendSystemEmail` helper and `help-request-notification` template — no new email template or infrastructure.
- It selects approved engineers directly (not via `get_engineers_to_notify`, which filters by state), so the verified-but-uncovered engineer is included.
- After the one-time run and verification, I'll leave the route in place only if you want a reusable "forward to all verified engineers" admin button; otherwise I'll remove it. Default: remove it to keep the app lean.

## Optional follow-up (not in this change)

If you'd rather Gustavo always hear about Miranda requests, the durable fix is adding Miranda to his coverage states — say the word and I'll do that separately.
