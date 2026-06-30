import { get, set, del } from "idb-keyval";

import type { DraftAnswer, PropertyInfo } from "./assessment-types";
import type { Lang } from "./i18n";

const DRAFT_KEY = "evaluaya.draft.v1";

export type DraftStatus = "in_progress" | "ready_to_send";

export type ResidentContactType = "whatsapp" | "phone" | "email";

export type AssessmentDraft = {
  language: Lang;
  property: Partial<PropertyInfo>;
  answers: DraftAnswer[];
  status?: DraftStatus;
  /** Engineer panel access token — set when an engineer runs a certified eval. */
  engineerToken?: string;
  /** Minimal resident contact so a volunteer evaluator can reach them. PII. */
  resident?: {
    name?: string;
    contact?: string;
    contactType?: ResidentContactType;
  };
  /** Accepted legal notice + data-consent versions (blocking gate, Doc #1). */
  consent?: {
    legalVersion: string;
    consentVersion: string;
    at: string;
  };
  updatedAt: number;
};


/** A draft that has all answers filled and is just waiting to be submitted. */
export function isReadyToSend(draft: AssessmentDraft | null): boolean {
  return !!draft && draft.status === "ready_to_send";
}

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
