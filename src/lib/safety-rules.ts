// Deterministic, life-safety triage rules layered on top of the AI assessment.
// These encode professional rapid-triage heuristics that can OVERRIDE the AI:
// certain findings force "red" (unsafe to enter) regardless of the AI's call,
// and others force at least "yellow" (extra caution).

import type {
  AnswerValue,
  ChecklistAnswer,
  PropertyInfo,
  RiskLevel,
} from "./assessment-types";
import { translate, type Lang } from "./i18n";

const ORDER: RiskLevel[] = ["green", "yellow", "red"];

/** Return the more severe of two risk levels. */
export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return ORDER[Math.max(ORDER.indexOf(a), ORDER.indexOf(b))];
}

export type SafetyRuleResult = {
  /** rule floor — "green" when no rule fired */
  level: RiskLevel;
  /** plain-language reasons to surface to the resident */
  findings: string[];
  nextSteps: string[];
};

type AnswerLike = Pick<ChecklistAnswer, "id" | "value">;

/**
 * Structural-damage checklist items whose "yes" answers indicate observed
 * damage (liquefaction / pounding are handled by their own forced-red rules).
 */
const STRUCTURAL_DAMAGE_IDS = [
  "foundation",
  "exterior_walls",
  "interior_walls",
  "columns_beams",
  "doors_windows",
  "roof",
  "stairs",
] as const;

type SeismicProps = Pick<
  PropertyInfo,
  | "structuralType"
  | "floors"
  | "seismicIntensity"
  | "pga"
  | "spectralDemand"
  | "soilClass"
>;

export function evaluateSafetyRules(
  lang: Lang,
  property: SeismicProps,
  answers: AnswerLike[],
): SafetyRuleResult {
  const t = (k: string) => translate(lang, k);
  const answerOf = (id: string): AnswerValue | undefined =>
    answers.find((a) => a.id === id)?.value;

  let level: RiskLevel = "green";
  const findings: string[] = [];
  const nextSteps: string[] = [];

  const fireRed = (key: string) => {
    level = maxRisk(level, "red");
    findings.push(t(`rule.${key}.finding`));
    nextSteps.push(t(`rule.${key}.step`));
  };
  const fireCaution = (key: string) => {
    level = maxRisk(level, "yellow");
    findings.push(t(`rule.${key}.finding`));
    nextSteps.push(t(`rule.${key}.step`));
  };

  const mmi = property.seismicIntensity;
  const pga = property.pga;
  const sd = property.spectralDemand;
  const soil = property.soilClass;

  // Combined shaking severity from MMI (intensity) and PGA (acceleration).
  // PGA ~0.25g ≈ MMI VII–VIII; ~0.50g ≈ MMI VIII–IX. Use the worse of the two.
  const hasMmi = typeof mmi === "number";
  const hasPga = typeof pga === "number";
  const severeShaking = (hasMmi && mmi! >= 8) || (hasPga && pga! >= 0.5);
  const moderateShaking = (hasMmi && mmi! >= 6) || (hasPga && pga! >= 0.25);

  const anyStructuralYes = STRUCTURAL_DAMAGE_IDS.some(
    (id) => answerOf(id) === "yes",
  );

  // --- Force RED: not safe to enter ---
  if (property.structuralType === "URM") fireRed("urm");
  if (answerOf("liquefaction") === "yes") fireRed("liquefaction");
  if (answerOf("pounding") === "yes") fireRed("pounding");
  if (answerOf("plumbing") === "yes") fireRed("plumbing");
  // Strong shaking AND visible structural damage => life-safety red.
  if (severeShaking && anyStructuralYes) fireRed("combo_shaking");

  // --- Escalate to at least YELLOW: extra caution ---
  // Graduated ground-shaking caution (data-driven, MMI + PGA).
  if (severeShaking) fireCaution("intensity_severe");
  else if (moderateShaking) fireCaution("intensity");

  // Spectral demand AT THE BUILDING'S OWN PERIOD: how hard this building height
  // was shaken. >=0.4g is strong for typical residential buildings.
  if (typeof sd === "number" && sd >= 0.4) fireCaution("spectral");

  // Soft soils amplify shaking and raise liquefaction susceptibility.
  if (soil === "very_soft") fireCaution("softsoil_severe");
  else if (soil === "soft") fireCaution("softsoil");

  if (typeof property.floors === "number" && property.floors > 7) {
    fireCaution("floors");
  }
  if (
    property.structuralType === "CMF" ||
    property.structuralType === "CIW" ||
    property.structuralType === "PCF" ||
    property.structuralType === "RML"
  ) {
    fireCaution("structure");
  }

  return { level, findings, nextSteps };
}
