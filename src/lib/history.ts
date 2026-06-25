import type { RiskLevel } from "./assessment-types";
import type { Lang } from "./i18n";

const HISTORY_KEY = "evaluaya.history.v1";
const MAX_ITEMS = 25;

export type HistoryEntry = {
  publicId: string;
  riskLevel: RiskLevel;
  address: string;
  language: Lang;
  createdAt: string;
};

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: HistoryEntry): void {
  try {
    const existing = getHistory().filter((e) => e.publicId !== entry.publicId);
    const next = [entry, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
