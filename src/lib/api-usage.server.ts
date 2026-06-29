// Server-only helper that records anonymous usage of the public open-data API.
// One row per request that reaches the origin (CDN-cached hits won't count).
// No IPs, no report identifiers, no PII — only the endpoint, the filters the
// consumer asked for, the referring host, and a short user-agent label.
// Mirrors the fire-and-forget posture of funnel tracking: failures here must
// never affect the API response.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Best-effort host of the calling page/app, for "who is using this" context. */
function refererHost(request: Request): string | null {
  const ref =
    request.headers.get("referer") ?? request.headers.get("origin") ?? "";
  if (!ref) return null;
  try {
    return new URL(ref).host.slice(0, 200) || null;
  } catch {
    return ref.slice(0, 200) || null;
  }
}

/** Record one open-data API call. Swallows all errors. */
export async function logApiUsage(
  endpoint: string,
  filters: Record<string, unknown> | null | undefined,
  request: Request,
): Promise<void> {
  try {
    const ua = (request.headers.get("user-agent") ?? "").slice(0, 300) || null;
    const clean =
      filters && typeof filters === "object"
        ? Object.fromEntries(
            Object.entries(filters).filter(
              ([, v]) => v !== null && v !== undefined && v !== "",
            ),
          )
        : {};
    await supabaseAdmin.from("api_usage_events").insert({
      endpoint,
      filters:
        Object.keys(clean).length > 0
          ? (clean as Record<string, string>)
          : null,
      referer_host: refererHost(request),
      user_agent: ua,
    });
  } catch (e) {
    console.error("[api-usage] logApiUsage failed", e);
  }
}
