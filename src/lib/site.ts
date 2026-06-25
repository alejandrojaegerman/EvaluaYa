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
