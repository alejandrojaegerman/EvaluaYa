## Problem

In `/mapa` the "Zonas con más reportes" list shows many cards titled **"Desconocido"**. This happens because the aggregated data stores `municipality = "Desconocido"` (or empty) for reports whose municipality couldn't be inferred. The current list uses `a.municipality || a.state` as the title, so any unknown-municipality row literally reads "Desconocido", and several of them stack up — looking broken.

This is a presentation-only fix in `src/routes/mapa.tsx` plus a few i18n strings. No backend or data changes.

## Changes

### 1. Treat "Desconocido"/empty as "unspecified" in the UI
Add a small helper that recognizes `"Desconocido"`, `"desconocido"`, `""`, and `null` as an *unspecified* value, instead of printing it as a place name.

### 2. Relabel each area card by what's actually known
Replace the current title/subtitle logic so no card ever says "Desconocido":

```text
municipality known          → Title: <municipality>      Sub: <state> · N reportes
municipality unknown,        → Title: <state>             Sub: Municipio sin especificar · N reportes
state known
both unknown                 → Title: Ubicación sin especificar   Sub: N reportes
```

The map-pin icon and risk dot stay the same.

### 3. Group all fully-unknown rows into one card
Rows where **both** state and municipality are unspecified are merged into a single aggregated "Ubicación sin especificar" card (summing total/green/yellow/red), so they never repeat. Rows with a known state but unknown municipality stay one-per-state (already aggregated that way) and are clearly labeled "Municipio sin especificar" — these are legitimately distinct states.

### 4. Ordering
Keep sorting by total reports, but break ties so cards with a specific municipality rank above unspecified ones, and the merged "Ubicación sin especificar" card sinks toward the bottom. Still capped at the existing top 12.

### 5. i18n
Add Spanish + English keys in `src/lib/i18n.tsx`:
- `map.unspecifiedMunicipality` → "Municipio sin especificar" / "Municipality not specified"
- `map.unspecifiedLocation` → "Ubicación sin especificar" / "Location not specified"

## Out of scope
- No changes to the CSV export, the bubble map, or the database aggregates (the raw open data keeps its real values; this only cleans up the list view).
- No re-running of geo backfill.

## Technical notes
- All edits are inside the `topAreas` memo and the list-rendering JSX in `src/routes/mapa.tsx`, plus the two new i18n entries.
- The dominant-risk dot and per-level counts (`a.red`/`a.yellow`/`a.green`) continue to work since the merged card sums those fields.
