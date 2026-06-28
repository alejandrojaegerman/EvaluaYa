/**
 * Pure helpers for building engineer panel links with consistent UTM tagging.
 *
 * Kept dependency-free (no server imports) so it can be unit-tested directly
 * and reused by both the digest job and the access-email sender.
 */

export const APP_ROOT = "https://evaluaya.app";

/** Campaigns we attribute panel link clicks to, by surface. */
export type PanelLinkCampaign =
  | "volunteer_panel"
  | "help_digest"
  | "help_reminder";

/**
 * Build an absolute engineer-panel URL for `token`, tagged with email UTMs so
 * traffic from access emails and daily digests is attributable in analytics.
 */
export function engineerPanelUrl(
  token: string,
  campaign: PanelLinkCampaign = "volunteer_panel",
  root: string = APP_ROOT,
): string {
  const u = new URL(`${root}/voluntarios/panel/${token}`);
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
