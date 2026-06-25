import { createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 6; // analyses allowed per device/IP per window

/** Hash the raw identifier so we never store a plain IP. */
function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 48);
}

/**
 * Atomic-ish rolling-window rate limiter backed by the
 * `analysis_rate_limits` table. Runs entirely with the service role.
 * Returns true when the request is allowed, false when throttled.
 */
export async function checkAnalysisRateLimit(
  ip: string,
  deviceId: string,
): Promise<boolean> {
  const requestKey = hashKey(`${ip}|${deviceId}`);
  const now = Date.now();

  try {
    const { data: existing } = await supabaseAdmin
      .from("analysis_rate_limits")
      .select("window_start, count")
      .eq("request_key", requestKey)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("analysis_rate_limits").upsert(
        {
          request_key: requestKey,
          window_start: new Date(now).toISOString(),
          count: 1,
          updated_at: new Date(now).toISOString(),
        },
        { onConflict: "request_key" },
      );
      return true;
    }

    const windowStart = new Date(existing.window_start).getTime();
    const windowExpired = now - windowStart > WINDOW_MS;

    if (windowExpired) {
      await supabaseAdmin
        .from("analysis_rate_limits")
        .update({
          window_start: new Date(now).toISOString(),
          count: 1,
          updated_at: new Date(now).toISOString(),
        })
        .eq("request_key", requestKey);
      return true;
    }

    if (existing.count >= MAX_PER_WINDOW) {
      return false;
    }

    await supabaseAdmin
      .from("analysis_rate_limits")
      .update({
        count: existing.count + 1,
        updated_at: new Date(now).toISOString(),
      })
      .eq("request_key", requestKey);
    return true;
  } catch (error) {
    // Fail open on infrastructure errors so legitimate users aren't blocked.
    console.error("[rate-limit] check failed", error);
    return true;
  }
}
