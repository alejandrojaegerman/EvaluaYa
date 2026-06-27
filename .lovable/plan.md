# Fix "map.urgent" still showing

## What's actually going on

The raw `map.urgent` label is **already fixed in the code**:
- `src/lib/i18n.tsx` defines `"map.urgent": "Riesgo serio"` (ES) and `"Serious risk"` (EN).
- `src/components/RiskGauge.tsx` renders `t("map.urgent")`, which resolves correctly.

The reason you still see it:
1. The **published app at evaluaya.app is many versions behind** — it still shows the old 3-level risk scale (no orange tier at all). The `map.urgent` fix, the orange tier, and other recent work were never published.
2. Your **preview/phone is serving a cached bundle** from an older build (orange tier present, i18n fix missing), so it shows the raw key.

This is a deploy + cache problem, not a code bug.

## Plan

1. **Republish the app** so evaluaya.app serves the current code — this pushes the `map.urgent` fix and brings production in line with the 4-level scale (Green / Yellow / Orange / Red) and all other recent features.

2. **Verify the live render** after publishing: load `evaluaya.app/mapa` and confirm the gauge legend reads "Riesgo serio" (ES) / "Serious risk" (EN) — not `map.urgent` — and that all four tiers appear.

3. **Bust stale PWA cache for returning visitors.** The service worker uses `autoUpdate` with `NetworkFirst` for pages, so HTML refreshes, but cached older asset bundles can linger on installed PWAs. To make the update reliable, add a lightweight "new version available — tap to refresh" prompt (or a one-time forced `skipWaiting` + reload on activation) so users like the volunteer who reported this get the new bundle without manually clearing cache.

4. **On your device right now:** use the preview refresh button (or pull-to-refresh / reinstall the PWA) to drop the cached bundle and load the current build.

## Technical notes

- No dictionary or component changes are needed for `map.urgent`; the keys and lookup (`translate`, `i18n.tsx` line ~1683) are correct.
- Step 3 touches `src/lib/pwa.ts` / `vite.config.ts` PWA config only — a small update-flow enhancement, no business logic.
- Recommend a quick parity re-scan of `t("...")` calls vs the dictionary before publishing, to confirm no other raw keys ship to production.
