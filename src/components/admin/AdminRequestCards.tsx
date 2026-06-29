import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  RotateCcw,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type {
  AdminEngineer,
  AdminHelpRequest,
} from "@/lib/volunteers.functions";

export const STAGE_ORDER = [
  "claimed",
  "contacted",
  "visited",
  "resolved",
] as const;

export function RiskTag({ risk }: { risk: string | null }) {
  if (!risk) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        risk === "red"
          ? "bg-risk-red-soft text-risk-red"
          : risk === "orange"
            ? "bg-risk-orange-soft text-risk-orange"
            : risk === "yellow"
              ? "bg-risk-yellow-soft text-risk-yellow"
              : "bg-risk-green-soft text-risk-green",
      )}
    >
      {risk}
    </span>
  );
}

/** Hours elapsed since an ISO timestamp, rounded. */
export function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 3_600_000));
}

/**
 * Follow-through action card — the heart of the Seguimiento worklist.
 * Lets an admin reassign/push a specific engineer (covering-state ranked first)
 * and, for claimed requests, remind or return them to the pool.
 */
export function TriageCard({
  r,
  t,
  engineers,
  busy,
  onRemind,
  onReclaim,
  onReassign,
}: {
  r: AdminHelpRequest;
  t: (key: string) => string;
  engineers: AdminEngineer[];
  busy: boolean;
  onRemind: (id: string) => void;
  onReclaim: (id: string) => void;
  onReassign: (id: string, engineerId: string) => void;
}) {
  const location =
    [r.municipality, r.state].filter(Boolean).join(", ") || "—";
  const isClaimed = r.status === "claimed";
  const waited = hoursSince(r.status === "open" ? r.createdAt : r.claimedAt);
  // Rank engineers covering this state first.
  const ranked = [...engineers].sort((a, b) => {
    const aCov = r.state && a.states.includes(r.state) ? 0 : 1;
    const bCov = r.state && b.states.includes(r.state) ? 0 : 1;
    return aCov - bCov;
  });

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-3",
        r.stalled ? "border-risk-red/40 bg-risk-red-soft/30" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{location}</p>
        <div className="flex items-center gap-2">
          <RiskTag risk={r.riskLevel} />
          <span className="text-xs text-muted-foreground">
            {isClaimed ? t("admin.statusClaimed") : t("seg.openUnclaimed")}
          </span>
          {r.stalled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-risk-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-risk-red">
              <AlertTriangle className="size-3" aria-hidden />
              {t("admin.stalled")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <User className="size-3" aria-hidden />
          {t("admin.reqClaimedBy")}:{" "}
          <span className="font-medium text-foreground">
            {r.engineerName || t("admin.reqUnclaimed")}
          </span>
        </p>
        {waited != null && (
          <p className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {t("seg.waitingHours")}: {waited}
            {t("seg.hoursShort")}
          </p>
        )}
        {r.reclaimCount > 0 && (
          <p>
            {t("vadmin.remindersSent")}: {r.reclaimCount}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isClaimed && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onRemind(r.id)}
            >
              <Mail className="size-4" />
              {t("vadmin.remind")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onReclaim(r.id)}
            >
              <RotateCcw className="size-4" />
              {t("vadmin.reclaim")}
            </Button>
          </>
        )}
        <select
          aria-label={isClaimed ? t("vadmin.reassign") : t("seg.assign")}
          disabled={busy || ranked.length === 0}
          defaultValue=""
          onChange={(ev) => {
            const id = ev.target.value;
            if (id) {
              onReassign(r.id, id);
              ev.target.value = "";
            }
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
        >
          <option value="" disabled>
            {isClaimed ? t("vadmin.reassignPick") : t("seg.assign")}
          </option>
          {ranked.map((e) => {
            const covers = r.state && e.states.includes(r.state);
            return (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.organization ? ` · ${e.organization}` : ""} —{" "}
                {covers ? t("vadmin.coversState") : t("vadmin.noCoverage")}
              </option>
            );
          })}
        </select>
      </div>

      {r.note && (
        <p className="mt-2 text-xs italic text-muted-foreground">
          {t("admin.reqResidentNote")}: {r.note}
        </p>
      )}
    </div>
  );
}

/** Read-only request card used in the full requests list. */
export function HelpRequestCard({
  r,
  t,
}: {
  r: AdminHelpRequest;
  t: (key: string) => string;
}) {
  const stage = r.progressStage ?? (r.status === "open" ? null : "claimed");
  const stageIndex = stage ? STAGE_ORDER.indexOf(stage as never) : -1;
  const location =
    [r.municipality, r.state].filter(Boolean).join(", ") || "—";

  const statusLabel =
    r.status === "open"
      ? t("admin.statusOpen")
      : r.status === "closed"
        ? t("admin.statusClosed")
        : t("admin.statusClaimed");

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-3",
        r.stalled ? "border-risk-red/40 bg-risk-red-soft/30" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{location}</p>
        <div className="flex items-center gap-2">
          <RiskTag risk={r.riskLevel} />
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
          {r.stalled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-risk-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-risk-red">
              <AlertTriangle className="size-3" aria-hidden />
              {t("admin.stalled")}
            </span>
          )}
        </div>
      </div>

      {r.status !== "open" && (
        <div className="mt-3 flex items-center gap-1">
          {STAGE_ORDER.map((s, i) => {
            const done = stageIndex >= i;
            return (
              <div key={s} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full",
                    done ? "bg-primary" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wide",
                    done ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(
                    s === "claimed"
                      ? "admin.stageClaimed"
                      : s === "contacted"
                        ? "admin.stageContacted"
                        : s === "visited"
                          ? "admin.stageVisited"
                          : "admin.stageResolved",
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <User className="size-3" aria-hidden />
          {t("admin.reqClaimedBy")}:{" "}
          <span className="font-medium text-foreground">
            {r.engineerName || t("admin.reqUnclaimed")}
          </span>
        </p>
        {r.claimedAt && (
          <p>
            {t("admin.reqClaimedAt")}: {formatDateTime(r.claimedAt)}
          </p>
        )}
        {r.progressUpdatedAt && (
          <p>
            {t("admin.reqUpdatedAt")}: {formatDateTime(r.progressUpdatedAt)}
          </p>
        )}
        {r.engineerVerdict && (
          <p className="flex items-center gap-1 text-foreground">
            <CheckCircle2 className="size-3 text-risk-green" aria-hidden />
            {r.engineerVerdict === "agree"
              ? t("admin.reqVerdictAgree")
              : t("admin.reqVerdictAdjust")}
            {r.priorRiskLevel && r.engineerVerdict === "adjust"
              ? ` (${r.priorRiskLevel} → ${r.riskLevel})`
              : ""}
          </p>
        )}
        {r.note && (
          <p className="italic">
            {t("admin.reqResidentNote")}: {r.note}
          </p>
        )}
        {r.engineerNote && (
          <p className="italic text-foreground">
            {t("admin.reqEngineerNote")}: {r.engineerNote}
          </p>
        )}
      </div>
    </div>
  );
}
