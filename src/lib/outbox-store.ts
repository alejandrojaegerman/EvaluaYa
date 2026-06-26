// Offline outbox: completed assessments that could not be submitted yet (no
// connection, or a failed submit). Each item carries the full draft (answers +
// in-browser photo data URLs) plus a provisional result so the resident always
// has a recommendation. Items are flushed automatically by outbox-sync when the
// device comes back online.

import { get, set } from "idb-keyval";

import type { AssessmentDraft } from "./draft-store";
import type { ProvisionalResult } from "./provisional";

const OUTBOX_KEY = "evaluaya.outbox.v1";

/** Fired (window event) whenever the outbox contents change, for live UI. */
export const OUTBOX_EVENT = "evaluaya:outbox-changed";

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export type OutboxItem = {
  id: string;
  draft: AssessmentDraft;
  provisional: ProvisionalResult;
  status: OutboxStatus;
  attempts: number;
  createdAt: number;
  /** populated once the assessment syncs and gets a server id */
  publicId?: string;
  lastError?: string;
};

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OUTBOX_EVENT));
  }
}

export async function listOutbox(): Promise<OutboxItem[]> {
  try {
    const items = await get<OutboxItem[]>(OUTBOX_KEY);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: OutboxItem[]): Promise<void> {
  try {
    await set(OUTBOX_KEY, items);
    emitChange();
  } catch {
    /* storage unavailable */
  }
}

/** Items still waiting to reach the server (pending or failed). */
export async function pendingCount(): Promise<number> {
  const items = await listOutbox();
  return items.filter((i) => i.status !== "synced").length;
}

export async function enqueueOutbox(
  draft: AssessmentDraft,
  provisional: ProvisionalResult,
): Promise<OutboxItem> {
  const item: OutboxItem = {
    id:
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    draft,
    provisional,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  };
  const items = await listOutbox();
  await writeOutbox([item, ...items]);
  return item;
}

export async function updateOutboxItem(
  id: string,
  patch: Partial<OutboxItem>,
): Promise<void> {
  const items = await listOutbox();
  await writeOutbox(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export async function removeOutboxItem(id: string): Promise<void> {
  const items = await listOutbox();
  await writeOutbox(items.filter((i) => i.id !== id));
}

export async function getOutboxItem(id: string): Promise<OutboxItem | null> {
  const items = await listOutbox();
  return items.find((i) => i.id === id) ?? null;
}
