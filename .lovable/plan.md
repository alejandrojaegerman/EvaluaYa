# Data room polish: smart filters, cleaner bottom, desktop footer

Three improvements to `/datos` plus an app-wide desktop footer.

## 1. Filters show only options with records (for the active date range)

Today the State dropdown lists every Venezuelan state and the Municipality dropdown lists every municipality in a state — even ones with zero reports. We'll restrict both to options that actually have reports within the currently selected date range (7 / 30 / 90 / all).

How it works:
- The data room already fetches aggregated areas. We'll add a lightweight options fetch keyed only to the date range (not the state/municipality selection), so the dropdowns stay populated even after a state is chosen.
- Specifically, when the range changes, fetch the range-scoped aggregates **without** a state/municipality filter and derive:
  - the set of states that have at least one report, and
  - per-state, the set of municipalities that have at least one report.
- `DataRoomFilters` receives these as `availableStates` and `availableMunicipios` and renders only those entries (intersected with the known/named places so labels stay clean). Unknown/"Desconocido" entries are excluded from the dropdowns.
- Edge cases: if a range has no data at all, the State dropdown shows only "Todos" and stays effectively empty; if a previously selected state/municipality no longer has records in the new range, the selection resets to "Todos" automatically so the user never lands on an empty view.

## 2. Tidy the awkward bottom of the page

On desktop the lower sections (`Exportar y compartir`, the institution lead form, the "Share app" card, and the final "Start assessment" CTA) currently stack at mixed widths (`md:max-w-xl`) directly under the full-width dashboard, which reads as misaligned and cramped.

Changes (presentation only):
- Group the closing sections into a consistent full-width container with even vertical rhythm.
- Place the institution lead form and the share/CTA block side by side in a 2-column grid on large screens (single column on mobile), wrapped in a soft bordered "Para autoridades y medios / Comparte" band so the transition from data to call-to-action feels intentional.
- Normalize spacing (consistent section gaps) and remove the inconsistent `md:max-w-xl` caps so everything aligns to the page grid.
- No changes to data, copy semantics, or the dashboard charts above.

## 3. Shared desktop footer (all pages)

Add a new `Footer` component rendered by `AppShell`, visible on desktop only (`hidden md:block`) so it never collides with the mobile bottom nav.

Contents:
- Brand lockup (shield icon + EvalúaYa) with the one-line tagline.
- Grouped links reusing existing routes/i18n: Explorar (Inicio, Mapa, Sala de datos), Participar (Voluntarios, Evaluar), Recursos (Metodología, Ayuda, Enviar comentarios).
- A bottom row with a short "datos anónimos / código abierto" note and the language toggle.
- Bilingual via existing `useLang` keys; add a small number of new `footer.*` keys (e.g. section headings and tagline) to `src/lib/i18n.tsx` in both ES and EN.

It mounts once in `AppShell` after `<main>` and before `<BottomNav>`, so every desktop page gets it automatically with no per-route edits.

## Technical notes

- `src/components/DataRoomFilters.tsx`: add optional `availableStates: string[]` and `availableMunicipios: Record<string, string[]>` props; filter the rendered `SelectItem`s against them; keep current behavior if props are absent.
- `src/routes/datos.tsx`:
  - add a `useEffect` (keyed on `filters.range`) that fetches range-scoped, unfiltered aggregates and computes the available states/municipios sets; pass them into `DataRoomFilters`.
  - auto-reset `state`/`municipality` in `filters` when the new options no longer include the current selection.
  - restructure the closing JSX (export / institution / share / CTA) into the aligned full-width layout described above.
- `src/components/Footer.tsx`: new desktop-only footer component.
- `src/components/AppShell.tsx`: render `<Footer />` (desktop only) below `<main>`.
- `src/lib/i18n.tsx`: add `footer.*` ES/EN keys.
- No database or server-function changes required (reuses existing aggregate fetches).
