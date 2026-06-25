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

export function evaluateSafetyRules(
  lang: Lang,
  property: Pick<PropertyInfo, "structuralType" | "floors" | "seismicIntensity">,
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

  // --- Force RED: not safe to enter ---
  if (property.structuralType === "URM") fireRed("urm");
  if (answerOf("liquefaction") === "yes") fireRed("liquefaction");
  if (answerOf("pounding") === "yes") fireRed("pounding");
  if (answerOf("plumbing") === "yes") fireRed("plumbing");

  // --- Escalate to at least YELLOW: extra caution ---
  if (typeof property.seismicIntensity === "number" && property.seismicIntensity >= 7) {
    fireCaution("intensity");
  }
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
