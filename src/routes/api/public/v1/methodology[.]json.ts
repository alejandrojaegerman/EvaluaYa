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
      GET: () => jsonResponse(envelope("methodology", buildMethodology()), 86400),
    },
  },
});
