# Device-focused experience + Data Room

Today the whole app is locked to a phone-width column (`max-w-screen-sm` in `AppShell`) with a resident bottom nav, and `/mapa` is one long scroll of charts that's heavy on phones and wasted on desktop. This splits the experience by device without touching the assessment flow or its logic.

## 1. Mobile = residents + evaluation

- **Bottom nav stays resident-first:** Inicio, Mapa, Mis reportes, Más. Add a compact "Datos" link inside the "Más" sheet (it opens the reduced data room).
- **Simplify `/mapa` on mobile** to: title, the two headline counters (total assessments / areas), the interactive map with its legend, the start-assessment CTA, and a single "Ver datos completos" link to `/datos`. The heavy sections (trend chart, distribution gauge, severity spotlight, top-areas table, national "why" drill-down, CSV export, institution form) move to the data room.
- The evaluation flow, its screens, and triage logic are untouched.

## 2. Desktop = institutional / analyst use

- **`AppShell` gains a wide mode** so non-resident pages can use the full width with a centered max width (about `max-w-6xl`) instead of the phone column. `/mapa`, `/`, and assessment screens keep the narrow column; `/datos` and `/admin` use wide mode.
- **Desktop top nav bar** (visible at `md+`, bottom nav hidden at `md+`): logo, Inicio, Mapa, Datos, Mis reportes, plus a "Más" dropdown (Voluntarios, Metodología, Ayuda, Feedback) and the language/online controls. Mobile keeps the existing bottom nav (hidden on desktop). Both live in the shell so every page gets the right chrome automatically.

## 3. New `/datos` Data Room

A single route that renders reduced on mobile and robust on desktop.

**Mobile (reduced):** headline totals, risk distribution gauge, a short top-areas list, and a note that the full data room is best on a larger screen, plus CSV export and the institution lead form.

**Desktop (robust dashboard):**
- **Filter bar** across the top: estado dropdown, municipio dropdown (depends on estado), risk-level toggle, and a **date range** (presets: 7/30/90 days + custom). Filters drive every panel below.
- **Two-column layout:** large interactive map on the left; a charts panel on the right with the trend chart, risk distribution gauge, and severity spotlight.
- **Below:** the top-areas table with the inline "why" drill-down (`RiskFactorsPanel`), the national risk-factors panel, CSV export (respects active filters), share-stats image, and the institution lead form.

All existing components are reused (`DamageMap`, `TrendChart`, `RiskGauge`, `SeveritySpotlight`, `RiskFactorsPanel`, `InstitutionLeadForm`, `ShareApp`) — just rearranged into a responsive dashboard grid.

## 4. Backend (filters + date range)

The current aggregates RPC has no date dimension and the timeseries RPC has no location dimension, so filters need filterable reads:
- A migration adds date-range + location params to the read path (a new `get_damage_room(_state, _municipality, _from, _to)` RPC, or optional params on the existing aggregate/timeseries RPCs) returning the same anonymized counts — never addresses, photos, or report ids.
- New server function(s) in `stats.functions.ts` (e.g. `getDataRoom`) wrap it, keeping the service-role brokering pattern and Eastern-time day bucketing already in place.

## Technical notes

- `src/components/AppShell.tsx`: add `wide?: boolean`; render desktop `TopNav` (new) and keep `BottomNav` mobile-only via `md:hidden` / `hidden md:flex`.
- New `src/components/TopNav.tsx`; `BottomNav.tsx` adds the Datos entry in the sheet.
- New `src/routes/datos.tsx` with its own `head()` metadata (title, description, og) and a `/datos` OG image reuse of the map card.
- New `src/components/DataRoomFilters.tsx` for the desktop filter bar (estado/municipio from `src/lib/venezuela.ts`).
- `src/routes/mapa.tsx`: trim to the mobile-simple set; add the "Ver datos completos" link.
- `src/lib/stats.functions.ts` + one migration for filterable RPCs.
- `src/lib/i18n.tsx`: add ES/EN keys for nav "Datos", data-room headings, filter labels, date presets, and the "best on desktop" note.
- Add `/datos` to `src/routes/sitemap[.]xml.ts`.
- Also quietly fix the `/mapa` hydration warning from the institution form (browser-extension attribute mismatch) by guarding that input subtree.

No changes to the assessment flow, triage rules, or stored data shape.