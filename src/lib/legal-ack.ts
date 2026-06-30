/**
 * Versioned legal acknowledgement + data-consent gate.
 *
 * The lawyer's notes (Doc #1) require a *blocking* legal notice that the user
 * must read and accept, plus an explicit consent to process their personal data
 * for report management. We store both, with the version that was accepted, so a
 * future change to the legal text re-prompts the user. Stored client-side to
 * avoid drop-off; the accepted versions + timestamp are ALSO persisted with the
 * assessment (see assessments.legal_version / consent_version) for legal record.
 */

/** Bump when the legal notice text changes — re-prompts every user. */
export const LEGAL_VERSION = "2026-06-30";
/** Bump when the data-consent wording changes — re-prompts every user. */
export const CONSENT_VERSION = "2026-06-30";

const KEY = "evaluaya:legal-consent:v2";

export type LegalConsent = {
  legalVersion: string;
  consentVersion: string;
  /** ISO timestamp of acceptance */
  at: string;
};

/** Read the stored acceptance, if any. */
export function getLegalConsent(): LegalConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LegalConsent>;
    if (!parsed?.legalVersion || !parsed?.consentVersion || !parsed?.at)
      return null;
    return parsed as LegalConsent;
  } catch {
    return null;
  }
}

/**
 * True only when the user has accepted the *current* legal + consent versions.
 * Any version mismatch (text updated) returns false so the gate re-appears.
 */
export function hasLegalConsent(): boolean {
  const c = getLegalConsent();
  return (
    !!c &&
    c.legalVersion === LEGAL_VERSION &&
    c.consentVersion === CONSENT_VERSION
  );
}

/** Persist acceptance of the current versions and return the record. */
export function setLegalConsent(): LegalConsent {
  const record: LegalConsent = {
    legalVersion: LEGAL_VERSION,
    consentVersion: CONSENT_VERSION,
    at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(record));
    } catch {
      // Ignore storage failures (private mode, quota) — gate will re-show.
    }
  }
  return record;
}

/* ── Backwards-compatible helpers (legacy passive disclaimer call sites) ── */

/** @deprecated use {@link hasLegalConsent}. Kept for older call sites. */
export function hasLegalAck(): boolean {
  return hasLegalConsent();
}

/** @deprecated use {@link setLegalConsent}. Kept for older call sites. */
export function setLegalAck(): void {
  setLegalConsent();
}
