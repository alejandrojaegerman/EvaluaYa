import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";
import { flushOutbox } from "@/lib/outbox-sync";
import { OUTBOX_EVENT, pendingCount } from "@/lib/outbox-store";
import { cn } from "@/lib/utils";

/**
 * Calm, persistent connection + sync indicator. Shows when the device is
 * offline or when assessments are still waiting to be sent. Lets the resident
 * trigger a manual sync when they're back online.
 */
export function OfflineBanner() {
  const { t } = useLang();
  const online = useOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void pendingCount().then((n) => {
        if (active) setPending(n);
      });
    };
    refresh();
    window.addEventListener(OUTBOX_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(OUTBOX_EVENT, refresh);
    };
  }, []);

  // Auto-clear the "syncing" spinner once the queue drains.
  useEffect(() => {
    if (pending === 0) setSyncing(false);
  }, [pending]);

  if (online && pending === 0) return null;

  async function handleSync() {
    setSyncing(true);
    await flushOutbox();
    const n = await pendingCount();
    setPending(n);
    if (n === 0) setSyncing(false);
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-sm px-4 pt-3",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
          online
            ? "border-risk-yellow/30 bg-risk-yellow-soft text-foreground"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {online ? (
          <CloudOff className="size-4 shrink-0 text-risk-yellow" aria-hidden />
        ) : (
          <WifiOff className="size-4 shrink-0" aria-hidden />
        )}
        <p className="flex-1 leading-snug">
          {!online
            ? t("offline.banner")
            : pending === 1
              ? t("offline.pendingOne")
              : t("offline.pendingMany").replace("{n}", String(pending))}
        </p>
        {online && pending > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <RefreshCw
              className={cn("size-3.5", syncing && "animate-spin")}
              aria-hidden
            />
            {t("offline.syncNow")}
          </button>
        )}
      </div>
    </div>
  );
}
