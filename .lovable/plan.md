# Fix: Auth emails not sending / "No authentication emails yet"

## What's happening

Your branded email system is fully built and is **working in preview**, but it is **not live yet**.

Diagnostic results:
- Domain `notify.evaluaya.app`: ✅ verified and ready.
- Preview webhook (`/lovable/email/auth/webhook`): ✅ returns 401 (route is live, verifying signatures — correct behavior).
- **Live webhook + queue route on `evaluaya.app`: ❌ return 404 (routes not deployed).**
- `email_send_log` table: empty — no auth email has ever been queued or sent.

The auth system calls the **live** webhook URL when someone requests a magic link / sign-up confirmation. Because that live route 404s, nothing gets queued, nothing is logged, and the dashboard shows "No authentication emails yet."

## The fix: publish

The email webhook and queue routes (added in the previous turn, along with the `start.ts` middleware bypass and `vite.config.ts` changes) only exist in the preview build. Publishing pushes them to the live site, and the publish step also provisions the production email queue cron + vault secret needed to actually send.

```text
Publish  →  live routes go live (/lovable/email/auth/webhook, /lovable/email/queue/process)
         →  Supabase auth hook can reach the live webhook
         →  magic-link / signup request enqueues an email
         →  cron drains queue → branded email sends from notify.evaluaya.app
```

## Steps

1. **Publish the app** so the email routes deploy to `evaluaya.app` and production email infrastructure provisions.
   - This is the single required action and is done from the Publish button.
2. **Verify after publish** (I'll do this):
   - Confirm `https://evaluaya.app/lovable/email/auth/webhook` returns 401 (not 404).
   - Confirm `https://evaluaya.app/lovable/email/queue/process` is reachable.
3. **Trigger a real test**: from the live site, go through "Save my reports" / sign-in to request a magic link, then confirm a row appears in `email_send_log` with status moving `pending → sent`, and that the branded email arrives.
4. If anything is still stuck after publish (e.g. the dashboard still shows no emails, or a row stays `pending`), I'll check the auth hook activation status and the production cron job and finish wiring it.

## Note on the dashboard panel

The "No authentication emails yet" card you're looking at is populated from sent-email history. It will stay empty until the first auth email actually flows through the live system — which can't happen until the routes are published. It is not a separate broken step.

<presentation-actions>
<presentation-open-publish>Publish your app</presentation-open-publish>
</presentation-actions>
