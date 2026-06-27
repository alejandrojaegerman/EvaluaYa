import { getDeviceId } from "./device-id";
import { trackFunnelStep, type FunnelStep } from "./funnel.functions";

const LANG_KEY = "evaluaya.lang";

/**
 * Fire-and-forget funnel step tracking. Never blocks the UI and never throws:
 * - no-ops during SSR (no `window`)
 * - no-ops when offline so low-bandwidth users are never slowed down
 * - failures are swallowed
 */
export function trackStep(step: FunnelStep): void {
  if (typeof window === "undefined") return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const deviceId = getDeviceId();
  if (!deviceId) return;

  let language: string | undefined;
  try {
    language = window.localStorage.getItem(LANG_KEY) ?? undefined;
  } catch {
    language = undefined;
  }

  // Intentionally not awaited — tracking is best-effort background work.
  void trackFunnelStep({
    data: { deviceId, step, ...(language ? { language } : {}) },
  }).catch(() => {});
}
