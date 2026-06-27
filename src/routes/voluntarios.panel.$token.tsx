import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  HardHat,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EngineerRequestCard } from "@/components/EngineerRequestCard";
import { Button } from "@/components/ui/button";
import type { RiskLevel } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { toWhatsappNumber } from "@/lib/phone";
import {
  getEngineerPanel,
  claimHelpRequest,
  updateRequestProgress,
  submitEngineerVerdict,
  type EngineerPanel,
  type ProgressStage,
} from "@/lib/volunteers.functions";


export const Route = createFileRoute("/voluntarios/panel/$token")({
  head: () => ({
    meta: [
      { title: "Panel de ingeniero — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PanelPage,
});

function PanelPage() {
  const { token } = Route.useParams();
  const { t } = useLang();
  const fetchPanel = useServerFn(getEngineerPanel);
  const claim = useServerFn(claimHelpRequest);
  const progress = useServerFn(updateRequestProgress);
  const verdict = useServerFn(submitEngineerVerdict);

  const [panel, setPanel] = useState<EngineerPanel | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPanel({ data: { token } });
      if (res && "expired" in res) {
        setExpired(true);
        setPanel(null);
      } else {
        setExpired(false);
        setPanel(res);
      }
    } catch {
      setPanel(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPanel, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onClaim(id: string) {
    setActingId(id);
    try {
      const res = await claim({ data: { token, requestId: id } });
      if (res.ok) await load();
      else toast.error(t("result.genericError"));
    } finally {
      setActingId(null);
    }
  }

  async function onProgress(id: string, stage: ProgressStage, note: string) {
    if (stage === "claimed") return;
    setActingId(id);
    try {
      const res = await progress({
        data: { token, requestId: id, stage, note },
      });
      if (res.ok) {
        toast.success(t("panel.progressSaved"));
        await load();
      } else toast.error(t("result.genericError"));
    } finally {
      setActingId(null);
    }
  }

  async function onVerdict(
    id: string,
    v: "agree" | "adjust",
    level: RiskLevel | undefined,
    notes: string,
  ) {
    setActingId(id);
    try {
      const res = await verdict({
        data: { token, requestId: id, verdict: v, level, notes },
      });
      if (res.ok) {
        toast.success(t("panel.verdictSaved"));
        await load();
      } else toast.error(t("result.genericError"));
    } finally {
      setActingId(null);
    }
  }

  function contactResident(phone: string) {
    const text = t("panel.waResident");
    const number = toWhatsappNumber(phone);
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }


  function ageLabel(createdAt: string): string {
    const ms = Date.now() - new Date(createdAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "";
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) return t("panel.ageNew");
    if (hours < 24) return `${t("panel.ageWaiting")} ${hours}h`;
    const days = Math.floor(hours / 24);
    return `${t("panel.ageWaiting")} ${days}${t("panel.ageDays")}`;
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          …
        </div>
      </AppShell>
    );
  }

  if (expired) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <AlertCircle className="size-12 text-amber-500" aria-hidden />
          <p className="mt-4 text-lg font-semibold">{t("panel.expired")}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t("panel.expiredBody")}
          </p>
          <Link to="/" className="mt-6">
            <Button variant="outline">{t("result.goHome")}</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!panel) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <AlertCircle className="size-12 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-lg font-semibold">{t("panel.invalid")}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t("panel.invalidBody")}
          </p>
          <Link to="/" className="mt-6">
            <Button variant="outline">{t("result.goHome")}</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-7 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-2">
          <HardHat className="size-6" aria-hidden />
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            {t("panel.title")}
          </h1>
        </div>
        <p className="mt-2 text-sm text-primary-foreground/85">
          {t("panel.welcome")}, {panel.engineer.name}
          {panel.engineer.organization
            ? ` · ${panel.engineer.organization}`
            : ""}
        </p>
        <p className="mt-1 text-xs text-primary-foreground/70">
          {t("panel.coverage")}: {panel.engineer.states.join(", ")}
        </p>
        {panel.engineer.specialization && (
          <p className="mt-0.5 text-xs text-primary-foreground/70">
            {t("panel.specialization")}: {panel.engineer.specialization}
          </p>
        )}
      </section>

      {/* Run a certified professional evaluation */}
      <section className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">
            {t("panel.proTitle")}
          </h2>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("panel.proBody")}
        </p>
        <Link
          to="/assess/property"
          search={{ eng: token }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("panel.startPro")}
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">
          {t("panel.openRequests")} ({panel.requests.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={load}>
          <RotateCcw className="size-4" />
          {t("panel.refresh")}
        </Button>
      </div>

      {panel.requests.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {t("panel.empty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {panel.requests.map((r) => (
            <EngineerRequestCard
              key={r.id}
              r={r}
              acting={actingId === r.id}
              onClaim={onClaim}
              onContact={contactResident}
              onProgress={onProgress}
              onVerdict={onVerdict}
              ageLabel={ageLabel}
            />
          ))}
        </ul>
      )}
    </AppShell>
  );
}

