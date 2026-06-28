import { createFileRoute } from "@tanstack/react-router";

import {
  API_BASE,
  DATA_LICENSE,
  corsPreflight,
  envelope,
  jsonResponse,
} from "@/lib/open-data";

/** Discovery manifest: lists every endpoint, its params, license + attribution. */
function buildManifest() {
  return envelope("manifest", {
    name: "EvalúaYa Open Data API",
    description:
      "Anonymized, open structural-damage data from post-earthquake self-assessments in Venezuela. Counts only — never addresses, photos or report IDs.",
    version: "v1",
    base_url: API_BASE,
    license: DATA_LICENSE,
    endpoints: [
      {
        path: "/api/public/v1/aggregates.json",
        description: "Counts by state/municipality split by risk level.",
        params: ["state", "municipality", "from", "to"],
      },
      {
        path: "/api/public/v1/totals.json",
        description: "National headline totals.",
        params: ["state", "municipality", "from", "to"],
      },
      {
        path: "/api/public/v1/timeseries.json",
        description: "Daily damage trend (last ~90 days).",
        params: ["state", "municipality", "from", "to"],
      },
      {
        path: "/api/public/v1/risk-factors.json",
        description:
          "Why the results look the way they do: flagged checklist items, building age/type, seismic intensity bands, and the deterministic safety rules that fired.",
        params: ["state", "municipality", "from", "to"],
      },
      {
        path: "/api/public/v1/methodology.json",
        description:
          "Machine-readable risk taxonomy, deterministic safety rules, checklist and glossary so agents interpret the data correctly.",
        params: [],
      },
    ],
  });
}

export const Route = createFileRoute("/api/public/v1/index.json")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),
      GET: () => jsonResponse(buildManifest(), 3600),
    },
  },
});
