import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  EMPTY_RISK_FACTORS,
  groupRiskFactorRows,
  type RiskFactors,
} from "@/lib/stats.functions";

// ---------------------------------------------------------------------------
// Admin analytics — gated by VOLUNTEER_ADMIN_SECRET (same secret that unlocks
// the volunteer review page). All reads go through the service-role client and
// SECURITY DEFINER RPCs; nothing here is exposed to the public app.
// ---------------------------------------------------------------------------

export type AdminAnalytics = {
  assessments: {
    total: number;
    green: number;
    yellow: number;
    orange: number;
    red: number;
    analyzed: number;
    drafts: number;
    completionRate: number; // analyzed / total, 0..1
  };
  timeseries: Array<{
    day: string;
    total: number;
    green: number;
    yellow: number;
    orange: number;
    red: number;
  }>;
  topStates: Array<{
    state: string;
    total: number;
    green: number;
    yellow: number;
    orange: number;
    red: number;
  }>;
  volunteers: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    individuals: number;
    organizations: number;
  };
  coverage: Array<{ state: string; engineers: number }>;
  matching: {
    total: number;
    open: number;
    claimed: number;
    closed: number;
    claimRate: number; // (claimed + closed) / total, 0..1
    avgClaimHours: number | null;
  };
  coverageGaps: Array<{ state: string; openRequests: number }>;
};

const EMPTY: AdminAnalytics = {
  assessments: {
    total: 0,
    green: 0,
    yellow: 0,
    orange: 0,
    red: 0,
    analyzed: 0,
    drafts: 0,
    completionRate: 0,
  },
  timeseries: [],
  topStates: [],
  volunteers: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    individuals: 0,
    organizations: 0,
  },
  coverage: [],
  matching: {
    total: 0,
    open: 0,
    claimed: 0,
    closed: 0,
    claimRate: 0,
    avgClaimHours: null,
  },
  coverageGaps: [],
};

const adminSchema = z.object({
  adminSecret: z.string().min(1).max(256),
});

/** Constant-time compare against VOLUNTEER_ADMIN_SECRET. */
function adminOk(provided: string): boolean {
  const expected = process.env.VOLUNTEER_ADMIN_SECRET;
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const adminGetAnalytics = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; analytics: AdminAnalytics }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, analytics: EMPTY };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const [
          aStats,
          aSeries,
          aTop,
          vStats,
          cov,
          mStats,
          gaps,
        ] = await Promise.all([
          supabaseAdmin.rpc("get_admin_assessment_stats"),
          supabaseAdmin.rpc("get_admin_assessment_timeseries"),
          supabaseAdmin.rpc("get_admin_top_states"),
          supabaseAdmin.rpc("get_admin_volunteer_stats"),
          supabaseAdmin.rpc("get_admin_engineer_coverage"),
          supabaseAdmin.rpc("get_admin_matching_stats"),
          supabaseAdmin.rpc("get_admin_coverage_gaps"),
        ]);

        const a = aStats.data?.[0];
        const v = vStats.data?.[0];
        const m = mStats.data?.[0];

        const assessTotal = a?.total ?? 0;
        const analyzed = a?.analyzed ?? 0;
        const matchTotal = m?.total ?? 0;
        const claimedPlusClosed = (m?.claimed ?? 0) + (m?.closed ?? 0);

        const analytics: AdminAnalytics = {
          assessments: {
            total: assessTotal,
            green: a?.green ?? 0,
            yellow: a?.yellow ?? 0,
            orange: a?.orange ?? 0,
            red: a?.red ?? 0,
            analyzed,
            drafts: a?.drafts ?? 0,
            completionRate: assessTotal > 0 ? analyzed / assessTotal : 0,
          },
          timeseries: (aSeries.data ?? []).map((r) => ({
            day: String(r.day),
            total: r.total ?? 0,
            green: r.green ?? 0,
            yellow: r.yellow ?? 0,
            orange: r.orange ?? 0,
            red: r.red ?? 0,
          })),
          topStates: (aTop.data ?? []).map((r) => ({
            state: r.state,
            total: r.total ?? 0,
            green: r.green ?? 0,
            yellow: r.yellow ?? 0,
            orange: r.orange ?? 0,
            red: r.red ?? 0,
          })),
          volunteers: {
            total: v?.total ?? 0,
            pending: v?.pending ?? 0,
            approved: v?.approved ?? 0,
            rejected: v?.rejected ?? 0,
            individuals: v?.individuals ?? 0,
            organizations: v?.organizations ?? 0,
          },
          coverage: (cov.data ?? []).map((r) => ({
            state: r.state,
            engineers: r.engineers ?? 0,
          })),
          matching: {
            total: matchTotal,
            open: m?.open ?? 0,
            claimed: m?.claimed ?? 0,
            closed: m?.closed ?? 0,
            claimRate: matchTotal > 0 ? claimedPlusClosed / matchTotal : 0,
            avgClaimHours:
              m?.avg_claim_seconds != null
                ? m.avg_claim_seconds / 3600
                : null,
          },
          coverageGaps: (gaps.data ?? []).map((r) => ({
            state: r.state,
            openRequests: r.open_requests ?? 0,
          })),
        };

        return { ok: true, analytics };
      } catch (e) {
        console.error("[admin-analytics] adminGetAnalytics failed", e);
        return { ok: false, analytics: EMPTY };
      }
    },
  );

