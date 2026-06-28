// Severity-weighted impact ranking for location pickers. Pure functions — no
// network or DB access — so they can be unit-tested and reused on client and
// server. The goal: surface the hardest-hit states and municipios first while
// keeping the full, inclusive list available.

export type AreaCounts = {
  green: number;
  yellow: number;
  orange: number;
  red: number;
  total: number;
};

export type AreaRow = AreaCounts & {
  state: string | null | undefined;
  municipality?: string | null | undefined;
};

/** Caps for how many areas get the "most-affected" highlight treatment. */
export const FEATURED_STATE_CAP = 6;
export const FEATURED_MUNICIPIO_CAP = 5;

/**
 * Severity-weighted score. Red/Orange dominate so danger hotspots rise even
 * with few total reports; a small `total` term breaks ties toward busier areas.
 */
export function scoreArea(c: AreaCounts): number {
  return c.red * 4 + c.orange * 2 + c.yellow * 1 + c.total * 0.25;
}

function isUnspecified(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.trim().toLowerCase() === "desconocido";
}

function emptyCounts(): AreaCounts {
  return { green: 0, yellow: 0, orange: 0, red: 0, total: 0 };
}

function addCounts(acc: AreaCounts, row: AreaCounts): void {
  acc.green += row.green ?? 0;
  acc.yellow += row.yellow ?? 0;
  acc.orange += row.orange ?? 0;
  acc.red += row.red ?? 0;
  acc.total += row.total ?? 0;
}

/**
 * Returns state names ordered by impact (most affected first), filtered to a
 * set of valid option names, capped, and only including areas with score > 0.
 */
export function rankStates(
  rows: AreaRow[],
  validNames: Iterable<string>,
  cap = FEATURED_STATE_CAP,
): string[] {
  const valid = new Set(validNames);
  const byState = new Map<string, AreaCounts>();
  for (const r of rows) {
    if (isUnspecified(r.state)) continue;
    const name = r.state!.trim();
    if (!valid.has(name)) continue;
    const cur = byState.get(name) ?? emptyCounts();
    addCounts(cur, r);
    byState.set(name, cur);
  }
  return [...byState.entries()]
    .map(([name, c]) => ({ name, score: scoreArea(c) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
    .map((x) => x.name);
}

/**
 * Returns, per state, the municipio names ordered by impact (most affected
 * first), filtered to that state's valid options, capped, score > 0 only.
 * `optionsFor` maps a state name to its allowed municipio picker options.
 */
export function rankMunicipios(
  rows: AreaRow[],
  optionsFor: (state: string) => string[],
  cap = FEATURED_MUNICIPIO_CAP,
): Record<string, string[]> {
  // group counts by state -> municipality
  const byState = new Map<string, Map<string, AreaCounts>>();
  for (const r of rows) {
    if (isUnspecified(r.state) || isUnspecified(r.municipality)) continue;
    const state = r.state!.trim();
    const muni = r.municipality!.trim();
    const muniMap = byState.get(state) ?? new Map<string, AreaCounts>();
    const cur = muniMap.get(muni) ?? emptyCounts();
    addCounts(cur, r);
    muniMap.set(muni, cur);
    byState.set(state, muniMap);
  }

  const out: Record<string, string[]> = {};
  for (const [state, muniMap] of byState.entries()) {
    const allowed = new Set(optionsFor(state));
    const featured = [...muniMap.entries()]
      .filter(([name]) => allowed.has(name))
      .map(([name, c]) => ({ name, score: scoreArea(c) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, cap)
      .map((x) => x.name);
    if (featured.length > 0) out[state] = featured;
  }
  return out;
}

export type GroupedOptions = { featured: string[]; rest: string[] };

/**
 * Split a full option list into a featured group (in impact order) and the
 * remaining options (alphabetical). Featured entries that aren't valid options
 * are dropped. When there are no featured entries, everything stays in `rest`.
 */
export function splitFeatured(
  allOptions: string[],
  featured: string[] | undefined,
): GroupedOptions {
  const optionSet = new Set(allOptions);
  const seen = new Set<string>();
  const feat: string[] = [];
  for (const name of featured ?? []) {
    if (optionSet.has(name) && !seen.has(name)) {
      feat.push(name);
      seen.add(name);
    }
  }
  const rest = allOptions
    .filter((o) => !seen.has(o))
    .sort((a, b) => a.localeCompare(b));
  return { featured: feat, rest };
}
