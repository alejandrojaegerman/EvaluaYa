## Problem

Entering the correct admin password on `/admin/voluntarios` crashes the page into the "This page didn't load" error fallback. The backend is fine — the worker logs show no server errors, and the admin server functions all catch their own failures.

The real cause is a **React Rules-of-Hooks violation** in `src/routes/admin.voluntarios.tsx`:

- While locked, the component hits an early `return` (the password form) at line ~177.
- The `useMemo` that computes `filteredRequests` sits *below* that early return (line 182).

So on the first (locked) render React counts fewer hooks; once `unlocked` flips to `true`, the component renders an extra hook (`useMemo`) than the previous render. React throws "Rendered more hooks than during the previous render", the error boundary catches it, and the user sees the generic error page.

## Fix

Move the `filteredRequests` `useMemo` (and it's fine to also move the `pending`/`approved` derived values) **above** the `if (!unlocked) { return ... }` early return, so every hook runs on every render regardless of lock state.

No other changes are needed — the server functions, RPCs, and i18n keys are unaffected.

## Technical detail

In `src/routes/admin.voluntarios.tsx`:
- Relocate the `useMemo(() => { switch (reqFilter) ... }, [requests, reqFilter])` block to before the `if (!unlocked)` block (i.e. directly after the other `useState`/`useServerFn` hooks).
- Leave the plain `pending`/`approved` `.filter()` consts where they are (they are not hooks), or move them up too for tidiness — either works.

## Verification

- Reload `/admin/voluntarios`, enter the correct secret, and confirm the dashboard (pending/approved engineers, matching progress, requests) renders without the error page.
- Confirm an incorrect secret still shows the "wrong password" toast and keeps the form.
