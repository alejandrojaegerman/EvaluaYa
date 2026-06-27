# Replace Google Maps with Leaflet + OpenStreetMap (no API key)

## Why this fixes it

Google Maps fails on `evaluaya.app` because the only available key is the Lovable-managed one, restricted to `*.lovable.app`. Switching to **Leaflet** with **open raster tiles** removes API keys entirely — it renders on any domain (custom domain, preview, offline-cached) with zero credentials and no referrer restrictions. Leaflet is tiny (~40 KB), which also suits the app's low-bandwidth goal.

## Minimum-compromise approach

`DamageMap.tsx` keeps the **exact same props** (`bubbles`, `onSelectState`, `fallback`) and the same visual behavior, so `mapa.tsx`, `zona.$estado.tsx`, and any other caller stay untouched. Only the rendering engine inside the component changes.

Feature parity mapping:

```text
Google Maps  ->  Leaflet
-----------------------------------------------
google.maps.Map        ->  L.map
Circle (meters radius)  ->  L.circle (meters radius, same scaling)
InfoWindow             ->  L.popup (same HTML card)
fitBounds              ->  map.fitBounds(L.latLngBounds)
circle "click"         ->  circle.on("click") -> open popup
"View zone" button     ->  wired on popupopen event
```

Everything users see stays the same: colored bubbles sized by report count, the popup card with risk breakdown and "View zone →" link, auto-fit to Venezuela, zoom for municipality detail, and the existing color legend below the map.

## Tiles

Use **CARTO "Positron" light** basemap (`light_all`) — clean, muted styling that fits the teal brand and keeps the colored bubbles readable. It's keyless and free for low-traffic civic use. Attribution (OpenStreetMap + CARTO) is shown in the map corner as required. (If you'd prefer the standard OpenStreetMap look, that's a one-line swap.)

## Implementation steps

1. Add `leaflet` (and its TypeScript types) as a dependency.
2. Rewrite `DamageMap.tsx` to use Leaflet:
   - Dynamically import Leaflet inside the effect (`await import("leaflet")`) so server-side rendering doesn't crash on `window`.
   - Import Leaflet's CSS (safe at module top — CSS only).
   - Build the map, tile layer, circles, and popups; preserve the radius scaling, popup HTML, language reactivity, and `fitBounds` cap.
   - Keep the `loading` / `error` states and the `fallback` render path (now triggers only if tiles genuinely fail).
3. Remove the Google Maps script loader and the `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_*` reads from this component.
4. Verify in preview, then re-publish so `evaluaya.app` shows the working map.

## Notes

- No backend, data, or routing changes — purely the map rendering layer.
- The Google Maps connector can be disconnected later if nothing else uses it; leaving it connected does no harm.
- i18n keys (`map.mapUnavailable`, `map.mapLoading`, etc.) are reused as-is.
