import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RISK_THEME } from "@/lib/risk";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  getResidentRequestStatus,
  residentConfirmRequest,
  type ResidentRequestStatus,
} from "@/lib/volunteers.functions";

export const Route = createFileRoute("/seguimiento/$token")({
  head: () => ({
    meta: [
      { title: "Seguimiento de tu solicitud — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackingPage,
});

const STAGES = [
  "received",
  "claimed",
  "contacted",
  "visited",
  "resolved",
] as const;
type Stage = (typeof STAGES)[number];

/** Highest stage the request has reached (0 = received). */
function reachedIndex(s: ResidentRequestStatus): number {
  let idx = 0; // received is always done
  if (s.status === "claimed" || s.status === "closed") idx = Math.max(idx, 1);
  const byStage: Record<string, number> = {
    claimed: 1,
    contacted: 2,
    visited: 3,
    resolved: 4,
  };
  if (s.progressStage && byStage[s.progressStage] != null) {
    idx = Math.max(idx, byStage[s.progressStage]);
  }
  if (s.status === "closed") idx = Math.max(idx, 4);
  return idx;
}

function TrackingPage() {
  const { token } = Route.useParams();
  const { t } = useLang();
  const fetchStatus = useServerFn(getResidentRequestStatus);
  const confirm = useServerFn(residentConfirmRequest);

  const [status, setStatus] = useState<ResidentRequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStatus({ data: { token } });
      setStatus(res);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [fetchStatus, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onConfirm(resolved: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await confirm({ data: { token, resolved } });
      if (res.ok) {
        toast.success(
          resolved
            ? t("track.confirmedResolved")
            : t("track.confirmedReopened"),
        );
        await load();
      } else {
        toast.error(t("track.confirmError"));
      }
    } catch {
      toast.error(t("track.confirmError"));
    } finally {
      setBusy(false);
    }
  }

  const reached = status ? reachedIndex(status) : 0;
  const location =
    [status?.municipality, status?.state].filter(Boolean).join(", ") || "—";
  // Offer the confirm controls once a volunteer has engaged, until the resident
  // confirms it's resolved.
  const showConfirm =
    !!status &&
    reached >= 1 &&
    status.residentConfirmedOutcome !== "resolved";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-display text-xl font-bold">{t("track.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("track.subtitle")}
        </p>

        {loading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 animate-pulse" aria-hidden />
            {t("track.loading")}
          </p>
        ) : !status ? (
          <p className="mt-8 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t("track.notFound")}
          </p>
        ) : (
          <>
            {/* Summary */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="flex items-center gap-2 text-foreground/80">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="font-medium">{t("track.location")}:</span>{" "}
                {location}
              </p>
              {status.riskLevel && (
                <p className="mt-2 flex items-center gap-2 text-foreground/80">
                  <span
                    className={cn(
                      "inline-block size-3 rounded-full",
                      RISK_THEME[status.riskLevel].dot,
                    )}
                    aria-hidden
                  />
                  <span className="font-medium">{t("track.risk")}:</span>{" "}
                  {t(`result.${status.riskLevel}.tag`)}
                </p>
              )}
            </div>

            {/* Timeline */}
            <ol className="mt-6 space-y-4">
              {STAGES.map((stage: Stage, i) => {
                const done = i <= reached;
                const current = i === reached && status.status !== "closed";
                return (
                  <li key={stage} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {done ? (
                        <CheckCircle2
                          className="size-5 text-risk-green"
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          className="size-5 text-muted-foreground/40"
                          aria-hidden
                        />
                      )}
                      {i < STAGES.length - 1 && (
                        <span
                          className={cn(
                            "mt-1 w-px flex-1",
                            i < reached ? "bg-risk-green/50" : "bg-border",
                          )}
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          done ? "text-foreground" : "text-muted-foreground",
                          current && "text-primary",
                        )}
                      >
                        {t(`track.stage.${stage}`)}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {t(`track.stage.${stage}.desc`)}
                      </p>
                      {stage === "claimed" &&
                        done &&
                        status.engineerName && (
                          <p className="mt-0.5 text-xs font-medium text-foreground/70">
                            {status.engineerName}
                          </p>
                        )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {reached < 1 && (
              <p className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {t("track.waiting")}
              </p>
            )}

            {/* Resident confirmation loop */}
            {showConfirm && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-bold">{t("track.confirmTitle")}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("track.confirmBody")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => onConfirm(true)}
                    disabled={busy}
                    className="flex-1"
                  >
                    {t("track.confirmYes")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onConfirm(false)}
                    disabled={busy}
                    className="flex-1"
                  >
                    {t("track.confirmNo")}
                  </Button>
                </div>
              </div>
            )}

            {status.residentConfirmedOutcome === "resolved" && (
              <p className="mt-6 flex items-center gap-2 rounded-xl border border-risk-green/30 bg-risk-green-soft/50 p-3 text-sm font-medium text-risk-green">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                {t("track.confirmedResolved")}
              </p>
            )}

            {/* Independence disclaimer */}
            <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("track.disclaimer")}
            </p>

            {status.assessmentPublicId && (
              <Link
                to="/a/$publicId"
                params={{ publicId: status.assessmentPublicId }}
                className="mt-4 block text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                {t("track.viewReport")}
              </Link>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
