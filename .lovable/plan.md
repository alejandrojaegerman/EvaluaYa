# Lightweight Accounts: Close the Claim Gap, Add Visibility, Smooth Onboarding

Three goals: (1) make saved reports actually attach to accounts reliably, (2) give the admin a small view of who signed up and whether it's working, (3) reduce friction/confusion in the save flow.

## Background (what's broken today)
- Accounts are created only via the passwordless "Save my reports" card (`signInWithOtp`).
- Emails send fine (5 confirmation/magic-link emails logged), but **0 reports are linked to any account**.
- The auto-claim (`claimAssessments`) runs **only when the user is sitting on `/mis-reportes`**. If the email link redirects them anywhere else, or they never open that page, their reports are never linked — even though the account exists.

## Part 1 — Fix the claim gap (core)

**1a. App-wide auto-claim on sign-in.**
Add a tiny `useClaimOnSignIn` hook (or fold into the existing root `onAuthStateChange`) so that on any `SIGNED_IN` / existing-session event, on any route, the app calls `claimAssessments({ deviceId: getDeviceId(), publicIds: getHistory()... })`. This guarantees linking the moment the user authenticates, regardless of where the email link lands them. Guard it to run once per session.

**1b. Capture the device id from the URL anywhere.**
The magic link carries `?d=<deviceId>`. Read it on whatever route the user lands on (not just `/mis-reportes`) and feed it into the claim call, so cross-device sign-ins still link the original device's reports.

**1c. Claim the current report from the result page.**
On `/a/$publicId`, when the user signs in via the inline card, immediately claim that specific `publicId` too, so the report they're looking at is saved without needing to visit `/mis-reportes`.

**1d. Verify auth redirect allowlist.**
Confirm the Auth redirect/Site URLs include `https://evaluaya.app/mis-reportes` and the `www` variant so the email link returns into the app. (With 1a in place, linking no longer depends on the exact landing route, but a correct redirect still gives the best UX.)

## Part 2 — Light admin view of signups

Add an "Accounts / Saved reports" card to the existing `/admin` dashboard (same `VOLUNTEER_ADMIN_SECRET` gate as current admin analytics).

New admin server function (loads `supabaseAdmin` inside the handler, `adminOk()` secret check, mirrors `admin-analytics.functions.ts`):
- Total accounts (via `auth.admin.listUsers`).
- Accounts with at least one linked report vs. accounts with zero (the conversion/gap metric).
- Recent signups: email, created date (ET), last sign-in, and count of linked reports.

This lets the admin see at a glance whether saving is working and follow up with anyone stuck.

## Part 3 — Smoother save flow / less confusion

In `SaveReportsCard` and `/mis-reportes` copy (bilingual, ES primary):
- State plainly it's passwordless: "one email, no password, no spam."
- On the "check your email" state, advise opening the link **on this device** for instant access, and that it simply opens their saved reports.
- After a successful sign-in/claim, show a brief confirmation ("Report saved to your account").
- Keep it visually unobtrusive on the result page so it doesn't add drop-off — a single compact card, not a blocking step.

## Technical notes
- Files: `src/components/SaveReportsCard.tsx`, `src/routes/mis-reportes.tsx`, `src/routes/a/$publicId.tsx`, `src/lib/account.functions.ts` (claim already uses service-role + only fills null `user_id`, safe), new hook (e.g. `src/lib/use-claim-on-signin.ts`) wired in `src/routes/__root.tsx`, new `src/lib/admin-accounts.functions.ts`, and the `/admin` index card. New i18n keys in `src/lib/i18n.tsx`.
- RLS/grants verified: `authenticated` can read own rows (`user_id = auth.uid()`); claim runs with service role and never reassigns an already-claimed report.
- No schema changes required.

```text
Email link clicked ──> user authenticated (any route)
                         │
                         ├─ root onAuthStateChange ─> claimAssessments(deviceId + history)
                         │                              └─ links all unclaimed device/report rows
                         └─ /a/:id card sign-in ─────> also claims the current report
```
