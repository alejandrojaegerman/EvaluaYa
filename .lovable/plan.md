# Fix "Desconocido" on /mapa + a real visual map

## Goal
Stop new reports from being filed without a location, and make `/mapa` actually look like a map of Venezuela.

## 1. Capture estado reliably (step 1 — `assess/property`)
- **Make estado required.** The "Continuar" button stays disabled until a state is selected (alongside the existing building-type and age requirements). Municipio stays optional.
- **Auto-detect on load.** When the user opens step 1 with no state chosen, request browser geolocation (one-tap permission). On allow, snap the coordinates to the nearest estado centroid (pure math against the existing `ESTADOS` list — no external API, works on low bandwidth) and pre-select it. The user can still change it.
- Add a small inline state: "Detectando ubicación…", and a quiet fallback message if permission is denied or unavailable ("Selecciona tu estado"). Never block on geolocation; it only pre-fills.
- Update the required-field hint copy so it's clear the state matters for the community map; keep the privacy note that exact addresses are never shared.

## 2. Upgrade the bubble map (`/mapa`)
Keep the lightweight, dependency-free SVG approach (no map tiles), but make it read as a real map:
- Add a faint **Venezuela country outline** drawn as a single bundled SVG path, projected with the existing `projectToSvg` bounds so the bubbles sit correctly inside it.
- Keep the small reference dots for all 24 estados, and add **short state labels** (the `abbr`) next to estados that have reports, so users can orient themselves.
- Bubble size = report volume, color = dominant risk (unchanged). Add a tiny legend (size = volume, colors = risk levels).
- The map section currently hides entirely when there are zero geolocated reports. Once estado is required, real bubbles will appear; we also keep the country outline visible even before bubbles exist so the panel never looks empty.

## 3. Existing "Desconocido" reports
- Left as-is per your choice. They keep counting in the headline totals and the area list, but they don't plot on the map (no matching estado). Only new reports get proper states.

## Technical notes
- `src/routes/assess/property.tsx`: add `valid = ... && state !== ""`, a geolocation `useEffect` (guarded so it only runs client-side and only when no state is set), and a `nearestEstado(lat, lng)` helper.
- `src/lib/venezuela.ts`: add a `nearestEstado()` haversine/nearest-centroid helper and a simplified `VE_OUTLINE` SVG path string (coarse polygon, a few dozen points — tiny payload).
- `src/routes/mapa.tsx`: render the outline `<path>`, add `abbr` `<text>` labels for estados with data, and a small legend block.
- `src/lib/i18n.tsx`: add ES/EN keys for the detect/permission states, the legend, and the updated location hint.
- No database or server-function changes needed — `state`/`municipality` columns and the aggregate RPCs already exist.
