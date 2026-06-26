# Make all dates & times consistent in US Eastern across the app

Right now dates/times are rendered in whatever timezone each viewer's device is set to, and the admin chart additionally buckets by UTC — so days don't line up and times differ per device. This makes everything use **US Eastern time (America/New_York)** consistently.

## Root causes
- The admin timeseries RPC buckets reports by **UTC** calendar day, so an evening Eastern report lands on the wrong day.
- Every front-end date/time call (`new Date(...).toLocaleString()` / `toLocaleDateString()`) uses the **browser's** timezone, so the same report shows different days/times on different devices, and `new Date("2026-06-26")` (a bare date string) is parsed as UTC midnight — shifting it a day.

## Changes

### 1. Database migration
Update `get_admin_assessment_timeseries()` to bucket by Eastern wall-clock day:
- `(created_at AT TIME ZONE 'UTC')::date` → `(created_at AT TIME ZONE 'America/New_York')::date`
- Keep the signature, `SECURITY DEFINER`, and `search_path` unchanged so grants stay intact.

### 2. New shared date helper (`src/lib/datetime.ts`)
One source of truth so every screen formats identically:
- `APP_TIME_ZONE = "America/New_York"`
- `formatDateTime(value, lang)` — date + time, forced to Eastern via `Intl.DateTimeFormat({ timeZone })`, with a short "ET" marker.
- `formatDate(value, lang)` — date only, forced to Eastern.
- `formatDayLabel(dayStr, lang)` — for `YYYY-MM-DD` strings from SQL: parse as a plain calendar date (no UTC shift) and render `month/day`.

All use the existing `es-VE` / `en-US` locale mapping already used in the app.

### 3. Replace every user-facing date/time render
Swap raw `new Date(...).toLocale*` calls for the helpers:
- `src/routes/admin.index.tsx` (line 115) — chart day labels → `formatDayLabel`.
- `src/routes/voluntarios.panel.$token.tsx` (line 192) — request timestamp → `formatDateTime`.
- `src/routes/index.tsx` (line 263) — recent report date → `formatDate`.
- `src/routes/mis-reportes.tsx` (line 138) — saved report date → `formatDate`.
- `src/lib/pdf.ts` (line 160) — "assessed on" date in the PDF → `formatDateTime`.

The `ageLabel` "wait time" math in the panel is elapsed-duration based and timezone-independent, so it stays as-is.

## Notes / scope
- Frontend + presentation plus one DB function update. No data is modified.
- Backend ISO timestamps (`toISOString()` in email/rate-limit/server code) are storage values and stay in UTC — correct as-is; only human-readable displays change.
- The hydration warnings in the preview come from a browser password-manager extension (Dashlane), not app code — not addressed here.
