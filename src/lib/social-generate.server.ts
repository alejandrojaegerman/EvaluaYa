// Server-only logic that turns anonymized aggregate stats into DRAFT social
// posts (Spanish only). Drafts always require admin approval before they are
// published — this module never posts to X directly.
//
// De-duplication: every generated post carries a stable `dedupe_key`, inserted
// with ignoreDuplicates so the same milestone or weekly digest is only ever
// created once.

import { absoluteUrl } from "./site";

type GenResult = { ok: boolean; created: number; reason?: string };

// Milestone thresholds. Each crossed threshold yields one milestone draft.
const ASSESSMENT_MILESTONES = [
  100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000,
];
const VOLUNTEER_MILESTONES = [5, 10, 25, 50, 100, 250, 500];

function nf(n: number): string {
  return n.toLocaleString("es-VE");
}

/** ISO-8601 year + week number, e.g. "2026-W26", for the weekly dedupe key. */
function isoYearWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week =
    1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function assessmentMilestoneBody(n: number): string {
  const url = absoluteUrl("/");
  return `🏠 Hito EvalúaYa: ya se han completado ${nf(n)} autoevaluaciones de daño estructural tras el sismo en Venezuela. Gracias a cada persona que cuida su hogar y su comunidad. Evalúa el tuyo gratis y sin registro: ${url}`;
}

function volunteerMilestoneBody(n: number): string {
  const url = absoluteUrl("/voluntarios");
  return `🤝 Ya somos ${nf(n)} ingenieros y organizaciones voluntarias apoyando a familias afectadas por el sismo en Venezuela. ¿Eres ingeniero estructural o civil? Súmate: ${url}`;
}

function weeklyInsightBody(i: {
  total: number;
  red: number;
  yellow: number;
  topState: string | null;
}): string {
  const url = absoluteUrl("/mapa");
  const highRisk = i.red + i.yellow;
  const pct = i.total > 0 ? Math.round((highRisk / i.total) * 100) : 0;
  const stateBit =
    i.topState && i.topState !== "Desconocido"
      ? ` La mayor actividad fue en ${i.topState}.`
      : "";
  return `📊 Esta semana en EvalúaYa: ${nf(i.total)} evaluaciones estructurales realizadas en Venezuela, ${pct}% marcadas como riesgo medio o alto.${stateBit} Cuida tu hogar, evalúa gratis: ${url}`;
}

/**
 * Generate any missing milestone + weekly-insight DRAFT posts.
 * Safe to run on every cron tick — duplicates are ignored.
 */
export async function generateSocialDrafts(): Promise<GenResult> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // social_posts table + get_weekly_insight RPC are not in the generated
    // types yet; cast to reach them without type errors.
    const db = supabaseAdmin as unknown as {
      rpc: (name: string) => Promise<{ data: any[] | null; error: unknown }>;
      from: (table: string) => any;
    };

    const [totalsRes, volRes, weeklyRes] = await Promise.all([
      db.rpc("get_damage_totals"),
      db.rpc("get_admin_volunteer_stats"),
      db.rpc("get_weekly_insight"),
    ]);

    const assessmentsTotal = totalsRes.data?.[0]?.total ?? 0;
    const volunteersApproved = volRes.data?.[0]?.approved ?? 0;
    const weekly = weeklyRes.data?.[0];

    const drafts: Array<{ kind: string; body: string; dedupe_key: string }> = [];

    for (const m of ASSESSMENT_MILESTONES) {
      if (assessmentsTotal >= m) {
        drafts.push({
          kind: "milestone",
          body: assessmentMilestoneBody(m),
          dedupe_key: `milestone:assessments:${m}`,
        });
      }
    }
    for (const m of VOLUNTEER_MILESTONES) {
      if (volunteersApproved >= m) {
        drafts.push({
          kind: "milestone",
          body: volunteerMilestoneBody(m),
          dedupe_key: `milestone:volunteers:${m}`,
        });
      }
    }

    if (weekly && (weekly.total ?? 0) > 0) {
      drafts.push({
        kind: "insight",
        body: weeklyInsightBody({
          total: weekly.total ?? 0,
          red: weekly.red ?? 0,
          yellow: weekly.yellow ?? 0,
          topState: weekly.top_state ?? null,
        }),
        dedupe_key: `insight:weekly:${isoYearWeek(new Date())}`,
      });
    }

    if (drafts.length === 0) return { ok: true, created: 0 };

    // ignoreDuplicates: existing dedupe_key rows are skipped silently.
    const { data, error } = await db
      .from("social_posts")
      .upsert(drafts, { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error("[social-generate] upsert failed", error);
      return { ok: false, created: 0, reason: "db_error" };
    }
    return { ok: true, created: data?.length ?? 0 };
  } catch (e) {
    console.error("[social-generate] generateSocialDrafts failed", e);
    return { ok: false, created: 0, reason: "exception" };
  }
}
