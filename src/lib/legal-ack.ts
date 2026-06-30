/**
 * Lightweight, client-only "I understand" acknowledgement for the legal
 * disclaimer. Stored in localStorage so a resident is asked once and never
 * interrupted again (avoids drop-off). No backend, no PII.
 */
const KEY = "evaluaya:legal-ack:v1";

export function hasLegalAck(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setLegalAck(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Ignore storage failures (private mode, quota) — disclaimer stays passive.
  }
}
