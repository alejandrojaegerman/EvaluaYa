import type { RiskLevel } from "./assessment-types";

type RiskTheme = {
  tagKey: string;
  actionKey: string;
  /** tailwind classes using semantic risk tokens */
  badge: string;
  soft: string;
  text: string;
  ring: string;
  dot: string;
};

export const RISK_THEME: Record<RiskLevel, RiskTheme> = {
  green: {
    tagKey: "result.green.tag",
    actionKey: "result.green.action",
    badge: "bg-risk-green text-risk-green-foreground",
    soft: "bg-risk-green-soft",
    text: "text-risk-green",
    ring: "ring-risk-green/30",
    dot: "bg-risk-green",
  },
  yellow: {
    tagKey: "result.yellow.tag",
    actionKey: "result.yellow.action",
    badge: "bg-risk-yellow text-risk-yellow-foreground",
    soft: "bg-risk-yellow-soft",
    text: "text-risk-yellow",
    ring: "ring-risk-yellow/40",
    dot: "bg-risk-yellow",
  },
  red: {
    tagKey: "result.red.tag",
    actionKey: "result.red.action",
    badge: "bg-risk-red text-risk-red-foreground",
    soft: "bg-risk-red-soft",
    text: "text-risk-red",
    ring: "ring-risk-red/30",
    dot: "bg-risk-red",
  },
};

/** Hex values used for the generated PDF (jsPDF needs rgb) */
export const RISK_HEX: Record<RiskLevel, [number, number, number]> = {
  green: [22, 128, 80],
  yellow: [202, 138, 4],
  red: [190, 40, 35],
};

export function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "green" || value === "yellow" || value === "red";
}
