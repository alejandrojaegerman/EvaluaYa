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
    /** Lifecycle breakdown the engineer actually reports. */
    progress: {
      claimedOnly: number;
      contacted: number;
      visited: number;
      resolved: number;
      stalled: number;
    };
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
    progress: {
      claimedOnly: 0,
      contacted: 0,
      visited: 0,
      resolved: 0,
      stalled: 0,
    },
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
          mProgress,
        ] = await Promise.all([
          supabaseAdmin.rpc("get_admin_assessment_stats"),
          supabaseAdmin.rpc("get_admin_assessment_timeseries"),
          supabaseAdmin.rpc("get_admin_top_states"),
          supabaseAdmin.rpc("get_admin_volunteer_stats"),
          supabaseAdmin.rpc("get_admin_engineer_coverage"),
          supabaseAdmin.rpc("get_admin_matching_stats"),
          supabaseAdmin.rpc("get_admin_coverage_gaps"),
          supabaseAdmin.rpc("get_admin_matching_progress"),
        ]);

        const a = aStats.data?.[0];
        const v = vStats.data?.[0];
        const m = mStats.data?.[0];
        const mp = mProgress.data?.[0];

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
            progress: {
              claimedOnly: mp?.claimed_only ?? 0,
              contacted: mp?.contacted ?? 0,
              visited: mp?.visited ?? 0,
              resolved: mp?.resolved ?? 0,
              stalled: mp?.stalled ?? 0,
            },
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
          orange: (r as { orange?: number }).orange ?? 0,
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

// ---------------------------------------------------------------------------
// Evaluation quality & completeness scorecard (Goal 1).
// ---------------------------------------------------------------------------

export type QualityMetrics = {
  total: number;
  withPhotos: number;
  noPhotos: number;
  mostlyUnsure: number;
  thin: number;
  missingLocation: number;
  missingBuilding: number;
  missingIntensity: number;
  complete: number;
  professional: number;
  verified: number;
  unverifiedHigh: number;
  lowQuality: number;
};

const EMPTY_QUALITY: QualityMetrics = {
  total: 0,
  withPhotos: 0,
  noPhotos: 0,
  mostlyUnsure: 0,
  thin: 0,
  missingLocation: 0,
  missingBuilding: 0,
  missingIntensity: 0,
  complete: 0,
  professional: 0,
  verified: 0,
  unverifiedHigh: 0,
  lowQuality: 0,
};

export const adminGetQualityMetrics = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; quality: QualityMetrics }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, quality: EMPTY_QUALITY };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: row, error } = await supabaseAdmin.rpc(
          "get_admin_quality_metrics",
        );
        if (error) {
          console.error("[admin-analytics] quality metrics", error);
          return { ok: false, quality: EMPTY_QUALITY };
        }
        const q = (row ?? {}) as Partial<QualityMetrics>;
        return {
          ok: true,
          quality: { ...EMPTY_QUALITY, ...q },
        };
      } catch (e) {
        console.error("[admin-analytics] adminGetQualityMetrics failed", e);
        return { ok: false, quality: EMPTY_QUALITY };
      }
    },
  );

// ---------------------------------------------------------------------------
// Flagged-report worklist (Goal 1) — reports that need manual oversight.
// ---------------------------------------------------------------------------

export type FlaggedFilter =
  | "all"
  | "no_photos"
  | "mostly_unsure"
  | "thin"
  | "missing_location"
  | "unverified_high";

export type FlaggedReport = {
  publicId: string;
  createdAt: string;
  riskLevel: "green" | "yellow" | "orange" | "red";
  reportType: string | null;
  state: string;
  municipality: string;
  buildingType: string | null;
  answerCount: number;
  photoCount: number;
  unsureCount: number;
  flaggedCount: number;
  verified: boolean;
  noPhotos: boolean;
  mostlyUnsure: boolean;
  thin: boolean;
  missingLocation: boolean;
  unverifiedHigh: boolean;
};

const flaggedSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  filter: z
    .enum([
      "all",
      "no_photos",
      "mostly_unsure",
      "thin",
      "missing_location",
      "unverified_high",
    ])
    .default("all"),
  limit: z.number().int().min(1).max(200).optional(),
});

export const adminGetFlaggedReports = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => flaggedSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; reports: FlaggedReport[] }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, reports: [] };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: rows, error } = await supabaseAdmin.rpc(
          "get_admin_flagged_reports",
          { _filter: data.filter, _limit: data.limit ?? 50 },
        );
        if (error) {
          console.error("[admin-analytics] flagged reports", error);
          return { ok: false, reports: [] };
        }
        const reports: FlaggedReport[] = (rows ?? []).map((r) => ({
          publicId: r.public_id,
          createdAt: String(r.created_at),
          riskLevel: (r.risk_level ?? "green") as
            | "green"
            | "yellow"
            | "orange"
            | "red",
          reportType: r.report_type ?? null,
          state: r.state ?? "Desconocido",
          municipality: r.municipality ?? "Desconocido",
          buildingType: r.building_type ?? null,
          answerCount: r.answer_count ?? 0,
          photoCount: r.photo_count ?? 0,
          unsureCount: r.unsure_count ?? 0,
          flaggedCount: r.flagged_count ?? 0,
          verified: Boolean(r.verified),
          noPhotos: Boolean(r.no_photos),
          mostlyUnsure: Boolean(r.mostly_unsure),
          thin: Boolean(r.thin),
          missingLocation: Boolean(r.missing_location),
          unverifiedHigh: Boolean(r.unverified_high),
        }));
        return { ok: true, reports };
      } catch (e) {
        console.error("[admin-analytics] adminGetFlaggedReports failed", e);
        return { ok: false, reports: [] };
      }
    },
  );

// ---------------------------------------------------------------------------
// Verification metrics (Goal 1) — professional/verified share + verdicts.
// ---------------------------------------------------------------------------

export type VerificationMetrics = {
  total: number;
  professional: number;
  selfAssessed: number;
  verified: number;
  agree: number;
  adjust: number;
  unverifiedHigh: number;
  unverifiedHighList: Array<{
    publicId: string;
    createdAt: string;
    riskLevel: "green" | "yellow" | "orange" | "red";
    state: string;
    municipality: string;
  }>;
};

const EMPTY_VERIFICATION: VerificationMetrics = {
  total: 0,
  professional: 0,
  selfAssessed: 0,
  verified: 0,
  agree: 0,
  adjust: 0,
  unverifiedHigh: 0,
  unverifiedHighList: [],
};

export const adminGetVerificationMetrics = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; verification: VerificationMetrics }> => {
      if (!adminOk(data.adminSecret))
        return { ok: false, verification: EMPTY_VERIFICATION };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: row, error } = await supabaseAdmin.rpc(
          "get_admin_verification_metrics",
        );
        if (error) {
          console.error("[admin-analytics] verification metrics", error);
          return { ok: false, verification: EMPTY_VERIFICATION };
        }
        const v = (row ?? {}) as Partial<VerificationMetrics> & {
          unverifiedHighList?: unknown;
        };
        const list = Array.isArray(v.unverifiedHighList)
          ? (v.unverifiedHighList as Array<Record<string, unknown>>).map(
              (x) => ({
                publicId: String(x.public_id ?? ""),
                createdAt: String(x.created_at ?? ""),
                riskLevel: (x.risk_level ?? "red") as
                  | "green"
                  | "yellow"
                  | "orange"
                  | "red",
                state: String(x.state ?? "Desconocido"),
                municipality: String(x.municipality ?? "Desconocido"),
              }),
            )
          : [];
        return {
          ok: true,
          verification: {
            ...EMPTY_VERIFICATION,
            ...v,
            unverifiedHighList: list,
          },
        };
      } catch (e) {
        console.error("[admin-analytics] adminGetVerificationMetrics failed", e);
        return { ok: false, verification: EMPTY_VERIFICATION };
      }
    },
  );
