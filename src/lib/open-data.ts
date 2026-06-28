// Shared constants + machine-readable methodology for the public open-data API.
// Pure module (no server-only imports) so it is safe in routes and components.

import { CHECKLIST_ITEMS, type RiskLevel } from "./assessment-types";
import { CHECKLIST_GLOSSARY } from "./glossary";
import { translate } from "./i18n";
import { SITE_URL } from "./site";

/** Dataset license — separate from the MIT code license. */
export const DATA_LICENSE = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
  attribution: "Datos de EvalúaYa (evaluaya.app), CC BY 4.0",
} as const;

/** Base URL for the versioned public API. */
export const API_BASE = `${SITE_URL}/api/public/v1`;

/** Standard JSON envelope wrapping every open-data response. */
export function envelope<T>(
  source: string,
  data: T,
): {
  license: typeof DATA_LICENSE;
  attribution: string;
  source: string;
  generated_at: string;
  data: T;
} {
  return {
    license: DATA_LICENSE,
    attribution: DATA_LICENSE.attribution,
    source,
    generated_at: new Date().toISOString(),
    data,
  };
}

/** CORS + cache headers for the public, read-only API. */
export function jsonHeaders(maxAgeSeconds: number): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`,
  };
}

/** Helper: build a JSON Response with the shared headers. */
export function jsonResponse(
  body: unknown,
  maxAgeSeconds = 600,
  status = 200,
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: jsonHeaders(maxAgeSeconds),
  });
}

/** Preflight response for the API routes. */
export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: jsonHeaders(86400) });
}

// --- Methodology (machine-readable risk taxonomy + safety rules + glossary) ---

const RISK_LEVELS: RiskLevel[] = ["green", "yellow", "orange", "red"];

const RISK_MEANING: Record<RiskLevel, { es: string; en: string }> = {
  green: {
    es: "Sin daño estructural nuevo significativo. Aparenta ser seguro de habitar.",
    en: "No significant new structural damage. Appears safe to occupy.",
  },
  yellow: {
    es: "Daño leve o cosmético. Habitable; monitorear y atender lo señalado.",
    en: "Light or cosmetic damage. Habitable; monitor and address noted items.",
  },
  orange: {
    es: "Daño estructural serio sin colapso inminente. Requiere inspección de un ingeniero pronto; limitar el uso.",
    en: "Serious structural damage without imminent collapse. Needs an engineer soon; limit use.",
  },
  red: {
    es: "Daño grave o señales de posible colapso. Inseguro; evacuar de inmediato.",
    en: "Severe damage or signs of possible collapse. Unsafe; evacuate immediately.",
  },
};

type RuleFloor = "red" | "orange" | "yellow" | "red_or_orange";

const SAFETY_RULE_KEYS: Array<{ key: string; floor: RuleFloor }> = [
  { key: "liquefaction", floor: "red" },
  { key: "pounding", floor: "red" },
  { key: "plumbing", floor: "red" },
  { key: "combo_shaking", floor: "red" },
  { key: "urm", floor: "red_or_orange" },
  { key: "intensity_severe", floor: "orange" },
  { key: "spectral", floor: "orange" },
  { key: "softsoil_severe", floor: "orange" },
  { key: "intensity", floor: "yellow" },
  { key: "softsoil", floor: "yellow" },
  { key: "floors", floor: "yellow" },
  { key: "structure", floor: "yellow" },
];

/** Build the full machine-readable methodology object (bilingual labels). */
export function buildMethodology() {
  return {
    risk_taxonomy: RISK_LEVELS.map((level) => ({
      level,
      tag: { es: translate("es", `result.${level}.tag`), en: translate("en", `result.${level}.tag`) },
      action: {
        es: translate("es", `result.${level}.action`),
        en: translate("en", `result.${level}.action`),
      },
      meaning: RISK_MEANING[level],
    })),
    safety_rules: SAFETY_RULE_KEYS.map(({ key, floor }) => ({
      key,
      floor,
      finding: {
        es: translate("es", `rule.${key}.finding`),
        en: translate("en", `rule.${key}.finding`),
      },
      next_step: {
        es: translate("es", `rule.${key}.step`),
        en: translate("en", `rule.${key}.step`),
      },
    })),
    checklist: CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      section: item.section,
      optional: Boolean(item.optional),
      area: { es: translate("es", `item.${item.id}.area`), en: translate("en", `item.${item.id}.area`) },
      question: { es: translate("es", `item.${item.id}.q`), en: translate("en", `item.${item.id}.q`) },
    })),
    glossary: Array.from(
      new Set(Object.values(CHECKLIST_GLOSSARY).flat().filter(Boolean) as string[]),
    ).map((term) => ({
      term,
      label: {
        es: translate("es", `glossary.${term}.term`),
        en: translate("en", `glossary.${term}.term`),
      },
      definition: {
        es: translate("es", `glossary.${term}.def`),
        en: translate("en", `glossary.${term}.def`),
      },
    })),
    notes: {
      es: "Orientación preliminar. No sustituye a un ingeniero estructural autorizado ni a Protección Civil. Las reglas de seguridad determinísticas pueden elevar el nivel calculado por la IA.",
      en: "Preliminary guidance. Not a substitute for a licensed structural engineer or Civil Protection. Deterministic safety rules can raise the level computed by the AI.",
    },
  };
}
