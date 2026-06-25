const DEVICE_ID_KEY = "evaluaya.device.v1";

/**
 * Stable, non-PII random identifier persisted in localStorage. Combined
 * server-side with the request IP for rate limiting. Safe to send to the server.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
