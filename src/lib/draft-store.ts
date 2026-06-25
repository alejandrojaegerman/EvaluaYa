import { get, set, del } from "idb-keyval";

import type { DraftAnswer, PropertyInfo } from "./assessment-types";
import type { Lang } from "./i18n";

const DRAFT_KEY = "evaluaya.draft.v1";

export type AssessmentDraft = {
  language: Lang;
  property: Partial<PropertyInfo>;
  answers: DraftAnswer[];
  updatedAt: number;
};

export async function loadDraft(): Promise<AssessmentDraft | null> {
  try {
    const draft = await get<AssessmentDraft>(DRAFT_KEY);
    return draft ?? null;
  } catch {
    return null;
  }
}

export async function saveDraft(draft: AssessmentDraft): Promise<void> {
  try {
    await set(DRAFT_KEY, { ...draft, updatedAt: Date.now() });
  } catch {
    /* storage unavailable — draft just won't persist */
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await del(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
