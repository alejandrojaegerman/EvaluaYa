// Client-side provisional triage. When a resident finishes their inspection
// with no connection, we still give them an immediate, color-coded safety
// recommendation derived from the deterministic safety rules + a visible-damage
// heuristic. This is intentionally conservative: it never under-calls relative
// to the rules, and it is clearly labelled "preliminary" in the UI. The full
// AI analysis replaces it once the assessment syncs.

import type { AssessmentDraft } from "./draft-store";
import type { RiskLevel } from "./assessment-types";
import { translate } from "./i18n";
import { evaluateSafetyRules, maxRisk } from "./safety-rules";

export type ProvisionalResult = {
  riskLevel: RiskLevel;
  findings: string[];
  nextSteps: string[];
};

// Structural items whose "yes" answer means observed damage.
const STRUCTURAL_DAMAGE_IDS = [
  "foundation",
  "exterior_walls",
  "interior_walls",
  "columns_beams",
  "doors_windows",
  "roof",
  "stairs",
] as const;

export function computeProvisional(draft: AssessmentDraft): ProvisionalResult {
  const lang = draft.language;
  const t = (k: string) => translate(lang, k);

  const answers = draft.answers.map((a) => ({ id: a.id, value: a.value }));
  const base = evaluateSafetyRules(
    lang,
    {
      structuralType: draft.property.structuralType,
      floors: draft.property.floors ?? 1,
      seismicIntensity: draft.property.seismicIntensity,
      pga: draft.property.pga,
      spectralDemand: draft.property.spectralDemand,
      soilClass: draft.property.soilClass,
    },
    answers,
  );

  let level: RiskLevel = base.level;
  const findings = [...base.findings];
  const nextSteps = [...base.nextSteps];

  // Visible-damage heuristic — catches damage even when no seismic data exists.
  const damageCount = STRUCTURAL_DAMAGE_IDS.filter(
    (id) => answers.find((a) => a.id === id)?.value === "yes",
  ).length;
  const anyUnsure = answers.some((a) => a.value === "unsure");

  if (damageCount >= 2) {
    level = maxRisk(level, "red");
    findings.push(t("provisional.multiDamage"));
    nextSteps.push(t("provisional.step.evacuate"));
  } else if (damageCount === 1) {
    level = maxRisk(level, "yellow");
    findings.push(t("provisional.singleDamage"));
    nextSteps.push(t("provisional.step.limit"));
  } else if (anyUnsure) {
    level = maxRisk(level, "yellow");
    findings.push(t("provisional.unsure"));
    nextSteps.push(t("provisional.step.limit"));
  }

  if (findings.length === 0) {
    findings.push(t("provisional.noFindings"));
    nextSteps.push(t("provisional.step.stay"));
  }

  // De-duplicate while preserving order.
  return {
    riskLevel: level,
    findings: Array.from(new Set(findings)),
    nextSteps: Array.from(new Set(nextSteps)),
  };
}
