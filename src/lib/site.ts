/**
 * Canonical, absolute base URL of the published site.
 *
 * og:image / twitter:image MUST be absolute URLs for WhatsApp, Facebook and X
 * to render link previews — relative paths are ignored by those crawlers.
 *
 * ⚠️ If the production domain changes, update this single constant (or set
 * `VITE_SITE_URL`) so all social link previews keep working.
 */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://evaluaya.app";

/** Build an absolute URL for a site-relative path (e.g. "/og-map.jpg"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * UTM parameters for attribution. We tag every link the app emits when a user
 * shares it (or that we send in app emails) so analytics can distinguish the
 * channel + surface that drove each visit instead of lumping them into
 * "Direct". `og:url`/`canonical` tags MUST stay clean — never run them through
 * this helper, or canonicalization breaks.
 */
export type Utm = {
  /** Channel: whatsapp | native | copy | image | email */
  source: string;
  /** Loop type: share | email */
  medium: string;
  /** Surface/context: app_share | result | map | data | volunteer_panel | help_request */
  campaign: string;
  content?: string;
};

/** Append UTM params to a site-relative path and return an absolute URL. */
export function withUtm(path: string, utm: Utm): string {
  const url = new URL(absoluteUrl(path));
  url.searchParams.set("utm_source", utm.source);
  url.searchParams.set("utm_medium", utm.medium);
  url.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) url.searchParams.set("utm_content", utm.content);
  return url.toString();
}
