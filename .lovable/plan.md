## Goal
Replace the hand-drawn SVG bubble map on `/mapa` with a real, zoomable Google Map, and drop to **municipality-level** bubbles (sized by report count, colored by dominant risk) wherever we can resolve a municipality's location — rolling unknowns up to their state.

## Important caveat (please read)
- The app is published on the custom domain **evaluaya.app**. Lovable's **managed** Google Maps key is referrer-locked to `*.lovable.app` / `*.lovableproject.com`, so the map will load in the Lovable preview but will show a blank/error tile on evaluaya.app until you add your **own** Google Cloud API key (Maps JavaScript API enabled, billing on, referrer allowlist including `https://evaluaya.app/*` and `https://*.evaluaya.app/*`).
- To keep the page working everywhere — and to preserve the original low-bandwidth/offline behavior — the existing SVG bubble map stays in the codebase as an automatic **fallback** whenever Google Maps can't load (no key, blocked referrer, offline, or low-data preference).

## What gets built

### 1. Curated municipality centroids (`src/lib/venezuela.ts`)
- Add a `MUNICIPIOS` lookup of `{ state, name, lat, lng }` for the most-reported municipalities, prioritizing the Caracas metro cluster (Libertador, Sucre/Petare, Chacao, Baruta, El Hatillo, plus Maracaibo, Valencia, Barquisimeto/Iribarren, Caroní/Ciudad Guayana, Maracay/Girardot, etc.).
- Add `normalizeMunicipio()` + an alias map to absorb the messy free-text in the data (e.g. `petarr`→Petare, `Libertados`→Libertador, `baruta`/`Baruta`, case/accents). 
- Add `resolveMunicipio(state, municipality)` → returns the municipality centroid when known, otherwise the state centroid (so every aggregate still lands somewhere sensible).

### 2. New map component (`src/components/DamageMap.tsx`)
- Loads the Maps JS API asynchronously (`loading=async` + global `callback`, browser key, `channel` tracking id) exactly per the connector rules; loads it once across mounts.
- Renders one `google.maps.Circle` (or scaled `Marker`) per resolved location, radius ∝ report count, fill color from `RISK_HEX` dominant risk — same color language as today.
- Click a bubble → info window with the area name + Verde/Amarillo/Rojo counts and a "Ver zona" link to `/zona/$estado`; municipality-resolved bubbles label the municipality.
- Native pinch/scroll/double-tap zoom and pan; centered on Venezuela, fit to the data bounds.
- No `mapId`, uses `google.maps.Marker`/`Circle` (not AdvancedMarker), per connector constraints.

### 3. Wire into `/mapa` (`src/routes/mapa.tsx`)
- Build municipality-level bubble data from the existing `getDamageAggregates()` (already returns state + municipality + counts) — no DB/RPC change needed.
- Swap the current `<svg>` "Vista geográfica" block for `<DamageMap>`; if the Maps API isn't available, render the current SVG bubble map instead (extracted into a small `<StaticBubbleMap>` so both paths share code).
- Keep the headline counters, risk gauge, legend, and "Zonas con más reportes" list unchanged.

### 4. Connector + i18n
- Connect the managed **Google Maps** connector (provides the browser key + tracking id env vars).
- Add ES/EN strings for any new labels (loading, "ver zona", municipality fallback note) to `src/lib/i18n.tsx`.

## Out of scope
- No change to how/what location data is stored (still coarse state/municipality; no per-user coordinates plotted).
- No geocoding service calls — municipality positions come only from the curated static list.

## Technical notes
- Browser key: `import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`; channel: `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`. Both injected by the connector; map renders only when present, else fallback SVG.
- Verify with Playwright in the sandbox (preview origin is `*.lovable.app`, so the managed key works there) that bubbles render, zoom/pan works, and clicking opens the zona link.
