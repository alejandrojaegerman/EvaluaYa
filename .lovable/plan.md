# Lightweight "Save my reports" accounts

## Goal

Let residents optionally save their reports so they can find them later from any device — without adding any friction to the assessment flow or any login wall before the result. Reports are already stored permanently on the server (keyed by `publicId`); today only the *list* of "your" reports lives in `localStorage`, so clearing the browser or switching phones loses the index. This feature gives that index a durable, passwordless home.

Decisions (confirmed): **passwordless email magic link**, **prompt only after the result (fully optional)**, **claim all reports from the current device**.

## How it works (resident's view)

```text
finish assessment ──► result page (no change to flow)
                         │
                         ▼
        "Guarda tus reportes / Save your reports" card (optional)
                         │  enters email
                         ▼
        magic link email ──► tap link ──► /mis-reportes
                         │
                         ▼
   all of this device's reports auto-attach to the account
                         │
                         ▼
        durable list of reports, openable from any device
```

No password, no account screen before the result, nothing required to get a result.

## Architecture

### Identity
Use Lovable Cloud passwordless email (magic link / email OTP). No password, no profile table needed — `auth.users` is enough. Email is the only PII, handled by managed auth.

### Linking reports to a person
Each report needs an owner once claimed, plus a way to know which device produced it:
- Add `user_id` (nullable, FK to `auth.users`) and `device_id` (nullable, text) to `assessments`.
- `analyzeAssessment` already receives `deviceId` — start writing it to the new column on insert.
- Claiming = "attach every unclaimed report from my device to my account." We only ever set `user_id` on rows where `user_id IS NULL`, so a claimed report can never be stolen by someone else guessing a `publicId`/`deviceId`.

### Surviving the email round-trip
The magic link can open in a different browser/tab, so we don't rely solely on `localStorage`. The non-PII random `deviceId` is passed in the redirect URL (`/mis-reportes?d=<deviceId>`) and also read from `localStorage` as a fallback. After the session is established, we claim by `deviceId` (covers the whole history) plus any `publicId`s still in local history.

### Reading "my reports"
A server function gated by `requireSupabaseAuth` returns the signed-in user's reports (lightweight columns only — id, risk, address, state, date — no photo signed URLs). The public per-report view at `/a/$publicId` is unchanged.

## Backend changes

**Migration** (`assessments`):
- Add `user_id uuid` referencing `auth.users(id)`, and `device_id text`; both nullable, both indexed.
- Add RLS policy: authenticated users can `SELECT` rows where `user_id = auth.uid()`. `GRANT SELECT ON public.assessments TO authenticated` (public link viewing keeps using the existing service-role path, so no `anon` grant is added).

**`src/lib/account.functions.ts`** (new):
- `claimAssessments` (`requireSupabaseAuth`): input `{ deviceId, publicIds }`. Sets `user_id = context.userId` on `assessments` where `(device_id = deviceId OR public_id = ANY(publicIds)) AND user_id IS NULL`. Returns claimed count.
- `getMyAssessments` (`requireSupabaseAuth`): returns the user's reports (safe columns) newest-first.

**`src/lib/assessment.functions.ts`**: include `device_id: data.deviceId || null` in the insert.

`src/start.ts` already registers `attachSupabaseAuth`, so the bearer token is attached automatically — no change needed.

## Frontend changes

**`src/components/SaveReportsCard.tsx`** (new): shown on the result page for every result, subtle/secondary so it never competes with the safety guidance.
- Signed out: short pitch + email field + "Enviar enlace / Send link" → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: ${origin}/mis-reportes?d=<deviceId> } })` → success state "Revisa tu correo / Check your email."
- Signed in: "Tus reportes están guardados" + link to `/mis-reportes`.
- Client-side email validation with zod; reads session via `supabase.auth.getSession()`.

**`src/routes/a/$publicId.tsx`**: render `<SaveReportsCard />` (one line, near the existing actions).

**`src/routes/mis-reportes.tsx`** (new, public, `noindex`): doubles as the magic-link landing.
- On mount, wait for the Supabase session (auto-parsed from the URL by the client), then once signed in, call `claimAssessments` a single time using `?d=` (fallback `getDeviceId()`) plus local-history `publicId`s, then load `getMyAssessments`.
- Signed out: inline magic-link sign-in form (same component logic) — no redirect, keeping the app's no-wall ethos.
- Signed in: list of reports (reuse the Home "recent" card styling with `RiskBadge`), each linking to `/a/$publicId`, plus a "Cerrar sesión / Sign out" action.
- Protected data is only ever fetched from the component after the session exists (never from a loader), so SSR/prerender never calls a protected function.

**`src/routes/index.tsx`**: add a small "Mis reportes" link in the recent-assessments section so returning, signed-in users can reach their list (no new nudge banners — keeps Home uncluttered, matching the "after result only" choice).

**`src/lib/i18n.tsx`**: add ES/EN keys for the save card, the my-reports page, sign-in/out, and the email-sent confirmation.

## Auth configuration

Ensure email sign-ups aren't disabled so magic links can create first-time users (email OTP, not anonymous). Default Lovable magic-link emails work out of the box; branded auth email templates are an optional later step, not part of this change.

## Privacy & safety

- Email is the only new PII, stored in managed auth; no profiles table.
- A report is claimable only while unclaimed, so known `publicId`s/`deviceId`s can't reassign someone else's saved report.
- RLS scopes "my reports" to `auth.uid()`; the public link view is untouched.
- `/mis-reportes` is `noindex`; `deviceId` in the URL is a random non-PII token.
- Update the security memory to note `assessments.user_id` ownership, the new authenticated SELECT policy, and the claim-only-when-unclaimed rule.

## Out of scope

No password login, no account/profile editing, no changes to the assessment or AI logic, no sign-in requirement anywhere in the flow.
