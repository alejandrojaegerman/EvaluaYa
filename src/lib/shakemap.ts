// Pure, dependency-free helpers for ShakeMap ground-motion lookups.
// Safe to import on client or server — no Node or network access here.
//
// The stored grid carries several co-registered layers (same axes), letting us
// read multiple ground-motion metrics at a building's coordinate:
//   mmi   Modified Mercalli Intensity
//   pga   peak ground acceleration (g)
//   pgv   peak ground velocity (cm/s)
//   sa03/sa06/sa10/sa30  spectral acceleration (g) at 0.3/0.6/1.0/3.0 s
//   vs30  site shear-wave velocity (m/s) — soil stiffness / amplification

export type LayerKey =
  | "mmi"
  | "pga"
  | "pgv"
  | "sa03"
  | "sa06"
  | "sa10"
  | "sa30"
  | "vs30";

/**
 * Multi-layer regular lat/lng grid. Each layer is row-major, axis order
 * [y, x], length === nx * ny, index = iy * nx + ix.
 */
export type SeismicGrid = {
  x0: number; // start longitude
  x1: number; // stop longitude
  nx: number;
  y0: number; // start latitude
  y1: number; // stop latitude
  ny: number;
  layers: Partial<Record<LayerKey, (number | null)[]>>;
};

/** Legacy single-layer MMI grid (older stored events). */
export type MmiGrid = {
  x0: number;
  x1: number;
  nx: number;
  y0: number;
  y1: number;
  ny: number;
  values: (number | null)[];
};

export type SeismicIntensity = {
  /** interpolated MMI value, e.g. 7.4 */
  mmi: number;
  /** rounded Roman numeral, e.g. "VII" */
  roman: string;
};

/** NEHRP-style soil class derived from vs30 (m/s). */
export type SoilClass = "rock" | "stiff" | "soft" | "very_soft";

export type SpectralBand = "0.3" | "0.6" | "1.0" | "3.0";

/** Full ground-motion reading at a coordinate. */
export type SeismicReading = {
  mmi: number;
  roman: string;
  /** peak ground acceleration in g (null if layer missing) */
  pga: number | null;
  /** peak ground velocity in cm/s */
  pgv: number | null;
  /** spectral acceleration bands in g */
  sa: Partial<Record<SpectralBand, number>>;
  /** site vs30 in m/s */
  vs30: number | null;
  /** soil class from vs30 */
  soilClass: SoilClass | null;
};

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

/** Convert an MMI number to its rounded Roman numeral (clamped I–XII). */
export function mmiToRoman(mmi: number): string {
  const i = Math.min(12, Math.max(1, Math.round(mmi)));
  return ROMAN[i - 1];
}

/** Map vs30 (m/s) to a coarse NEHRP-style soil class. */
export function soilClassFromVs30(vs30: number | null | undefined): SoilClass | null {
  if (typeof vs30 !== "number" || !Number.isFinite(vs30)) return null;
  if (vs30 >= 760) return "rock";
  if (vs30 >= 360) return "stiff";
  if (vs30 >= 180) return "soft";
  return "very_soft";
}

/**
 * Rough fundamental period (seconds) of a building from its floor count.
 * Uses the common rapid estimate T ≈ 0.1 * N, clamped to a sane range.
 */
export function buildingPeriod(floors: number): number {
  const n = Number.isFinite(floors) ? floors : 1;
  return Math.min(4, Math.max(0.1, 0.1 * n));
}

/** Pick the spectral-acceleration band closest to a building's period. */
export function bandForPeriod(periodSec: number): SpectralBand {
  if (periodSec <= 0.45) return "0.3";
  if (periodSec <= 0.8) return "0.6";
  if (periodSec <= 2.0) return "1.0";
  return "3.0";
}

const BAND_TO_LAYER: Record<SpectralBand, LayerKey> = {
  "0.3": "sa03",
  "0.6": "sa06",
  "1.0": "sa10",
  "3.0": "sa30",
};

type Axes = Pick<SeismicGrid, "x0" | "x1" | "nx" | "y0" | "y1" | "ny">;

/**
 * Bilinearly interpolate a single value array at a coordinate. Returns null
 * when the point is outside coverage. Missing cells use the strongest
 * available neighbour (conservative at edges).
 */
