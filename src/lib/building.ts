/**
 * Building / house name extraction from free-text Venezuelan addresses.
 *
 * Many residents type their address with the building or house name embedded,
 * e.g. "Av. La Guairita, Santa Paula, Edificio Uracoa" or
 * "Esquina de Ferrenquín, Res. Doral Plaza". When two evaluations share the
 * same building (within the same estado + municipio) we can surface that
 * relationship in the resident result and admin views.
 *
 * This module is a pure, offline, deterministic parser. It runs at assessment
 * time for every new record. An AI fallback (see scripts/backfill-buildings.ts)
 * is only used to clean up existing rows the parser cannot resolve.
 */

export type ExtractedBuilding = {
  /** Human-friendly display name, e.g. "Edificio Uracoa". */
  name: string;
  /** Normalized key for grouping, e.g. "uracoa". */
  key: string;
};

/**
 * Normalize a name into a grouping key: strip accents, lowercase, drop the
 * marker word and punctuation, collapse whitespace. Mirrors the normalization
 * used in venezuela.ts so the whole app groups consistently.
 */
export function buildingKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // remove the leading marker word(s) so "Edificio Uracoa" and "Ed. Uracoa"
    // collapse to the same key
    .replace(
      /^(edificio|edif|ed|residencias?|resd?|res|conjunto residencial|cjto residencial|cjto|c\.?\s*r\.?|torre|quinta|qta|bloque|blq|urbanizacion|urb)\b\.?\s*/,
      "",
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Marker = { re: RegExp; label: string };

/**
 * Ordered list of building markers. Each regex captures the building name in
 * group 1. We stop the name at the next comma, period followed by space, or a
 * new clearly-different segment.
 */
const MARKERS: Marker[] = [
  // Conjunto Residencial / C.R.
  // Conjunto Residencial / C.R.  (allow "C.R." with no trailing space)
  { re: /\b(?:conjunto\s+residencial|cjto\.?\s*residencial|c\.?\s*r\.?)[\s.]+([^,.;]+)/i, label: "Conjunto Residencial" },
  // Residencias / Res.  (allow "Res.Doral" with no space after the period)
  { re: /\b(?:residencias?|resd?|res)[\s.]+([^,.;]+)/i, label: "Residencias" },
  // Edificio / Edif. / Ed.
  { re: /\b(?:edificio|edif|ed)[\s.]+([^,.;]+)/i, label: "Edificio" },
  // Torre
  { re: /\btorre[\s.]+([^,.;]+)/i, label: "Torre" },
  // Quinta / Qta.
  { re: /\b(?:quinta|qta)[\s.]+([^,.;]+)/i, label: "Quinta" },
  // Bloque
  { re: /\b(?:bloque|blq)[\s.]+([^,.;]+)/i, label: "Bloque" },
];

/** Words that, if they're all that's captured, mean we found no real name. */
const STOP_WORDS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "del",
  "y",
  "san",
  "santa",
  "n",
  "no",
  "nro",
  "numero",
]);

function cleanName(raw: string): string {
  // Take up to the first few words — building names are short. Trim trailing
  // connectors and noise.
  const trimmed = raw
    .replace(/\s+/g, " ")
    .trim()
    // cut at obvious next-segment connectors
    .replace(/\b(piso|apto|apartamento|casa|local|ave?\.?|avenida|calle|sector|frente|cerca|al lado)\b.*$/i, "")
    .trim();
  // Keep at most 4 words to avoid swallowing the rest of the address.
  const words = trimmed.split(" ").slice(0, 4);
  // Drop trailing stop words.
  while (words.length && STOP_WORDS.has(words[words.length - 1].toLowerCase().replace(/[^a-z0-9]/gi, ""))) {
    words.pop();
  }
  return words.join(" ").trim();
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Extract a building/house name from a free-text address. Returns null when no
 * recognizable named structure is present (e.g. just a neighborhood).
 */
export function extractBuilding(address: string | null | undefined): ExtractedBuilding | null {
  if (!address || !address.trim()) return null;
  const text = address.trim();

  for (const marker of MARKERS) {
    const m = marker.re.exec(text);
    if (!m || !m[1]) continue;
    const namePart = cleanName(m[1]);
    if (!namePart) continue;
    const key = buildingKey(`${marker.label} ${namePart}`);
    // Reject keys that are empty or only stop words / single letters.
    if (key.length < 3) continue;
    const tokens = key.split(" ").filter((t) => !STOP_WORDS.has(t));
    if (tokens.length === 0) continue;
    const name = `${marker.label} ${titleCase(namePart)}`.trim();
    return { name, key };
  }

  return null;
}
