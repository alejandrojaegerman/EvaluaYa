/**
 * One-off retroactive reclassification of existing assessments into the
 * 4-level risk scale (green / yellow / orange / red).
 *
 * Pass 1 (deterministic): re-run the real safety-rules engine against each
 * record's stored property + answers, then apply the structural-damage
 * heuristic (1 structural "yes" => orange, 2+ => red), matching the live
 * provisional logic. We never DOWNGRADE an existing record — we take the more
 * severe of the stored level and the computed floor. prior_risk_level captures
 * the original value for auditability.
 *
 * Run: bun run scripts/reclassify.ts        (dry run)
 *      bun run scripts/reclassify.ts --apply (writes changes)
 */
import { createClient } from "@supabase/supabase-js";

import type { RiskLevel } from "../src/lib/assessment-types";
import { evaluateSafetyRules, maxRisk } from "../src/lib/safety-rules";

const STRUCTURAL_DAMAGE_IDS = [
  "foundation",
  "exterior_walls",
  "interior_walls",
  "columns_beams",
  "doors_windows",
  "roof",
  "stairs",
];

const apply = process.argv.includes("--apply");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

function computeFloor(
  lang: "es" | "en",
  property: Record<string, unknown>,
  answers: Array<{ id: string; value: string }>,
): RiskLevel {
  const base = evaluateSafetyRules(
    lang,
    {
      structuralType: property.structuralType as never,
      floors: (property.floors as number) ?? 1,
      seismicIntensity: property.seismicIntensity as never,
      pga: property.pga as never,
      spectralDemand: property.spectralDemand as never,
      soilClass: property.soilClass as never,
    },
    answers.map((a) => ({ id: a.id, value: a.value as never })),
  );
  let level = base.level;
  // Deterministic damage heuristic caps at ORANGE: distinguishing orange vs red
  // for reported structural damage needs the photos/AI (handled separately).
  // True red still comes from the safety-rule engine (liquefaction, pounding,
  // URM + damage, severe-shaking combos, etc.) captured in base.level above.
  const damageCount = STRUCTURAL_DAMAGE_IDS.filter(
    (id) => answers.find((a) => a.id === id)?.value === "yes",
  ).length;
  if (damageCount >= 1) level = maxRisk(level, "orange");
  return level;
}

async function main() {
  const { data, error } = await supabase
    .from("assessments")
    .select("id, public_id, language, property, answers, risk_level, prior_risk_level")
    .not("risk_level", "is", null);
  if (error) throw error;

  const rows = data ?? [];
  let changed = 0;
  const tally: Record<string, number> = {};

  for (const r of rows) {
    const current = (r.risk_level as RiskLevel) ?? "green";
    const lang = (r.language as "es" | "en") ?? "es";
    const property = (r.property as Record<string, unknown>) ?? {};
    const answers = (r.answers as Array<{ id: string; value: string }>) ?? [];
    const floor = computeFloor(lang, property, answers);
    const next = maxRisk(current, floor);

    if (next !== current) {
      changed++;
      tally[`${current}->${next}`] = (tally[`${current}->${next}`] ?? 0) + 1;
      if (apply) {
        const patch: Record<string, unknown> = { risk_level: next };
        if (!r.prior_risk_level) patch.prior_risk_level = current;
        const { error: upErr } = await supabase
          .from("assessments")
          .update(patch)
          .eq("id", r.id);
        if (upErr) console.error("update failed", r.public_id, upErr.message);
      }
    }
  }

  console.log(`Scanned ${rows.length} records. ${changed} would change.`);
  console.log("Transitions:", tally);
  console.log(apply ? "APPLIED." : "DRY RUN (pass --apply to write).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