function interpValues(
  ax: Axes,
  values: (number | null)[] | undefined,
  lat: number,
  lng: number,
): number | null {
  if (!values) return null;
  const { x0, x1, nx, y0, y1, ny } = ax;
  if (nx < 2 || ny < 2 || values.length !== nx * ny) return null;

  const minLng = Math.min(x0, x1);
  const maxLng = Math.max(x0, x1);
  const minLat = Math.min(y0, y1);
  const maxLat = Math.max(y0, y1);
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return null;

  const fx = ((lng - x0) / (x1 - x0)) * (nx - 1);
  const fy = ((lat - y0) / (y1 - y0)) * (ny - 1);
  const ix = Math.max(0, Math.min(nx - 2, Math.floor(fx)));
  const iy = Math.max(0, Math.min(ny - 2, Math.floor(fy)));
  const tx = Math.max(0, Math.min(1, fx - ix));
  const ty = Math.max(0, Math.min(1, fy - iy));

  const at = (yy: number, xx: number): number | null => {
    const val = values[yy * nx + xx];
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  };

  const v00 = at(iy, ix);
  const v01 = at(iy, ix + 1);
  const v10 = at(iy + 1, ix);
  const v11 = at(iy + 1, ix + 1);
  const present = [v00, v01, v10, v11].filter((n): n is number => n != null);
  if (present.length === 0) return null;
  if (present.length < 4) return Math.max(...present);

  const a = v00! + (v01! - v00!) * tx;
  const b = v10! + (v11! - v10!) * tx;
  return a + (b - a) * ty;
}

/** Normalize either grid shape to a layer accessor. */
function getLayer(
  grid: SeismicGrid | MmiGrid,
  key: LayerKey,
): (number | null)[] | undefined {
  if ("layers" in grid) return grid.layers[key];
  // Legacy MMI-only grid exposes its single layer as `values`.
  if (key === "mmi") return (grid as MmiGrid).values;
  return undefined;
}

/**
 * Interpolate the MMI value at a coordinate. Kept for backward compatibility
 * with both the legacy MMI-only grid and the multi-layer grid.
 */
export function intensityAt(
  grid: SeismicGrid | MmiGrid,
  lat: number,
  lng: number,
): SeismicIntensity | null {
  const mmi = interpValues(grid, getLayer(grid, "mmi"), lat, lng);
  if (mmi == null) return null;
  return { mmi: Math.round(mmi * 10) / 10, roman: mmiToRoman(mmi) };
}

const round = (n: number | null, d: number): number | null =>
  n == null ? null : Math.round(n * 10 ** d) / 10 ** d;

/**
 * Read every available ground-motion metric at a coordinate. Returns null when
 * the point has no MMI coverage (i.e. outside the event footprint).
 */
export function seismicAt(
  grid: SeismicGrid | MmiGrid,
  lat: number,
  lng: number,
): SeismicReading | null {
  const mmiRaw = interpValues(grid, getLayer(grid, "mmi"), lat, lng);
  if (mmiRaw == null) return null;

  const sa: Partial<Record<SpectralBand, number>> = {};
  const sa03 = interpValues(grid, getLayer(grid, "sa03"), lat, lng);
  const sa06 = interpValues(grid, getLayer(grid, "sa06"), lat, lng);
  const sa10 = interpValues(grid, getLayer(grid, "sa10"), lat, lng);
  const sa30 = interpValues(grid, getLayer(grid, "sa30"), lat, lng);
  if (sa03 != null) sa["0.3"] = round(sa03, 3)!;
  if (sa06 != null) sa["0.6"] = round(sa06, 3)!;
  if (sa10 != null) sa["1.0"] = round(sa10, 3)!;
  if (sa30 != null) sa["3.0"] = round(sa30, 3)!;

  const vs30 = interpValues(grid, getLayer(grid, "vs30"), lat, lng);

  return {
    mmi: Math.round(mmiRaw * 10) / 10,
    roman: mmiToRoman(mmiRaw),
    pga: round(interpValues(grid, getLayer(grid, "pga"), lat, lng), 3),
    pgv: round(interpValues(grid, getLayer(grid, "pgv"), lat, lng), 1),
    sa,
    vs30: vs30 == null ? null : Math.round(vs30),
    soilClass: soilClassFromVs30(vs30),
  };
}

/** Spectral demand (g) at the building's estimated fundamental period. */
export function spectralDemand(
  reading: Pick<SeismicReading, "sa">,
  floors: number,
): { band: SpectralBand; period: number; value: number } | null {
  const period = buildingPeriod(floors);
  const band = bandForPeriod(period);
  const value = reading.sa[band];
  if (typeof value !== "number") return null;
  return { band, period: Math.round(period * 100) / 100, value };
}

export { BAND_TO_LAYER };
