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
        return jsonResponse(
          envelope("aggregates", { filters, areas: room.areas }),
          600,
        );
      },
    },
  },
});
