/**
 * One-time, guarded backfill of `state` / `municipality` on assessments.
 *
 * It infers the missing geo fields from the free-text address, constrained to
 * Venezuela's federal entities (the single source of truth in
 * `src/lib/venezuela.ts`). Safety guards:
 *
 *   1. DRY RUN by default — nothing is written unless you pass `--apply`.
 *   2. Only rows where `geo_inferred = false` are considered, so re-running it
 *      never re-touches a record it already estimated (idempotent).
 *   3. Only EMPTY fields are filled — a user-entered value is never overwritten.
 *   4. The inferred `state` MUST exactly match a known estado; anything else is
 *      discarded.
 *   5. A row is flagged `geo_inferred = true` only when at least one field was
 *      actually filled.
 *
 * Usage:
 *   bun run scripts/backfill-geo.ts            # dry run, prints the plan
 *   bun run scripts/backfill-geo.ts --apply    # writes the changes
 */
import { createClient } from "@supabase/supabase-js";
import { ESTADO_NAMES } from "../src/lib/venezuela";

const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!LOVABLE_API_KEY) {
  console.error("Missing LOVABLE_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = {
  id: string;
  public_id: string;
  state: string | null;
  municipality: string | null;
  property: { address?: string } | null;
};

const norm = (v: string | null | undefined) => (v ?? "").trim();
const isEmpty = (v: string | null | undefined) => norm(v).length === 0;

// Case/diacritic-insensitive match of an AI-returned estado against the
// constrained list. Returns the canonical name or null.
const ESTADO_LOOKUP = new Map(
  ESTADO_NAMES.map((n) => [
    n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    n,
  ]),
);
function canonicalEstado(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return ESTADO_LOOKUP.get(key) ?? null;
}

async function inferGeo(
  rows: { id: string; address: string }[],
): Promise<Map<string, { state: string | null; municipality: string | null }>> {
  const system = [
    "Eres un experto en geografía de Venezuela.",
    "A partir de una dirección o sector en texto libre, deduce el estado (entidad federal) y el municipio.",
    "El estado DEBE ser exactamente uno de esta lista, o null si no estás razonablemente seguro:",
    ESTADO_NAMES.join(", ") + ".",
    "El municipio es texto libre (nombre del municipio o, si no se conoce, null).",
    "No inventes. Si la dirección es ambigua o desconocida, usa null.",
    "Responde SOLO con JSON.",
  ].join("\n");

  const user = JSON.stringify(
    rows.map((r) => ({ id: r.id, address: r.address })),
  );

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY!,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            'Devuelve {"results":[{"id":"...","state":"...|null","municipality":"...|null"}]} para:\n' +
            user,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { results?: Array<{ id: string; state: unknown; municipality: unknown }> };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned non-JSON content: " + content.slice(0, 200));
  }

  const out = new Map<string, { state: string | null; municipality: string | null }>();
  for (const r of parsed.results ?? []) {
    const state = canonicalEstado(typeof r.state === "string" ? r.state : null);
    const muniRaw = typeof r.municipality === "string" ? r.municipality.trim() : "";
    const municipality = muniRaw.length > 0 && muniRaw.toLowerCase() !== "null" ? muniRaw : null;
    out.set(r.id, { state, municipality });
  }
  return out;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (will write)" : "DRY RUN (no writes)"}`);

  const { data, error } = await supabase
    .from("assessments")
    .select("id, public_id, state, municipality, property")
    .eq("geo_inferred", false);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Row[];

  // Candidates: have an address AND at least one empty geo field.
  const candidates = rows
    .filter((r) => !isEmpty(r.property?.address))
    .filter((r) => isEmpty(r.state) || isEmpty(r.municipality))
    .map((r) => ({ row: r, address: norm(r.property?.address) }));

  console.log(`Rows missing geo with an address: ${candidates.length}`);
  if (candidates.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  const inferred = await inferGeo(
    candidates.map((c) => ({ id: c.row.id, address: c.address })),
  );

  let updated = 0;
  let skipped = 0;

  for (const { row, address } of candidates) {
    const guess = inferred.get(row.id) ?? { state: null, municipality: null };
    const patch: { state?: string; municipality?: string; geo_inferred?: boolean } = {};

    // Guard: only fill fields that are currently empty.
    if (isEmpty(row.state) && guess.state) patch.state = guess.state;
    if (isEmpty(row.municipality) && guess.municipality) patch.municipality = guess.municipality;

    if (Object.keys(patch).length === 0) {
      skipped++;
      console.log(`  - ${row.public_id} "${address}" -> no confident match, skipped`);
      continue;
    }

    patch.geo_inferred = true;
    console.log(
      `  + ${row.public_id} "${address}" -> ` +
        `state=${patch.state ?? row.state ?? "(kept)"}, municipality=${patch.municipality ?? row.municipality ?? "(kept)"}`,
    );

    if (APPLY) {
      const { error: upErr } = await supabase
        .from("assessments")
        .update(patch)
        .eq("id", row.id)
        .eq("geo_inferred", false); // re-assert guard at write time
      if (upErr) {
        console.error(`    ! failed to update ${row.public_id}: ${upErr.message}`);
        continue;
      }
    }
    updated++;
  }

  console.log(
    `\nDone. ${APPLY ? "Updated" : "Would update"}: ${updated}, skipped: ${skipped}.`,
  );
  if (!APPLY) console.log("Re-run with --apply to write these changes.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
