# Device-aware navigation cleanup

Make the nav adapt to the visitor and the device: stop showing "Mis reportes" as a dead end when there's nothing to show, point mobile visitors toward starting an evaluation instead, and surface the higher-value pages directly on desktop.

## 1. Detect whether the visitor has reports

A small client-only hook (`src/hooks/use-has-reports.ts`) returns a boolean that is `true` when **either**:
- this device has at least one entry in local history (`getHistory()`), **or**
- there is an active account session (`supabase.auth.getSession()` / `onAuthStateChange`).

To avoid SSR hydration mismatches, it starts `false` on the server and first paint, then resolves on mount and updates live on sign-in/sign-out. This mirrors the existing client-only patterns already used in `index.tsx` and `use-claim-on-signin.ts`.

## 2. Mobile bottom nav (`BottomNav.tsx`)

Four tabs, last slot is conditional:
- **Has reports:** Inicio · Mapa · **Mis reportes** · Más (current behavior)
- **No reports:** Inicio · Mapa · **Evaluar** · Más

The "Evaluar" tab links straight to the assessment start (`/assess/property`) with a clear icon (e.g. `ClipboardCheck`) — the most direct path to a completed evaluation. Inside the "Más" sheet, the "Mis reportes" entry is added only when the visitor has reports, so it's reachable but never a dead end.

## 3. Desktop top nav (`TopNav.tsx`)

- Promote **Voluntarios** and **Metodología** out of the "Más" dropdown into the main inline nav row.
- Show **Mis reportes** in the main row only when the visitor has reports; otherwise it's hidden entirely.
- The "Más" dropdown keeps the remaining secondary items (Ayuda, Feedback), plus Mis reportes only when relevant.

Resulting desktop main row:
- No reports: Inicio · Mapa · Datos · Voluntarios · Metodología · Más(Ayuda, Feedback)
- Has reports: Inicio · Mapa · Datos · Voluntarios · Metodología · Mis reportes · Más(Ayuda, Feedback)

## 4. New i18n key

Add `nav.evaluate` ("Evaluar" / "Evaluate") in both ES and EN blocks of `src/lib/i18n.tsx` for the mobile fallback tab.

## Technical notes

- New file: `src/hooks/use-has-reports.ts` — client-only boolean hook (history + session), subscribes to `supabase.auth.onAuthStateChange`, cleans up on unmount.
- `src/components/BottomNav.tsx`: use the hook; swap the 3rd tab between the Mis reportes link and the Evaluar link (`to="/assess/property"`); conditionally render the Mis reportes row in the sheet.
- `src/components/TopNav.tsx`: add Voluntarios + Metodología inline links; gate the Mis reportes link on the hook; trim the dropdown accordingly.
- No backend, assessment-flow, or triage changes. No route additions (links target existing routes).
- The `/datos` and `/feedback` hydration warnings in the console come from a browser password-manager extension (Dashlane) injecting attributes into form inputs, not from app code; out of scope here.
