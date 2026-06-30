// Flushes the offline outbox: submits queued assessments to the server, runs
// the AI analysis, records them in history, and removes them once synced.
// Triggered on app load, when the device comes back online, and when the tab
// regains focus. Safe to call repeatedly — a module-level lock prevents
// overlapping runs.

import { analyzeAssessment } from "./assessment.functions";
import { getDeviceId } from "./device-id";
import { addHistory } from "./history";
import {
  listOutbox,
  removeOutboxItem,
  updateOutboxItem,
  type OutboxItem,
} from "./outbox-store";

let flushing = false;

/** Build the analyze payload from a stored draft (mirrors the analyze screen). */
function buildPayload(item: OutboxItem) {
  const draft = item.draft;
  const p = draft.property;
  return {
    language: draft.language,
    deviceId: getDeviceId(),
    property: {
      address: p.address ?? "",
      state: p.state ?? "",
      municipality: p.municipality ?? "",
      buildingType: p.buildingType ?? "house",
      structuralType: p.structuralType ?? "unknown",
      floors: p.floors ?? 1,
      ...(typeof p.basements === "number" ? { basements: p.basements } : {}),
      age: p.age ?? "post2000",
      ...(typeof p.seismicIntensity === "number"
        ? {
            seismicIntensity: p.seismicIntensity,
            seismicIntensityRoman: p.seismicIntensityRoman,
          }
        : {}),
      ...(typeof p.pga === "number" ? { pga: p.pga } : {}),
      ...(typeof p.pgv === "number" ? { pgv: p.pgv } : {}),
      ...(typeof p.vs30 === "number" ? { vs30: p.vs30 } : {}),
      ...(p.soilClass ? { soilClass: p.soilClass } : {}),
      ...(typeof p.buildingPeriod === "number"
        ? { buildingPeriod: p.buildingPeriod }
        : {}),
      ...(typeof p.spectralDemand === "number"
        ? { spectralDemand: p.spectralDemand }
        : {}),
      ...(p.spectralBand ? { spectralBand: p.spectralBand } : {}),
    },
    answers: draft.answers.map((a) => ({
      id: a.id,
      value: a.value,
      photoDataUrls:
        a.photoDataUrls && a.photoDataUrls.length
          ? a.photoDataUrls
          : a.photoDataUrl
            ? [a.photoDataUrl]
            : [],
    })),
  };
}

/**
 * Submit a single outbox item. Returns the resulting publicId on success,
 * or null if it could not be completed (kept in the queue for a later retry).
 */
export async function syncOutboxItem(id: string): Promise<string | null> {
  const items = await listOutbox();
  const item = items.find((i) => i.id === id);
  if (!item || item.status === "synced") return item?.publicId ?? null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;

  await updateOutboxItem(id, { status: "syncing" });
  try {
    const result = await analyzeAssessment({ data: buildPayload(item) });
    if (result.ok) {
      addHistory({
        publicId: result.publicId,
        riskLevel: result.riskLevel,
        address: item.draft.property.address ?? "",
        language: item.draft.language,
        createdAt: new Date().toISOString(),
      });
      // Successfully synced — drop from the queue; it now lives in history.
      await removeOutboxItem(id);
      return result.publicId;
    }
    await updateOutboxItem(id, {
      status: "pending",
      attempts: item.attempts + 1,
      lastError: result.errorCode ?? "generic",
    });
    return null;
  } catch (e) {
    await updateOutboxItem(id, {
      status: "pending",
      attempts: item.attempts + 1,
      lastError: e instanceof Error ? e.message : "network",
    });
    return null;
  }
}

/** Try to flush every queued item. No-op when offline or already running. */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  flushing = true;
  try {
    const items = await listOutbox();
    for (const item of items) {
      if (item.status === "synced") continue;
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      await syncOutboxItem(item.id);
    }
  } finally {
    flushing = false;
  }
}

let started = false;

/** Wire automatic flushing to connectivity + focus events. Call once. */
export function startOutboxAutoSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const tryFlush = () => {
    void flushOutbox();
  };

  window.addEventListener("online", tryFlush);
  window.addEventListener("focus", tryFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryFlush();
  });

  // Initial attempt shortly after load so it doesn't compete with first paint.
  setTimeout(tryFlush, 2500);
}
