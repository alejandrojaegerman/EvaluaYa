import { createFileRoute } from "@tanstack/react-router";

import {
  corsPreflight,
  envelope,
  jsonResponse,
  parseFilters,
} from "@/lib/open-data";
import { getRiskFactorsFiltered } from "@/lib/stats.functions";

export const Route = createFileRoute("/api/public/v1/risk-factors.json")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),
      GET: async ({ request }) => {
        const filters = parseFilters(request.url);
        const factors = await getRiskFactorsFiltered({ data: filters });
        const { logApiUsage } = await import("@/lib/api-usage.server");
        await logApiUsage("risk-factors", filters, request);
        return jsonResponse(
          envelope("risk-factors", { filters, factors }),
          600,
        );
      },
    },
  },
});
