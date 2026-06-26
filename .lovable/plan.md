# Better navigation for EvalúaYa

As the app grew (community map, methodology, saved-report accounts, volunteer engineers), navigation stayed split between a thin top bar and ad-hoc inline links. This restructures it into a clear, thumb-friendly system without touching any assessment logic.

## What you'll get

A persistent **bottom tab bar** (PWA-style, thumb-reachable, always visible) with the 4 primary destinations, plus a **"Más" sheet** for secondary ones. The top header gets slimmed and made consistent.

```text
┌───────────────────────────────┐
│  🛡 EvalúaYa      ● En línea  ES│  ← slim header (brand, status, lang)
│                               │
│        page content           │
│                               │
├───────────────────────────────┤
│  🏠     🗺      📁      ⋯      │  ← bottom tab bar
│ Inicio  Mapa  Reportes  Más    │
└───────────────────────────────┘
```

### Bottom tab bar (primary)
Four slots, each with active-state highlight:
- **Inicio** → `/`
- **Mapa** → `/mapa`
- **Mis reportes** → `/mis-reportes` (the dedicated account slot you asked for)
- **Más** → opens the sheet (not a route)

### "Más" sheet (secondary)
Slide-up sheet listing everything that doesn't earn a permanent slot:
- **Voluntarios** → `/voluntarios` (currently has no global entry point — this surfaces it)
- **Metodología / Cómo funciona** → `/metodologia`
- **Idioma / Language** toggle (moved here so the header stays clean, also kept in header)
- Connection status reminder

### Header cleanup (polish)
- Keep brand wordmark, online/offline pill, and language toggle.
- Remove the Map and Methodology text links from the header (now handled by the tab bar / Más sheet) so the top bar isn't cramped on small screens.
- Keep the header responsive using grid + `min-w-0` + `shrink-0` so nothing clips on narrow phones.

### Small polish included
- Consistent **active states** on the tab bar (primary color + filled icon for the current route).
- Surface **Voluntarios** in the Más sheet (previously only reachable from result cards).
- Content padding adjusted so the bottom bar never overlaps page content (the shell already uses `pb-28`; verified against the new bar height).
- The home page's inline "Mis reportes" link stays, now reinforced by the permanent tab.

## Technical approach

- **`src/components/BottomNav.tsx`** (new): renders the 4-item tab bar with `@tanstack/react-router` `<Link>` using `activeProps`/`data-status` for highlight, and a `Sheet` (existing `src/components/ui/sheet.tsx`, `side="bottom"`) for "Más". Hidden via `print:hidden` so PDFs/share cards are unaffected.
- **`src/components/AppShell.tsx`**: render `<BottomNav />` after `<main>`; remove the Map/Methodology header links; keep online pill + `LanguageToggle`. Bottom padding stays adequate for the fixed bar.
- **`src/lib/i18n.tsx`**: add a few keys — `nav.home`, `nav.reports`, `nav.more`, `nav.volunteers`, `nav.language` (ES + EN). Reuse existing `nav.map`, `nav.methodology`.
- No route files, server functions, database, or assessment logic change. Pure presentation/navigation refactor.

## Out of scope
- No redesign of individual pages or color/theme changes.
- No changes to the assessment flow, AI analysis, PDF, or email systems.