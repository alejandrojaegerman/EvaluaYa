## Goal

Make the passwordless "Guarda tus reportes" magic-link email come from your **evaluaya.app** domain (instead of the default Lovable sender), with Spanish-first EvalúaYa branding.

## Step 1 — Set up the sending domain (your action, one time)

Email sending uses a delegated sending subdomain (recommended: **notify.evaluaya.app**) so it doesn't interfere with the website itself. You'll complete this in the setup dialog, which adds the required DNS records automatically since evaluaya.app is managed in Lovable.

<presentation-actions>
<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>
</presentation-actions>

## Step 2 — Build branded auth emails (I do this)

Once the domain is set (DNS can keep verifying in the background — it doesn't block this step):

- Provision the email infrastructure (send queue, logging, suppression handling).
- Scaffold the six auth email templates (magic link, signup, recovery, invite, email change, reauthentication).
- Style them to match EvalúaYa: Spanish-primary copy with English secondary, brand colors/typography pulled from the app's design tokens, logo, and clear "Ver mis reportes" CTA. White email background per email best practices.
- Wire the magic-link template so the sender and branding reflect evaluaya.app.

## What changes for users

- The sign-in email arrives from `notify.evaluaya.app` (e.g. `EvalúaYa <hola@notify.evaluaya.app>`) with your branding — better trust and deliverability for on-the-ground users.
- No change to the sign-in flow itself; only the email's sender + look.

## Notes

- Emails start sending from your domain **after DNS verifies** (can take up to 72h, usually much less). Until then, sign-in still works via the default sender.
- You can monitor verification and delivery in **Cloud → Emails**.

## Technical details

- `email_domain--setup_email_infra` creates pgmq queues, RPC wrappers, send log, suppression list, unsubscribe tokens, the queue-processing route, and cron.
- `email_domain--scaffold_auth_email_templates` creates the auth webhook route + React Email templates; I then brand them from `src/styles.css` tokens and the existing i18n strings.
- Sender = delegated subdomain FQDN (`notify.evaluaya.app`); no manual edits to generated Supabase auth config.
