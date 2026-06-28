import { createClient } from "@supabase/supabase-js";

import { sendSlackNotification, riskTag } from "./slack-notify.server";

type AdminRequestRow = {
  id: string;
  state: string | null;
  municipality: string | null;
  risk_level: string | null;
  status: string | null;
  progress_stage: string | null;
  progress_updated_at: string | null;
  claimed_at: string | null;
  created_at: string | null;
  stalled: boolean | null;
};

type ProgressRow = {
  claimed_only: number | null;
  contacted: number | null;
  visited: number | null;
  resolved: number | null;
  stalled: number | null;
};


/**
 * Sends the once-daily admin matching digest: open/claimed/stalled/resolved
 * counts plus a list of stalled requests (claimed >24h ago with no progress).
 * Driven by `get_admin_help_requests` + `get_admin_matching_progress`
 * (service role only). Idempotent per day so re-runs won't double-send.
 */
export async function runAdminHelpDigest(): Promise<{
  ok: boolean;
  sent: number;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[admin-help-digest] missing supabase env");
    return { ok: false, sent: 0 };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const [{ data: rows, error }, { data: prog }] = await Promise.all([
    supabase.rpc("get_admin_help_requests", { _limit: 300 }),
    supabase.rpc("get_admin_matching_progress"),
  ]);
  if (error) {
    console.error("[admin-help-digest] rpc failed", error);
    return { ok: false, sent: 0 };
  }

  const requests = (rows ?? []) as AdminRequestRow[];
  const p = (Array.isArray(prog) ? prog[0] : null) as ProgressRow | null;
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const openCount = requests.filter((r) => r.status === "open").length;
  const claimedCount = requests.filter((r) => r.status === "claimed").length;
  const resolvedToday = requests.filter(
    (r) =>
      r.progress_stage === "resolved" &&
      r.progress_updated_at &&
      new Date(r.progress_updated_at).getTime() >= dayStart.getTime(),
  ).length;

  const stalledItems = requests
    .filter((r) => r.stalled)
    .slice(0, 20)
    .map((r) => {
      const since = r.claimed_at ? new Date(r.claimed_at).getTime() : now;
      return {
        municipality: r.municipality,
        state: r.state,
        riskLevel: r.risk_level,
        stage: r.progress_stage ?? "claimed",
        ageHours: (now - since) / 36e5,
      };
    });

  const stalledCount = p?.stalled ?? stalledItems.length;

  const stalledSummary =
    stalledItems
      .slice(0, 8)
      .map(
        (s) =>
          `• ${riskTag(s.riskLevel)} — ${[s.municipality, s.state]
            .filter(Boolean)
            .join(", ") || "—"} (${s.stage}, ${Math.round(s.ageHours)}h)`,
      )
      .join("\n") || "Ninguna 🎉";

  const res = await sendSlackNotification({
    emoji: "📋",
    title: "Resumen diario de solicitudes de ayuda",
    fields: [
      { label: "Abiertas", value: String(openCount) },
      { label: "Reclamadas", value: String(claimedCount) },
      { label: "Estancadas", value: String(stalledCount) },
      { label: "Resueltas hoy", value: String(resolvedToday) },
      { label: "Estancadas (detalle)", value: stalledSummary },
    ],
    url: "/admin/voluntarios",
    buttonLabel: "Abrir triaje",
    urgent: stalledCount > 0,
  });

  return { ok: res.ok, sent: res.ok ? 1 : 0 };
}
