# Close the volunteer notification gap

Today, approving a volunteer silently generates a private panel link — nothing is ever sent to them, so they don't know they're validated or where to claim requests. On top of that, 3 of the 4 approved volunteers signed up without an email (2 individuals, 1 organization), so email alone can't reach them. This plan fixes both: require email going forward, auto-notify on approval when we have an email, and give you a one-tap WhatsApp message for everyone (the only channel that reaches the 3 with no email).

## 1. Make email required for new volunteers

- **Form** (`src/routes/voluntarios.index.tsx`): mark the email field as required (add the required indicator, `required` attribute, and a small "needed so we can send your access link" helper line). Keep WhatsApp required too.
- **Validation** (`src/lib/volunteers.functions.ts`): change the signup schema so `email` is a required, valid address (drop the `.optional()/.or(literal(""))`). Server-side rejection returns a friendly bilingual error.
- **i18n** (`src/lib/i18n.tsx`): add/adjust keys for the required-email label, helper text, and the validation error.

This only affects new signups; existing rows are untouched.

## 2. Auto-notify volunteers on approval (when we have an email)

- New email template `src/lib/email-templates/volunteer-approved.tsx` (Spanish-first, EvalúaYa teal branding, matching the existing template style): "You've been validated — here's your private panel link," with the panel button and a short note that the link is personal.
- Register it in `src/lib/email-templates/registry.ts`.
- In `adminReviewEngineer` (approve branch) in `src/lib/volunteers.functions.ts`: after generating the access token, best-effort send the approval email via `sendSystemEmail` **only if the volunteer has an email** (never blocks the approval). Fetch the volunteer's name/email/type alongside the existing token lookup.

## 3. One-tap WhatsApp notification in the admin panel (reaches everyone)

This is the manual message you asked for — works for the 3 without email and as a fallback for anyone.

- In `src/routes/admin.voluntarios.tsx`, on each **approved** volunteer card add a green **"Avisar por WhatsApp"** button next to "Copy link". It opens `https://wa.me/<digits>?text=<prefilled message>` in a new tab using the volunteer's stored WhatsApp number and their panel link.
- The prefilled message is a friendly Spanish validation notice, e.g.:

```text
Hola {nombre}, ¡buenas noticias! Tu inscripción como voluntario en EvalúaYa
fue validada. Desde este enlace privado puedes ver y atender solicitudes de
ayuda en {estados}: {panelUrl}

Guárdalo, es personal y no requiere contraseña.
```

- For volunteers **missing an email**, show a subtle "Sin email" badge on the card so you can see at a glance who can only be reached by WhatsApp.
- Add the message template + button label to i18n (bilingual). The phone is already stored digits-only, so the `wa.me` link is built directly — no new backend, no secrets.

## What you'll do for the existing 3

After this ships, open `/admin/voluntarios`, unlock, and in the Approved list tap **"Avisar por WhatsApp"** on each of the 3 (and the 4th if you like). It opens WhatsApp with the validated-message + their personal panel link prefilled; you just hit send.

## Technical notes

- No database migration needed — `email`, `whatsapp`, and `access_token` already exist on `volunteer_engineers`.
- WhatsApp uses click-to-chat `wa.me` deep links (no Twilio, no API key).
- Approval email is best-effort and wrapped so a send failure never blocks approval.
- All new copy is bilingual via the existing `useLang` system.

## Out of scope
- Automated WhatsApp sending from the server (would require Twilio + business verification) — manual click-to-send keeps it simple and free.
- Backfilling emails for existing volunteers (you can collect those via the WhatsApp reply if needed).
