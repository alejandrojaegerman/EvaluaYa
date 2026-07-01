# Close the help-request loop

## The problem (what I verified)

The engineer side already works: new-request emails, daily digests, staged reminders, auto-reclaim of stalled cases, and Slack alerts all fire and show `sent` in the logs. There are 5 approved engineers (all with email + panel links) covering the states where requests sit. Yet **8 requests are open (6 red/orange), 1 claimed, 2 closed** — engineers are reached but the loop never closes.

Two real gaps:
1. **The resident is never contacted by the app.** They give WhatsApp + name + address only — no email. Claiming and progress updates notify Slack/admin but send the resident nothing.
2. **The resident-tracking loop is half-built and disconnected.** `getResidentRequestStatus`, `residentConfirmRequest`, and the `resident_update_request` DB function all exist, and `submitHelpRequest` already returns a `residentToken` — but no page uses any of it, and the UI discards the token.
3. **The copy over-promises.** "Un evaluador te contactará pronto" / "Uno de ellos tomará tu caso y te contactará" are firm guarantees, currently broken for most requests.

## What we'll build

### 1. Require resident email
- Migration: add `resident_email` (text) and `resident_confirmed_outcome` (text: `resolved` | `unresolved`) to `help_requests`. Keep the column nullable in the DB (existing rows) but require it in the form.
- `ConnectEngineers.tsx`: add a required email input (validated), keep name/WhatsApp/address.
- `helpSchema` in `volunteers.functions.ts`: add `email` (required, valid, max 255); store it on insert.
- New i18n keys for the email label/placeholder/hint (ES + EN).

### 2. Honest promises (copy)
Rewrite in `src/lib/i18n.tsx` (ES + EN), removing all guarantees of contact or timing:
- `connect.subtitleRed/Orange/Yellow`, `connect.requestBody`, `connect.requestDone`, `connect.privacy`.
- New framing: "Compartiremos tu caso con la red de evaluadores voluntarios. Si un voluntario está disponible en tu zona, te escribirá. Es un servicio comunitario gratuito y no podemos garantizar una respuesta ni un tiempo específico." Success message becomes "Recibimos tu solicitud. Te avisaremos por correo cuando un voluntario la tome."
- Sweep result page / homepage for any remaining "te contactará"-style guarantees and soften them.

### 3. Resident status updates (email)
New React Email templates (in `src/lib/email-templates/`, registered in `registry.ts`), all sent best-effort via existing `sendSystemEmail` with idempotency keys and the resident tracking link:
- `resident-request-received` — sent on submit: "we received your case, here's your tracking link", sets honest expectations.
- `resident-claimed` — sent when an engineer claims: "a volunteer took your case."
- `resident-progress` — sent on `contacted` / `visited` progress updates.
- `resident-resolved` — sent on `resolved`: includes the one-tap confirm link.

Wire the sends into the existing handlers: `submitHelpRequest`, `claimHelpRequest`, `updateRequestProgress`. Each looks up the request's `resident_email` and sends the matching template; failures are logged and never block the engineer action.

### 4. Resident tracking + resolution confirmation page
- New public route `src/routes/seguimiento.$token.tsx` (token = `resident_token`). Calls `getResidentRequestStatus` to render a status timeline (received → claimed → contacted → visited → resolved) with the volunteer's first name and any note.
- When status is `resolved` (or claimed and awaiting feedback), show two one-tap buttons: **"Sí, quedó resuelto"** and **"Todavía estoy esperando"**, calling `residentConfirmRequest`.
- Extend `residentConfirmSchema`/`residentConfirmRequest` to also record the outcome, and reopen the request (status back to `open`, clear claim) + Slack alert to admin when the resident says "still waiting."
- All resident emails deep-link here; success page after submitting a request shows the link too.

### 5. Engineer accountability tightening
- Reclaim red/orange stalled claims faster (e.g. 24h instead of 48h) in the completion engine's RPC threshold; keep lower-risk at 48h.
- When a resident reports "still waiting" after a `resolved`, reopen and re-notify covering engineers + Slack.
- Surface `resident_confirmed_outcome` in the admin follow-through view (it already tracks `residentConfirmed`).

## Technical notes

- Email infrastructure is already live and sending; new templates only need files + registry entries — no infra setup.
- Resident routes are public (token-gated via the unguessable `resident_token`); they call the existing service-role-backed server fns, so no auth/RLS changes beyond the two new columns (the table's public policies stay insert-only + no-read).
- `resident_update_request` RPC needs a small update to accept/store the outcome and reopen on "unresolved"; done via migration.
- Keep every resident send best-effort (`.catch` + log) so it never blocks engineer actions, matching the existing pattern.

## Out of scope
- No automated WhatsApp messaging to residents (needs WhatsApp Business API — separate cost/setup). Engineers still contact residents directly via WhatsApp as today; email becomes the app's automated channel.
