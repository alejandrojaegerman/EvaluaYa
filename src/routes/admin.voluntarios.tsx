import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Lock,
  Mail,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/datetime";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { toWhatsappNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  adminListEngineers,
  adminReviewEngineer,
  adminResendAccessLink,
  adminRotateAccessLink,
  adminListHelpRequests,
  adminRemindEngineer,
  adminReclaimRequest,
  adminReassignRequest,
  type AdminEngineer,
  type AdminHelpRequest,
  type AdminMatchingProgress,
} from "@/lib/volunteers.functions";

type RequestFilter = "all" | "open" | "claimed" | "stalled" | "resolved";

export const Route = createFileRoute("/admin/voluntarios")({
  head: () => ({
    meta: [
      { title: "Admin · Voluntarios — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useLang();
  const listEngineers = useServerFn(adminListEngineers);
  const review = useServerFn(adminReviewEngineer);
  const resend = useServerFn(adminResendAccessLink);
  const rotate = useServerFn(adminRotateAccessLink);
  const listRequests = useServerFn(adminListHelpRequests);
  const remindEngineer = useServerFn(adminRemindEngineer);
  const reclaimRequest = useServerFn(adminReclaimRequest);
  const reassignRequest = useServerFn(adminReassignRequest);

  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [engineers, setEngineers] = useState<AdminEngineer[]>([]);
  const [requests, setRequests] = useState<AdminHelpRequest[]>([]);
  const [progress, setProgress] = useState<AdminMatchingProgress | null>(null);
  const [reqFilter, setReqFilter] = useState<RequestFilter>("all");
  const [busy, setBusy] = useState(false);

  async function refresh(s: string) {
    const [e, r] = await Promise.all([
      listEngineers({ data: { adminSecret: s } }),
      listRequests({ data: { adminSecret: s } }),
    ]);
    if (!e.ok) return false;
    setEngineers(e.engineers);
    setRequests(r.requests);
    setProgress(r.progress);
    return true;
  }

  async function onUnlock(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      const ok = await refresh(secret);
      if (ok) setUnlocked(true);
      else toast.error(t("admin.wrong"));
    } finally {
      setBusy(false);
    }
  }

  async function onReview(id: string, action: "approve" | "reject") {
    const res = await review({ data: { adminSecret: secret, id, action } });
    if (res.ok) await refresh(secret);
    else toast.error(t("admin.wrong"));
  }

  async function copyPanelLink(token: string) {
    try {
      await navigator.clipboard.writeText(
        absoluteUrl(`/voluntarios/panel/${token}`),
      );
      toast.success(t("admin.linkCopied"));
    } catch {
      /* ignore */
    }
  }

  function notifyWhatsapp(e: AdminEngineer) {
    if (!e.accessToken) return;
    const phone = (e.whatsapp || "").replace(/\D/g, "");
    const panelUrl = absoluteUrl(`/voluntarios/panel/${e.accessToken}`);
    const states = e.states.join(", ");
    const firstName = (e.name || "").trim().split(/\s+/)[0] || "";
    const message =
      `Hola ${firstName}, ¡buenas noticias! Tu inscripción como voluntario(a) en EvalúaYa fue validada. ` +
      `Desde este enlace privado puedes ver y atender solicitudes de ayuda${
        states ? ` en ${states}` : ""
      }: ${panelUrl}\n\n` +
      `Guárdalo: es personal y no requiere contraseña.`;
    const url = `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function resendEmail(e: AdminEngineer) {
    setBusy(true);
    try {
      const res = await resend({ data: { adminSecret: secret, id: e.id } });
      if (res.ok) toast.success(t("admin.resent"));
      else toast.error(t("admin.resendFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function rotateLink(e: AdminEngineer) {
    if (!window.confirm(t("admin.rotateConfirm"))) return;
    setBusy(true);
    try {
      const res = await rotate({ data: { adminSecret: secret, id: e.id } });
      if (res.ok) {
        toast.success(t("admin.rotated"));
        await refresh(secret);
      } else toast.error(t("admin.rotateFailed"));
    } finally {
      setBusy(false);
    }
  }

  const filteredRequests = useMemo(() => {
    switch (reqFilter) {
      case "open":
        return requests.filter((r) => r.status === "open");
      case "claimed":
        return requests.filter((r) => r.status === "claimed");
      case "stalled":
        return requests.filter((r) => r.stalled);
      case "resolved":
        return requests.filter((r) => r.progressStage === "resolved");
      default:
        return requests;
    }
  }, [requests, reqFilter]);

  if (!unlocked) {
    return (
      <AppShell>
        <form
          onSubmit={onUnlock}
          className="mx-auto mt-12 max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" aria-hidden />
            <h1 className="font-display text-lg font-bold">
              {t("admin.title")}
            </h1>
          </div>
          <div className="mt-4">
            <Label htmlFor="secret">{t("admin.secret")}</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-1.5"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={busy}>
            {t("admin.unlock")}
          </Button>
        </form>
      </AppShell>
    );
  }

  const pending = engineers.filter((e) => e.status === "pending");
  const approved = engineers.filter((e) => e.status === "approved");



  return (
    <AppShell>
      <h1 className="font-display text-xl font-extrabold">{t("admin.title")}</h1>


      <Group title={`${t("admin.pending")} (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty t={t} />
        ) : (
          pending.map((e) => (
            <EngineerCard key={e.id} e={e}>
              <Button size="sm" onClick={() => onReview(e.id, "approve")}>
                {t("admin.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(e.id, "reject")}
              >
                {t("admin.reject")}
              </Button>
            </EngineerCard>
          ))
        )}
      </Group>

      <Group title={`${t("admin.approved")} (${approved.length})`}>
        {approved.length === 0 ? (
          <Empty t={t} />
        ) : (
          approved.map((e) => (
            <EngineerCard key={e.id} e={e} t={t}>
              {e.accessToken && (
                <>
                  <Button
                    size="sm"
                    className="bg-[#25D366] text-white hover:bg-[#1da851]"
                    onClick={() => notifyWhatsapp(e)}
                  >
                    <MessageCircle className="size-4" />
                    {t("admin.notifyWhatsapp")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPanelLink(e.accessToken!)}
                  >
                    <Copy className="size-4" />
                    {t("admin.copyLink")}
                  </Button>
                  {e.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => resendEmail(e)}
                    >
                      <Mail className="size-4" />
                      {t("admin.resendEmail")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => rotateLink(e)}
                  >
                    <RotateCcw className="size-4" />
                    {t("admin.rotateLink")}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReview(e.id, "reject")}
              >
                {t("admin.reject")}
              </Button>
            </EngineerCard>
          ))
        )}
      </Group>

      {progress && (
        <Group title={t("admin.matchingProgress")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat
              label={t("admin.stageClaimed")}
              value={progress.claimedOnly}
            />
            <Stat
              label={t("admin.stageContacted")}
              value={progress.contacted}
            />
            <Stat label={t("admin.stageVisited")} value={progress.visited} />
            <Stat
              label={t("admin.stageResolved")}
              value={progress.resolved}
              tone="green"
            />
            <Stat
              label={t("admin.stalled")}
              value={progress.stalled}
              tone="red"
            />
          </div>
        </Group>
      )}

      <Group title={`${t("admin.requests")} (${requests.length})`}>
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["all", t("admin.filterAll")],
              ["open", t("admin.filterOpen")],
              ["claimed", t("admin.filterClaimed")],
              ["stalled", t("admin.filterStalled")],
              ["resolved", t("admin.filterResolved")],
            ] as [RequestFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setReqFilter(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                reqFilter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {filteredRequests.length === 0 ? (
          <Empty t={t} />
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((r) => (
              <HelpRequestCard key={r.id} r={r} t={t} />
            ))}
          </div>
        )}
      </Group>
    </AppShell>

  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ t }: { t: (k: string) => string }) {
  return <p className="text-sm text-muted-foreground">{t("admin.none")}</p>;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <p
        className={cn(
          "font-display text-2xl font-extrabold leading-none",
          tone === "green"
            ? "text-risk-green"
            : tone === "red"
              ? "text-risk-red"
              : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

const STAGE_ORDER = ["claimed", "contacted", "visited", "resolved"] as const;

function HelpRequestCard({
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
          {r.riskLevel && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                r.riskLevel === "red"
                  ? "bg-risk-red-soft text-risk-red"
                  : r.riskLevel === "orange"
                    ? "bg-risk-orange-soft text-risk-orange"
                    : r.riskLevel === "yellow"
                      ? "bg-risk-yellow-soft text-risk-yellow"
                      : "bg-risk-green-soft text-risk-green",
              )}
            >
              {r.riskLevel}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
          {r.stalled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-risk-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-risk-red">
              <AlertTriangle className="size-3" aria-hidden />
              {t("admin.stalled")}
            </span>
          )}
        </div>
      </div>

      {/* Lifecycle stepper */}
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


function EngineerCard({
  e,
  t,
  children,
}: {
  e: AdminEngineer;
  t?: (key: string) => string;
  children: React.ReactNode;
}) {
  const hasEmail = !!e.email?.trim();
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" aria-hidden />
        <p className="font-semibold">{e.name}</p>
        {!hasEmail && t && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
            {t("admin.noEmail")}
          </span>
        )}
      </div>
      {e.organization && (
        <p className="text-xs text-muted-foreground">{e.organization}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        WhatsApp: {e.whatsapp}
        {e.email ? ` · ${e.email}` : ""}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {e.states.join(", ")}
      </p>
      {e.specialization && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {e.specialization}
        </p>
      )}
      {e.note && <p className="mt-1 text-xs italic">{e.note}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
