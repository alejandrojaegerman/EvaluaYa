import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AreaAggregate = {
  state: string;
  municipality: string;
  total: number;
  green: number;
  yellow: number;
  red: number;
  lastReport: string | null;
};

export type DamageTotals = {
  total: number;
  green: number;
  yellow: number;
  red: number;
  areas: number;
};

const EMPTY_TOTALS: DamageTotals = {
  total: 0,
  green: 0,
  yellow: 0,
  red: 0,
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
        red: r.red ?? 0,
        lastReport: r.last_report ?? null,
      }));
    } catch (e) {
      console.error("[stats] getDamageAggregates failed", e);
      return [];
    }
  },
);

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
        red: r.red ?? 0,
        areas: r.areas ?? 0,
      };
    } catch (e) {
      console.error("[stats] getDamageTotals failed", e);
      return EMPTY_TOTALS;
    }
  },
);

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
