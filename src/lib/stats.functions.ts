import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AreaAggregate = {
  state: string;
  municipality: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  /** number of professional (engineer-verified) reports in this area */
  verified: number;
  lastReport: string | null;
};

export type DamageTotals = {
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  verified: number;
  areas: number;
};

const EMPTY_TOTALS: DamageTotals = {
  total: 0,
  green: 0,
  yellow: 0,
  orange: 0,
  red: 0,
  verified: 0,
  areas: 0,
};

/**
 * Public, read-only aggregated damage data grouped by estado / municipio.
 * Returns ONLY anonymized counts — never addresses, photos or report ids.
 * Brokered through the service role so the locked base table stays private.
 */
export const getDamageAggregates = createServerFn({ method: "GET" }).handler(
  async (): Promise<AreaAggregate[]> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data, error } = await supabaseAdmin.rpc("get_damage_aggregates");
      if (error || !data) {
        if (error) console.error("[stats] getDamageAggregates", error);
        return [];
      }
      return data.map((r) => ({
        state: r.state,
        municipality: r.municipality,
        total: r.total ?? 0,
        green: r.green ?? 0,
        yellow: r.yellow ?? 0,
        orange: r.orange ?? 0,
        red: r.red ?? 0,
        verified: r.verified ?? 0,
        lastReport: r.last_report ?? null,
      }));
    } catch (e) {
      console.error("[stats] getDamageAggregates failed", e);
      return [];
    }
  },
);

export type StateStats = {
  state: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  verified: number;
  municipios: number;
  lastReport: string | null;
};

/**
 * Anonymized aggregated stats for a single estado, derived from the same
 * public RPC that powers the map. Counts only — never addresses, photos or ids.
 */
export const getStateStats = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ state: z.string().trim().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<StateStats> => {
    const empty: StateStats = {
      state: data.state,
      total: 0,
      green: 0,
      yellow: 0,
      orange: 0,
      red: 0,
      verified: 0,
      municipios: 0,
      lastReport: null,
    };
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: rows, error } =
        await supabaseAdmin.rpc("get_damage_aggregates");
      if (error || !rows) {
        if (error) console.error("[stats] getStateStats", error);
        return empty;
      }
      const wanted = data.state.trim().toLowerCase();
      const matched = rows.filter(
        (r) => (r.state ?? "").trim().toLowerCase() === wanted,
      );
      const municipios = new Set<string>();
      let lastReport: string | null = null;
      const agg = matched.reduce(
        (acc, r) => {
          acc.total += r.total ?? 0;
          acc.green += r.green ?? 0;
          acc.yellow += r.yellow ?? 0;
          acc.orange += r.orange ?? 0;
          acc.red += r.red ?? 0;
          acc.verified += r.verified ?? 0;
          const muni = (r.municipality ?? "").trim();
          if (muni && muni.toLowerCase() !== "desconocido") municipios.add(muni);
          if (r.last_report && (!lastReport || r.last_report > lastReport)) {
            lastReport = r.last_report;
          }
          return acc;
        },
        { total: 0, green: 0, yellow: 0, orange: 0, red: 0, verified: 0 },
      );
      return {
        state: data.state,
        ...agg,
        municipios: municipios.size,
        lastReport,
      };
    } catch (e) {
      console.error("[stats] getStateStats failed", e);
      return empty;
    }
  });

/** Small headline counts for the home trust banner. */
export const getDamageTotals = createServerFn({ method: "GET" }).handler(
  async (): Promise<DamageTotals> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data, error } = await supabaseAdmin.rpc("get_damage_totals");
      if (error || !data || !data[0]) {
        if (error) console.error("[stats] getDamageTotals", error);
        return EMPTY_TOTALS;
      }
      const r = data[0];
      return {
        total: r.total ?? 0,
        green: r.green ?? 0,
        yellow: r.yellow ?? 0,
        orange: r.orange ?? 0,
        red: r.red ?? 0,
        verified: r.verified ?? 0,
        areas: r.areas ?? 0,
      };
    } catch (e) {
      console.error("[stats] getDamageTotals failed", e);
      return EMPTY_TOTALS;
    }
  },
);

// ---------------------------------------------------------------------------
// Risk-factor drill-down ("why" behind the results). Anonymized aggregates
// only — never addresses, photos or report ids. Brokered through the service
// role so the locked base table stays private.
// ---------------------------------------------------------------------------

export type FactorRow = {
  key: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
};

export type RiskFactors = {
  checklist: FactorRow[];
  age: FactorRow[];
  type: FactorRow[];
  intensity: FactorRow[];
  safetyRule: FactorRow[];
};

export const EMPTY_RISK_FACTORS: RiskFactors = {
  checklist: [],
  age: [],
  type: [],
  intensity: [],
  safetyRule: [],
};

const GROUP_MAP: Record<string, keyof RiskFactors> = {
  checklist: "checklist",
  age: "age",
  type: "type",
  intensity: "intensity",
  safety_rule: "safetyRule",
};

/** Shape a flat factor-row list into the grouped RiskFactors object. */
export function groupRiskFactorRows(
  rows: Array<{
    factor_group: string;
    factor_key: string;
    total: number | null;
    green: number | null;
    yellow: number | null;
    orange: number | null;
    red: number | null;
  }>,
): RiskFactors {
  const out: RiskFactors = {
    checklist: [],
    age: [],
    type: [],
    intensity: [],
    safetyRule: [],
  };
  for (const r of rows) {
    const group = GROUP_MAP[r.factor_group];
    if (!group) continue;
    out[group].push({
      key: r.factor_key,
      total: r.total ?? 0,
      green: r.green ?? 0,
      yellow: r.yellow ?? 0,
      orange: r.orange ?? 0,
      red: r.red ?? 0,
    });
  }
  for (const g of Object.values(out)) g.sort((a, b) => b.total - a.total);
  return out;
}

const riskFactorsSchema = z.object({
  state: z.string().trim().min(1).max(120).optional(),
  municipality: z.string().trim().min(1).max(120).optional(),
});

/**
 * Public, anonymized breakdown of WHY an area's results look the way they do:
 * flagged checklist items, building age/type, seismic intensity bands and the
 * deterministic safety rules that fired — each split by risk level.
 */
export const getRiskFactors = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => riskFactorsSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<RiskFactors> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: rows, error } = await supabaseAdmin.rpc("get_risk_factors", {
        _state: data.state ?? undefined,
        _municipality: data.municipality ?? undefined,
      });
      if (error || !rows) {
        if (error) console.error("[stats] getRiskFactors", error);
        return EMPTY_RISK_FACTORS;
      }
      return groupRiskFactorRows(rows);
    } catch (e) {
      console.error("[stats] getRiskFactors failed", e);
      return EMPTY_RISK_FACTORS;
    }
  });

const leadSchema = z.object({
  organization: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().email().max(255),
  note: z.string().trim().max(1000).optional().default(""),
});

/** Institution / authority interest capture. Insert-only, no public reads. */
export const submitInstitutionLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { error } = await supabaseAdmin.from("institution_leads").insert({
        organization: data.organization,
        contact_name: data.contactName || null,
        email: data.email,
        note: data.note || null,
      });
      if (error) {
        console.error("[stats] submitInstitutionLead", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[stats] submitInstitutionLead failed", e);
      return { ok: false };
    }
  });
