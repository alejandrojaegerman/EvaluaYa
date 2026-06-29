import { createFileRoute } from "@tanstack/react-router";

import {
  buildMethodology,
  corsPreflight,
  envelope,
  jsonResponse,
} from "@/lib/open-data";

export const Route = createFileRoute("/api/public/v1/methodology.json")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),
      GET: async ({ request }) => {
        const { logApiUsage } = await import("@/lib/api-usage.server");
        await logApiUsage("methodology", null, request);
        return jsonResponse(envelope("methodology", buildMethodology()), 86400);
      },
    },
  },
});
