import { createFileRoute } from "@tanstack/react-router";

import { runAdminHelpDigest } from "@/lib/admin-help-digest.server";

// Daily cron endpoint that emails the site admin a digest of matching progress:
// open/claimed/stalled/resolved counts plus stalled requests needing attention.
// Triggered by pg_cron via net.http_post with an
// Authorization: Bearer <service_role_key> header (validated below). Not part
// of the public site; never linked and excluded from the sitemap.
export const Route = createFileRoute("/lovable/cron/admin-help-digest")({
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
          const result = await runAdminHelpDigest();
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (e) {
          console.error("[admin-help-digest] route failed", e);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
