## Goal

Generate a new strong admin passphrase, store it as the backend secret that gates the admin panel, and give you the value so you can share it with Rodrigo.

## How admin access works today

The admin dashboard (`/admin`) is protected by a single **shared passphrase** stored in the backend secret `VOLUNTEER_ADMIN_SECRET`. There are no individual admin accounts — anyone with the panel enters the same value. Every admin server function (analytics, volunteers, request triage, accounts, funnel, API usage) checks the request value against this one secret.

This means: rotating it gives Rodrigo access, but also **replaces the passphrase you currently use** — you'll both use the new one, and the old value stops working immediately.

## What I'll do

1. Generate a strong, human-shareable passphrase (random, high-entropy but copy/paste friendly).
2. Rotate the `VOLUNTEER_ADMIN_SECRET` backend secret to that new value (replace the existing one — no code changes needed; all admin functions already read this secret).
3. Show you the new passphrase in chat so you can pass it to Rodrigo through a secure channel (e.g. a password manager share, not plain email).

## Notes

- No code changes — this is purely a secret rotation. The login form, gating logic, and all admin server functions stay exactly as they are.
- After rotation, you (and anyone else previously using the old value) must re-enter the new passphrase the next time you open `/admin`.
- If you'd later prefer true per-person admin accounts (so you can revoke Rodrigo individually without rotating everyone), that's a larger auth change we can scope separately — out of scope here.

## Technical detail

- Rotate `VOLUNTEER_ADMIN_SECRET` to the newly generated value via the secrets tooling, then surface the value once so it can be shared.
