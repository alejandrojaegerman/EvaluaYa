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
        return jsonResponse(
          envelope("risk-factors", { filters, factors }),
          600,
        );
      },
    },
  },
});
