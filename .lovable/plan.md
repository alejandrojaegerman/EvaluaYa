# Review & approve volunteers — fix access + add notifications

The construction company (Constructora ROMACA) already came through and is sitting in your queue as **pending**. The review/approve UI exists at `/admin/voluntarios`; the only blockers are (1) you don't know the unlock password, and (2) there's no alert when new applicants arrive. This plan fixes both.

## 1. Give you a password you actually know

The admin page is unlocked by a stored secret (`VOLUNTEER_ADMIN_SECRET`). Rather than reveal the old value, I'll open a secure form so you type a **new** password. Nothing is shown in code or chat.

Then to review/approve:
- Go to `https://evaluaya.app/admin/voluntarios` (unlisted page — reach it by typing the URL)
- Enter your new password
- ROMACA appears under **Pending** → click **Approve**
- After approval it moves to **Approved**, where **Copy link** gives you their private engineer-panel URL to send them

## 2. Email you when someone new signs up

A notification will be sent to **ajaegerman@thinkampersand.com** every time the volunteer/organization form is submitted, so you never have to keep checking the page.

The email will include:
- Whether it's an individual engineer or an organization
- Name / organization name
- Coverage state(s), WhatsApp, email, specialization, and any note
- A direct link to the admin page to review

```text
New volunteer sign-up — EvalúaYa
────────────────────────────────
Type:        Organization
Name:        Constructora ROMACA
Contact:     Marisol Gil
Coverage:    Distrito Capital
WhatsApp:    +58 424-1418355
Note:        —
[ Review in admin panel ]
```

## Technical notes

- **Password**: update the existing `VOLUNTEER_ADMIN_SECRET` via the secure secret form (no code change; the admin route already compares against it).
- **Email**: app-email infrastructure (queue/cron) is already provisioned; only the transactional send path needs scaffolding. Steps:
  1. Scaffold transactional email (creates the send route + template registry).
  2. Add a branded `volunteer-signup-notification` React Email template (teal `#0f3443` brand, Spanish-first) addressed to the fixed admin address.
  3. In `submitEngineerSignup` (`src/lib/volunteers.functions.ts`), after a successful insert, enqueue the notification server-side with service-role credentials and an idempotency key (so it fires reliably even though the form is unauthenticated). A send failure is logged but never blocks the signup.
- Recipient address is currently hardcoded to `ajaegerman@thinkampersand.com`; tell me if you'd like it configurable later.
- Note: the hydration warnings you may see on this page come from a browser password-manager extension (Dashlane), not the app.
