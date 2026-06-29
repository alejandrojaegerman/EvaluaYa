import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import { TriageCard } from "@/components/admin/AdminRequestCards";
import { useLang } from "@/lib/i18n";
import type {
  AdminEngineer,
  AdminHelpRequest,
  AdminMatchingProgress,
} from "@/lib/volunteers.functions";

const URGENT = new Set(["red", "orange"]);

// Sort: urgent risk first, then stalled before open, then oldest first so the
// most-overdue urgent case always floats to the very top.
function priority(r: AdminHelpRequest): number {
  let score = 0;
  if (r.riskLevel === "red") score += 400;
  else if (r.riskLevel === "orange") score += 300;
  else if (r.riskLevel === "yellow") score += 100;
  if (r.stalled) score += 50;
  if (r.status === "open") score += 25;
  return score;
}

export function SeguimientoPanel({
  requests,
  engineers,
  progress,
  busy,
  onRemind,
  onReclaim,
  onReassign,
}: {
  requests: AdminHelpRequest[];
  engineers: AdminEngineer[];
  progress: AdminMatchingProgress | null;
  busy: boolean;
  onRemind: (id: string) => void;
  onReclaim: (id: string) => void;
  onReassign: (id: string, engineerId: string) => void;
}) {
  const { t } = useLang();

  // Worklist: open (waiting for a volunteer) or claimed-but-stalled.
  const worklist = useMemo(
    () =>
      requests
        .filter(
          (r) => r.status === "open" || (r.status === "claimed" && r.stalled),
        )
        .sort(
          (a, b) =>
            priority(b) - priority(a) ||
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
    [requests],
  );

  const urgent = worklist.filter((r) => URGENT.has(r.riskLevel ?? ""));
  const others = worklist.filter((r) => !URGENT.has(r.riskLevel ?? ""));

  const approvedEngineers = useMemo(
    () => engineers.filter((e) => e.status === "approved" && e.accessToken),
    [engineers],
  );

  const openUrgent = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "open" && URGENT.has(r.riskLevel ?? ""),
      ).length,
    [requests],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold">{t("seg.title")}</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
          {worklist.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("seg.hint")}</p>

      {/* At-a-glance counters */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Counter
          label={t("seg.urgent")}
          value={urgent.length}
          tone={urgent.length > 0 ? "red" : undefined}
        />
        <Counter
          label={t("seg.openUnclaimed")}
          value={openUrgent}
          tone={openUrgent > 0 ? "red" : undefined}
        />
        <Counter
          label={t("admin.stalled")}
          value={progress?.stalled ?? 0}
          tone={(progress?.stalled ?? 0) > 0 ? "red" : undefined}
        />
      </div>

      {worklist.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-risk-green">
          {t("seg.empty")}
        </p>
      ) : (
        <>
          {urgent.length > 0 && (
            <section className="mt-5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-risk-red">
                <AlertTriangle className="size-4" aria-hidden />
                {t("seg.urgent")} ({urgent.length})
              </h3>
              <div className="mt-2 space-y-3">
                {urgent.map((r) => (
                  <TriageCard
                    key={r.id}
                    r={r}
                    t={t}
                    engineers={approvedEngineers}
                    busy={busy}
                    onRemind={onRemind}
                    onReclaim={onReclaim}
                    onReassign={onReassign}
                  />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="mt-5">
              <h3 className="text-sm font-bold text-muted-foreground">
                {t("seg.others")} ({others.length})
              </h3>
              <div className="mt-2 space-y-3">
                {others.map((r) => (
                  <TriageCard
                    key={r.id}
                    r={r}
                    t={t}
                    engineers={approvedEngineers}
                    busy={busy}
                    onRemind={onRemind}
                    onReclaim={onReclaim}
                    onReassign={onReassign}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p
        className={
          tone === "red"
            ? "font-display text-2xl font-extrabold leading-none text-risk-red"
            : "font-display text-2xl font-extrabold leading-none text-foreground"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
