import { createServerFn } from "@tanstack/react-start";

// ---------------------------------------------------------------------------
// Live earthquake feed for Venezuela.
//
// Pulls recent events from the public USGS FDSN event API (no key needed),
// filtered to a bounding box that covers Venezuela plus nearby border zones
// (Colombia, Trinidad, the southern Caribbean) so quakes felt across the
// country are captured. Results are normalized to a small, serializable DTO
// and cached in memory with a short TTL so the page stays fresh on "hoy"
// search intent without hammering USGS.
// ---------------------------------------------------------------------------

/** Venezuela + buffer for felt cross-border events. */
const BBOX = { minLat: -1, maxLat: 16, minLng: -76, maxLng: -58 };

/** Reference point (Caracas) for a human "distance from" hint. */
const CARACAS = { lat: 10.4806, lng: -66.9036 };

/** Only surface events at/above this magnitude (filters micro-noise). */
const MIN_MAGNITUDE = 2.5;

/** A quake this strong in the last 24h flips the headline answer to "yes". */
export const SIGNIFICANT_24H_MAG = 3.5;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type Quake = {
  id: string;
  mag: number | null;
  place: string;
  /** ISO timestamp of the event origin. */
  time: string;
  depthKm: number | null;
  lat: number;
  lng: number;
  /** Great-circle distance from Caracas, km (rounded). */
  distanceKm: number;
  /** Number of "felt it" reports submitted to USGS, if any. */
  felt: number | null;
  /** USGS event detail page. */
  url: string;
};

export type QuakeFeed = {
  /** ISO timestamp of when this data was assembled. */
  updatedAt: string;
  quakes: Quake[];
  count24h: number;
  count7d: number;
  count30d: number;
  /** Strongest magnitude seen in the last 24h, or null if none. */
  maxMag24h: number | null;
  /** True when a felt/significant quake happened in the last 24h. */
  significantToday: boolean;
  /** True when the USGS feed could not be reached (UI shows a fallback). */
  unavailable: boolean;
};

function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type UsgsFeature = {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number | null;
    felt: number | null;
    url: string | null;
  };
  geometry: { coordinates: [number, number, number] } | null;
};

let cache: { at: number; feed: QuakeFeed } | null = null;

function emptyFeed(unavailable: boolean): QuakeFeed {
  return {
    updatedAt: new Date().toISOString(),
    quakes: [],
    count24h: 0,
    count7d: 0,
    count30d: 0,
    maxMag24h: null,
    significantToday: false,
    unavailable,
  };
}

async function fetchFeed(): Promise<QuakeFeed> {
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    format: "geojson",
    starttime: start,
    minlatitude: String(BBOX.minLat),
    maxlatitude: String(BBOX.maxLat),
    minlongitude: String(BBOX.minLng),
    maxlongitude: String(BBOX.maxLng),
    minmagnitude: String(MIN_MAGNITUDE),
    orderby: "time",
    limit: "200",
  });
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`USGS ${res.status}`);
  const json = (await res.json()) as { features?: UsgsFeature[] };
  const features = json.features ?? [];

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const quakes: Quake[] = features
    .filter((f) => f.geometry && typeof f.properties.time === "number")
    .map((f) => {
      const [lng, lat, depth] = f.geometry!.coordinates;
      return {
        id: f.id,
        mag: f.properties.mag,
        place: f.properties.place ?? "—",
        time: new Date(f.properties.time as number).toISOString(),
        depthKm: typeof depth === "number" ? Math.round(depth) : null,
        lat,
        lng,
        distanceKm: Math.round(haversineKm(CARACAS.lat, CARACAS.lng, lat, lng)),
        felt: f.properties.felt ?? null,
        url: f.properties.url ?? "https://earthquake.usgs.gov/earthquakes/map/",
      };
    });

  const last24h = quakes.filter((q) => now - Date.parse(q.time) <= DAY);
  const last7d = quakes.filter((q) => now - Date.parse(q.time) <= 7 * DAY);
  const maxMag24h = last24h.reduce<number | null>(
    (max, q) => (q.mag != null && (max == null || q.mag > max) ? q.mag : max),
    null,
  );
  const significantToday = last24h.some(
    (q) => (q.mag != null && q.mag >= SIGNIFICANT_24H_MAG) || (q.felt ?? 0) > 0,
  );

  return {
    updatedAt: new Date().toISOString(),
    quakes,
    count24h: last24h.length,
    count7d: last7d.length,
    count30d: quakes.length,
    maxMag24h,
    significantToday,
    unavailable: false,
  };
}

/**
 * Public, read-only: recent earthquakes in/near Venezuela from USGS.
 * Cached for a few minutes. Never throws — returns an `unavailable` feed so the
 * page (and SSR/prerender) degrade gracefully when USGS is unreachable.
 */
export const getRecentVenezuelaQuakes = createServerFn({
  method: "GET",
}).handler(async (): Promise<QuakeFeed> => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.feed;
  }
  try {
    const feed = await fetchFeed();
    cache = { at: Date.now(), feed };
    return feed;
  } catch (err) {
    console.error("[getRecentVenezuelaQuakes] error", err);
    // Serve stale cache if we have it; otherwise an explicit fallback.
    if (cache) return cache.feed;
    return emptyFeed(true);
  }
});
