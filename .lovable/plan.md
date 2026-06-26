# Volunteer notifications + contact-info hardening

Two problems to fix:
1. Validated volunteers were never notified (the approval email only fires at click-time, and all 4 were approved before it existed). Only Daniel Herrera has an email.
2. Contact info is over-exposed: engineer WhatsApp numbers are publicly scrapable on result pages, and resident numbers are reachable through any (non-expiring) panel link.

Decisions confirmed: send Daniel's email now; gate engineer numbers behind resident consent; mask resident numbers until claimed AND add expiring/re-issuable panel links.

---

## 1. Send approval/access email to Daniel (and make it repeatable)

Add a **"Reenviar enlace de acceso"** (Resend access link) button on each *approved* volunteer card that has an email, in the admin panel (`src/routes/admin.voluntarios.tsx`). The admin secret is already entered there.

- New admin-gated server function `adminResendAccessLink({ adminSecret, id })` in `src/lib/volunteers.functions.ts` that re-sends the existing `volunteer-approved` template to the volunteer's email using the current `access_token`.
- After building, I'll trigger it once for Daniel and confirm `email_send_log` shows `volunteer-approved` → `sent`.
- The 3 without email keep their existing green **"Avisar por WhatsApp"** button (unchanged).

## 2. Engineer phone numbers — reveal only after resident consent

Goal: numbers must not be in the public page payload at all, so they can't be bulk-scraped.

- `getApprovedEngineersForState` stops returning `whatsapp`. It returns only display fields (id, name, org, specialization, coverage). Update `PublicEngineer` type and the `get_approved_engineers` usage accordingly (DB function can stay; we just drop the field from the DTO).
- New server function `revealEngineerContact({ engineerId, state })` returns the `wa.me` link for a single engineer, called only when the resident explicitly taps to connect. Light per-call rate limiting via the existing `rate-limit.server.ts` to discourage enumeration.
- `ConnectEngineers.tsx`: each engineer card shows a **"Contactar por WhatsApp"** button that, on tap, shows a short consent line ("Al continuar compartirás tu contacto con este voluntario") and then fetches + opens the link. Number is never rendered in the DOM before the tap.

## 3. Resident contact info on the engineer panel

### a. Mask resident WhatsApp until the request is claimed
- In `getEngineerPanel`, only include `residentWhatsapp` for requests where `claimed_by === engineer.id`. For open/unclaimed requests, return it as `null`.
- In `voluntarios.panel.$token.tsx`, hide the "Contactar residente" button until the request is claimed; show a hint that claiming reveals the contact. (Claim flow already exists.)

### b. Expiring + re-issuable panel links
- Migration: add `token_expires_at timestamptz` to `volunteer_engineers`. Set it on approval (e.g. now + 90 days). Backfill existing approved rows to now + 90 days so current links keep working.
- `loadEngineerByToken` rejects tokens past `token_expires_at`; the panel then shows an "enlace vencido — solicita uno nuevo" state instead of data.
- Admin panel gets a **"Generar enlace nuevo"** (rotate) action → new server function `adminRotateAccessLink({ adminSecret, id })` that regenerates `access_token`, extends `token_expires_at`, and (if email present) re-sends the access email. This also serves as the "leaked link" remedy.

## 4. i18n

Add bilingual keys for: consent line + reveal button (ConnectEngineers), "claim to reveal contact" hint and "link expired" state (panel), and admin "Reenviar enlace"/"Generar enlace nuevo" buttons + toasts.

---

## Technical notes
- No change to who can *see* requests by area — only the phone numbers are gated.
- `volunteer-approved` template and `notify-email.server.ts` already exist and are reused; idempotency keys will differ for resend/rotate so they aren't deduped.
- Verification: after build, resend Daniel's email and check `email_send_log`; load a result page to confirm no phone numbers appear in the network payload until consent; confirm an unclaimed request hides the resident number on the panel.
