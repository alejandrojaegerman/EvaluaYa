import { createClient } from "@supabase/supabase-js";

import { sendSystemEmail } from "./notify-email.server";
import { sendSlackNotification, riskTag } from "./slack-notify.server";
import { engineerPanelUrl } from "./volunteer-links";

type EscalateRow = {
  id: string;
  public_id: string | null;
  state: string | null;
  municipality: string | null;
  risk_level: string | null;
  note: string | null;
  created_at: string | null;
};

type ActionRow = {
  id: string;
  public_id: string | null;
  state: string | null;
  municipality: string | null;
  risk_level: string | null;
  progress_stage: string | null;
  claimed_at: string | null;
  progress_updated_at: string | null;
  reminder_count: number | null;
  last_reminder_at: string | null;
  engineer_id: string | null;
  engineer_name: string | null;
  engineer_email: string | null;
  engineer_token: string | null;
  action: "reclaim" | "remind" | "none";
};

const STAGE_LABEL: Record<string, string> = {
  claimed: "Reclamada",
  contacted: "Contactó al residente",
  visited: "Visitó el inmueble",
  resolved: "Resuelta",
};

/** Human-friendly Spanish "hace X" duration from an ISO timestamp. */
function waitingLabel(since: string | null): string {
  if (!since) return "";
  const ms = Date.now() - new Date(since).getTime();
  if (ms <= 0) return "";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "día" : "días"}`;
}

/**
 * Completion engine — runs hourly via pg_cron.
 *
 * 1. Auto-reclaims requests claimed >48h ago that never moved past "claimed",
 *    returning them to the open pool so another volunteer can step in.
 * 2. Sends staged reminders (up to 3, at least 24h apart) to engineers whose
 *    claimed requests have stalled at their current stage. Red/orange requests
 *    are nudged after 6h; lower-risk after 24h.
 * 3. Escalates OPEN red/orange requests left unclaimed past 6h: posts an urgent
 *    Slack alert and emails every approved engineer covering that state, so
 *    urgent cases that nobody picked up still get a push. Fired once per
 *    request (tracked by `escalated_at`).
 *
 * All work is idempotent per request+reminder/escalation so re-runs within the
 * hour won't double-send, double-reclaim, or double-escalate.
 */
export async function runCompletionEngine(): Promise<{
  ok: boolean;
  reclaimed: number;
  reminded: number;
  escalated: number;
  total: number;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[completion-engine] missing supabase env");
    return { ok: false, reclaimed: 0, reminded: 0, escalated: 0, total: 0 };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("get_requests_needing_action");
  if (error) {
    console.error("[completion-engine] rpc failed", error);
    return { ok: false, reclaimed: 0, reminded: 0, escalated: 0, total: 0 };
  }

  const rows = (data ?? []) as ActionRow[];
  let reclaimed = 0;
  let reminded = 0;

  for (const row of rows) {
    try {
      if (row.action === "reclaim") {
        const { error: rErr } = await supabase.rpc("reclaim_stalled_request", {
          _id: row.id,
        });
        if (rErr) {
          console.error("[completion-engine] reclaim failed", row.id, rErr);
          continue;
        }
        reclaimed += 1;

        // Let the engineer know it was returned to the pool (best-effort).
        if (row.engineer_email && row.engineer_token) {
          await sendSystemEmail({
            templateName: "help-request-reminder",
            recipientEmail: row.engineer_email,
            idempotencyKey: `reclaim:${row.id}`,
            templateData: {
              engineerName: row.engineer_name ?? "",
              riskLevel: row.risk_level ?? "",
              location:
                [row.municipality, row.state].filter(Boolean).join(", ") || "—",
              stageLabel: STAGE_LABEL[row.progress_stage ?? "claimed"] ?? "Reclamada",
              waitingLabel: waitingLabel(row.claimed_at),
              reminderNumber: 3,
              panelUrl: engineerPanelUrl(row.engineer_token, "help_reminder"),
            },
          }).catch((e) =>
            console.error("[completion-engine] reclaim email failed", e),
          );
        }
        continue;
      }

      if (row.action === "remind") {
        if (!row.engineer_email || !row.engineer_token) continue;
        const nextNumber = (row.reminder_count ?? 0) + 1;
        const stageSince = row.progress_updated_at ?? row.claimed_at;
        const res = await sendSystemEmail({
          templateName: "help-request-reminder",
          recipientEmail: row.engineer_email,
          // One reminder per request per stage-bucket per day.
          idempotencyKey: `remind:${row.id}:${nextNumber}`,
          templateData: {
            engineerName: row.engineer_name ?? "",
            riskLevel: row.risk_level ?? "",
            location:
              [row.municipality, row.state].filter(Boolean).join(", ") || "—",
            stageLabel: STAGE_LABEL[row.progress_stage ?? "claimed"] ?? "Reclamada",
            waitingLabel: waitingLabel(stageSince),
            reminderNumber: nextNumber,
            panelUrl: engineerPanelUrl(row.engineer_token, "help_reminder"),
          },
        });
        if (res.ok) {
          await supabase
            .rpc("mark_request_reminded", { _id: row.id })
            .then(({ error: mErr }) => {
              if (mErr)
                console.error(
                  "[completion-engine] mark_request_reminded failed",
                  row.id,
                  mErr,
                );
            });
          reminded += 1;
        }
      }
    } catch (e) {
      console.error("[completion-engine] row failed", row.id, e);
    }
  }

  return { ok: true, reclaimed, reminded, total: rows.length };
}
