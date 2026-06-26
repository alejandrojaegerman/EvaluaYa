// Phone helpers shared by client and server. Dependency-free so it is safe in
// the Worker SSR runtime and the browser bundle alike.
//
// WhatsApp deep links (https://wa.me/<number>) require the full international
// number: country code, no leading zero, digits only. Residents in Venezuela
// usually type a local number (e.g. "0414 123 4567"), which is NOT a valid
// wa.me target. This normalizer converts those to E.164-style digits, defaulting
// to Venezuela (+58) while preserving numbers that already carry a country code.

const VE = "58";

/** Keep only digits. */
export function digitsOnly(raw: string): string {
  return (raw ?? "").replace(/[^\d]/g, "");
}

/**
 * Convert a phone number to WhatsApp/E.164 digits (no "+"), defaulting to the
 * Venezuela country code. Numbers that already include a country code are kept.
 */
export function toWhatsappNumber(raw: string, defaultCc: string = VE): string {
  const d = digitsOnly(raw);
  if (!d) return "";

  // Already Venezuelan international form: 58 + 10 local digits.
  if (d.startsWith(defaultCc) && d.length >= defaultCc.length + 10) return d;

  // Local form with leading trunk "0": 0XXXXXXXXXX -> 58XXXXXXXXXX
  if (d.startsWith("0")) return defaultCc + d.slice(1);

  // 10-digit local mobile/landline without the trunk 0 (e.g. 4141234567).
  if (d.length === 10 && (d.startsWith("4") || d.startsWith("2"))) {
    return defaultCc + d;
  }

  // Otherwise assume it already carries some country code (e.g. Argentina 54…).
  return d;
}

/** True when the normalized number looks like a plausible international number. */
export function isValidWhatsappNumber(raw: string): boolean {
  const n = toWhatsappNumber(raw);
  return n.length >= 7 && n.length <= 15;
}
