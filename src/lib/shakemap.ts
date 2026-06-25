// Pure, dependency-free helpers for ShakeMap MMI (Modified Mercalli Intensity)
// lookups. Safe to import on client or server — no Node or network access here.

/** Regular lat/lng grid of MMI values (row-major, axis order [y, x]). */
export type MmiGrid = {
  x0: number; // start longitude
  x1: number; // stop longitude
  nx: number;
  y0: number; // start latitude
  y1: number; // stop latitude
  ny: number;
  /** length === nx * ny, row-major: index = iy * nx + ix */
  values: (number | null)[];
};

export type SeismicIntensity = {
  /** interpolated MMI value, e.g. 7.4 */
  mmi: number;
  /** rounded Roman numeral, e.g. "VII" */
  roman: string;
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

/**
 * Bilinearly interpolate the MMI value at a coordinate. Returns null when the
 * point falls outside the grid coverage. Missing cells are handled
 * conservatively (uses the max of available neighbours).
 */
export function intensityAt(
  grid: MmiGrid,
  lat: number,
  lng: number,
): SeismicIntensity | null {
  const { x0, x1, nx, y0, y1, ny, values } = grid;
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
  const present = [v00, v01, v10, v11].filter(
    (n): n is number => n != null,
  );
  if (present.length === 0) return null;

  let mmi: number;
  if (present.length < 4) {
    // Edge of coverage — be conservative, take the strongest neighbour.
    mmi = Math.max(...present);
  } else {
    const a = v00! + (v01! - v00!) * tx;
    const b = v10! + (v11! - v10!) * tx;
    mmi = a + (b - a) * ty;
  }

  return { mmi: Math.round(mmi * 10) / 10, roman: mmiToRoman(mmi) };
}
