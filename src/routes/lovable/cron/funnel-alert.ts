import { createFileRoute } from "@tanstack/react-router";

import { runFunnelAlert } from "@/lib/funnel-alert.server";

// Hourly cron endpoint: checks whether the evaluation flow's conversion has
// collapsed relative to its 7-day baseline and, if so, emails the admin. This
// is what tells a real flow regression apart from a normal traffic dip.
// Triggered by pg_cron via net.http_post with an
// Authorization: Bearer <service_role_key> header (validated below). Not part
// of the public site; never linked and excluded from the sitemap.
export const Route = createFileRoute("/lovable/cron/funnel-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!expected) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 },
          );
        }
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "").trim();
        if (token !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const result = await runFunnelAlert();
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (e) {
          console.error("[funnel-alert] route failed", e);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
