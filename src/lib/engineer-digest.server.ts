import { createClient } from "@supabase/supabase-js";

import { sendSystemEmail } from "./notify-email.server";

const ROOT = "https://evaluaya.app";

type DigestRow = {
  engineer_id: string;
  name: string | null;
  email: string | null;
  access_token: string | null;
  open_count: number;
  sample: unknown;
};

function panelUrl(token: string): string {
  const u = new URL(`${ROOT}/voluntarios/panel/${token}`);
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", "help_digest");
  return u.toString();
}

/**
 * Sends the once-daily "still-open requests in your area" digest to every
 * approved engineer that currently has open requests. Driven by the
 * `get_engineer_digest` RPC (service role only). Idempotent per day via the
 * idempotency key so re-runs within the same day won't double-send.
 */
export async function runEngineerDigest(): Promise<{
  ok: boolean;
  sent: number;
  total: number;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[engineer-digest] missing supabase env");
    return { ok: false, sent: 0, total: 0 };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("get_engineer_digest");
  if (error) {
    console.error("[engineer-digest] rpc failed", error);
    return { ok: false, sent: 0, total: 0 };
  }

  const rows = (data ?? []) as DigestRow[];
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let sent = 0;

  for (const row of rows) {
    if (!row.email || !row.access_token || row.open_count <= 0) continue;
    const items = Array.isArray(row.sample) ? row.sample : [];
    const res = await sendSystemEmail({
      templateName: "help-request-digest",
      recipientEmail: row.email,
      idempotencyKey: `digest:${row.engineer_id}:${day}`,
      templateData: {
        engineerName: row.name ?? "",
        openCount: row.open_count,
        items,
        panelUrl: panelUrl(row.access_token),
      },
    });
    if (res.ok) sent += 1;
  }

  return { ok: true, sent, total: rows.length };
}
