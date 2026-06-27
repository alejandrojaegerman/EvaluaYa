import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { engineerPanelUrl } from "@/lib/volunteer-links";

/**
 * Admin-only one-off: forward a single help request to EVERY approved
 * (verified) engineer that has an email + valid panel link — regardless of
 * coverage state. This complements the automatic notifier, which only emails
 * engineers whose states include the request's state.
 *
 * Auth: requires the `x-admin-secret` header to match VOLUNTEER_ADMIN_SECRET.
 * Idempotent per engineer+request via `manual-forward:<id>:<engineerId>`, so
 * engineers who already got the auto-email are not double-sent.
 *
 * POST body: { "requestId": "<uuid>" }
 */

const bodySchema = z.object({
  requestId: z.string().trim().uuid(),
});

function adminOk(provided: string | null): boolean {
  const expected = process.env.VOLUNTEER_ADMIN_SECRET;
  if (!expected || !provided) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const Route = createFileRoute("/api/public/admin/forward-help-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!adminOk(request.headers.get("x-admin-secret"))) {
          return new Response("Unauthorized", { status: 401 });
        }

        let parsed: { requestId: string };
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // 1. Load the target request.
        const { data: req, error: reqErr } = await supabaseAdmin
          .from("help_requests")
          .select("id, state, municipality, risk_level, note")
          .eq("id", parsed.requestId)
          .maybeSingle();
        if (reqErr || !req) {
          return new Response("Request not found", { status: 404 });
        }

        // 2. Load ALL approved engineers with an email + access token —
        //    no state filtering.
        const { data: engineers, error: engErr } = await supabaseAdmin
          .from("volunteer_engineers")
          .select("id, name, email, access_token, token_expires_at")
          .eq("status", "approved")
          .not("email", "is", null)
          .not("access_token", "is", null);
        if (engErr) {
          return new Response("DB error", { status: 500 });
        }

        const now = Date.now();
        const eligible = (engineers ?? []).filter(
          (e) =>
            !!e.email?.trim() &&
            !!e.access_token &&
            (!e.token_expires_at ||
              new Date(e.token_expires_at).getTime() > now),
        );

        const location =
          [req.municipality, req.state]
            .map((s) => (s ?? "").trim())
            .filter(Boolean)
            .join(", ") || "—";

        const { sendSystemEmail } = await import("@/lib/notify-email.server");

        const results = await Promise.all(
          eligible.map(async (eng) => {
            const res = await sendSystemEmail({
              templateName: "help-request-notification",
              recipientEmail: eng.email ?? undefined,
              idempotencyKey: `manual-forward:${req.id}:${eng.id}`,
              templateData: {
                engineerName: eng.name ?? "",
                riskLevel: req.risk_level ?? "",
                location,
                note: req.note ?? "",
                panelUrl: engineerPanelUrl(
                  eng.access_token as string,
                  "help_digest",
                ),
              },
            });
            return {
              email: eng.email,
              name: eng.name,
              ok: res.ok,
              reason: res.reason ?? null,
            };
          }),
        );

        return Response.json({
          requestId: req.id,
          location,
          state: req.state,
          eligible: eligible.length,
          sent: results.filter((r) => r.ok).length,
          results,
        });
      },
    },
  },
});
