# Tidy desktop top nav + footer

Two presentation-only fixes. No backend, data, or logic changes.

## 1. Top nav — every item on one line

Currently two labels wrap to two lines on desktop because flex items shrink and the labels are long:
- `¿Tembló hoy?` → wraps
- `Ingenieros voluntarios` → wraps

Fix in `src/components/TopNav.tsx` only (mobile/bottom nav and footer keep their full labels):

- Add `whitespace-nowrap` to the shared `linkClass` so no nav item ever breaks across lines.
- Use shorter desktop-only labels for the two long items so the row stays compact and balanced:
  - `¿Tembló hoy?` → `¿Tembló hoy?` kept as-is but forced to one line (single line, no wrap).
  - `Ingenieros voluntarios` → `Voluntarios` (EN: `Volunteers`).
- Tighten inter-item spacing slightly (`gap-0.5`) so all items + status + language toggle fit comfortably at common desktop widths.

Implementation detail: add two new i18n keys (`nav.volunteersShort` ES `Voluntarios` / EN `Volunteers`) used exclusively by the desktop top nav. All other surfaces keep `nav.volunteers` ("Ingenieros voluntarios" / "Volunteer engineers").

## 2. Footer — tidy alignment

In `src/components/Footer.tsx`:

- The `PARTICIPAR` column has a descriptive note ("Reclutamos, validamos y conectamos ingenieros.") that pushes its links down, so link rows no longer align across the four columns. Move that note out of the column grid: drop it into the brand block (under the tagline) or remove it, so all four link columns start their lists at the same baseline.
- Let long link labels stay on one line where they fit; allow natural wrap only when unavoidable, with consistent `space-y` so wrapped items don't look ragged.
- Keep the existing columns, headings, brand block, and bottom row (note + language toggle) — just align the link lists to a shared top edge for a clean grid.

```text
EXPLORAR        PARTICIPAR      RECURSOS        LEGAL
Inicio          Voluntarios     Metodología     Privacidad
¿Tembló hoy?    Evaluar         Ayuda           Contacto
Mapa                            Comentarios
Datos
```

## Verification

- Run a Playwright check at desktop widths (e.g. 1069px and 1280px) to confirm no top-nav item wraps and the footer columns align, capturing a screenshot for each.

## Technical notes

- Files touched: `src/components/TopNav.tsx`, `src/components/Footer.tsx`, and `src/lib/i18n.tsx` (one new short label key per language).
- Pure frontend/presentation; no routes, schema, or server functions affected.
