import { createFileRoute } from "@tanstack/react-router";

import {
  corsPreflight,
  envelope,
  jsonResponse,
  parseFilters,
} from "@/lib/open-data";
import { getDataRoom } from "@/lib/stats.functions";

export const Route = createFileRoute("/api/public/v1/aggregates.json")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),
      GET: async ({ request }) => {
        const filters = parseFilters(request.url);
        const room = await getDataRoom({ data: filters });
        const { logApiUsage } = await import("@/lib/api-usage.server");
        await logApiUsage("aggregates", filters, request);
        return jsonResponse(
          envelope("aggregates", { filters, areas: room.areas }),
          600,
        );
      },
    },
  },
});
