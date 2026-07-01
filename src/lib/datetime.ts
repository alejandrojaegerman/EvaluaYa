// ---------------------------------------------------------------------------
// Centralized date/time formatting. Everything user-facing is rendered in
// US Eastern time (America/New_York) so dates/times are consistent across
// devices regardless of the viewer's local timezone.
// ---------------------------------------------------------------------------

export const APP_TIME_ZONE = "America/New_York";

type Lang = "es" | "en";

function locale(lang: Lang): string {
  return lang === "es" ? "es-VE" : "en-US";
}

function toDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date + time of an instant, forced to Eastern, with an "ET" marker. */
export function formatDateTime(
  value: string | number | Date,
  lang: Lang = "es",
): string {
  const d = toDate(value);
  if (!d) return "";
  const formatted = new Intl.DateTimeFormat(locale(lang), {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  // Normalize narrow/no-break spaces: Node (server) and browser ICU builds
  // emit different space characters here, which breaks SSR hydration.
  return `${formatted} ET`.replace(/[\u202f\u00a0]/g, " ");
}

/** Date only of an instant, forced to Eastern. */
export function formatDate(
  value: string | number | Date,
  lang: Lang = "es",
): string {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Short month/day label for a plain `YYYY-MM-DD` calendar string (e.g. from a
 * SQL `date` column already bucketed in Eastern). Parsed as a calendar date so
 * it is NOT shifted by UTC parsing.
 */
export function formatDayLabel(dayStr: string, lang: Lang = "es"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dayStr);
  if (!m) return dayStr;
  const [, y, mo, da] = m;
  // Construct at noon UTC and render in UTC so the calendar date is preserved.
  const d = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(da), 12));
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(d);
}