// ---------------------------------------------------------------------------
// Per-state "why" drill-down: the same anonymized factor breakdown the public
// map shows, PLUS individual recent reports (no PII) for this gated view.
// ---------------------------------------------------------------------------

export type StateReport = {
  publicId: string;
  createdAt: string;
  riskLevel: "green" | "yellow" | "orange" | "red";
  municipality: string;
  buildingType: string | null;
  age: string | null;
  structuralType: string | null;
  seismicIntensity: number | null;
  flaggedCount: number;
};

export type StateDrilldown = {
  factors: RiskFactors;
  reports: StateReport[];
};

const EMPTY_DRILLDOWN: StateDrilldown = {
  factors: EMPTY_RISK_FACTORS,
  reports: [],
};

const drilldownSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  state: z.string().trim().min(1).max(120),
});

export const adminGetStateDrilldown = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => drilldownSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; drilldown: StateDrilldown }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, drilldown: EMPTY_DRILLDOWN };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const [factorsRes, reportsRes] = await Promise.all([
          supabaseAdmin.rpc("get_risk_factors", {
            _state: data.state,
            _municipality: undefined,
          }),
          supabaseAdmin.rpc("get_admin_state_reports", {
            _state: data.state,
            _limit: 25,
          }),
        ]);

        if (factorsRes.error) {
          console.error("[admin-analytics] drilldown factors", factorsRes.error);
        }
        if (reportsRes.error) {
          console.error("[admin-analytics] drilldown reports", reportsRes.error);
        }

        const factors = groupRiskFactorRows(factorsRes.data ?? []);
        const reports: StateReport[] = (reportsRes.data ?? []).map((r) => ({
          publicId: r.public_id,
          createdAt: String(r.created_at),
          riskLevel: (r.risk_level ?? "green") as "green" | "yellow" | "orange" | "red",
          municipality: r.municipality ?? "Desconocido",
          buildingType: r.building_type ?? null,
          age: r.age ?? null,
          structuralType: r.structural_type ?? null,
          seismicIntensity:
            r.seismic_intensity != null ? Number(r.seismic_intensity) : null,
          flaggedCount: r.flagged_count ?? 0,
        }));

        return { ok: true, drilldown: { factors, reports } };
      } catch (e) {
        console.error("[admin-analytics] adminGetStateDrilldown failed", e);
        return { ok: false, drilldown: EMPTY_DRILLDOWN };
      }
    },
  );

// ---------------------------------------------------------------------------
// Buildings with multiple reports — helps spot a single structure generating
// several flags. Anonymized aggregates only (no addresses/photos/report ids).
// ---------------------------------------------------------------------------

export type BuildingCluster = {
  state: string;
  municipality: string;
  buildingName: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  lastReport: string | null;
};

const clustersSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  state: z.string().trim().min(1).max(120).optional(),
});

export const adminGetBuildingClusters = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => clustersSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; clusters: BuildingCluster[] }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, clusters: [] };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: rows, error } = await supabaseAdmin.rpc(
          "get_admin_building_clusters",
          { _state: data.state ?? undefined },
        );
        if (error) {
          console.error("[admin-analytics] building clusters", error);
          return { ok: false, clusters: [] };
        }
        const clusters: BuildingCluster[] = (rows ?? []).map((r) => ({
          state: r.state ?? "Desconocido",
          municipality: r.municipality ?? "Desconocido",
          buildingName: r.building_name ?? "—",
          total: r.total ?? 0,
          green: r.green ?? 0,
          yellow: r.yellow ?? 0,
          red: r.red ?? 0,
          lastReport: r.last_report ?? null,
        }));
        return { ok: true, clusters };
      } catch (e) {
        console.error("[admin-analytics] adminGetBuildingClusters failed", e);
        return { ok: false, clusters: [] };
      }
    },
  );
