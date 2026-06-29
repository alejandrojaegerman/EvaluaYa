import {
  Copy,
  Mail,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { HelpRequestCard } from "@/components/admin/AdminRequestCards";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { toWhatsappNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type {
  AdminEngineer,
  AdminHelpRequest,
  AdminMatchingProgress,
} from "@/lib/volunteers.functions";

type RequestFilter = "all" | "open" | "claimed" | "stalled" | "resolved";

export function VolunteersPanel({
  engineers,
  requests,
  progress,
  busy,
  onReview,
  onResend,
  onRotate,
}: {
  engineers: AdminEngineer[];
  requests: AdminHelpRequest[];
  progress: AdminMatchingProgress | null;
  busy: boolean;
  onReview: (id: string, action: "approve" | "reject") => void;
  onResend: (e: AdminEngineer) => void;
  onRotate: (e: AdminEngineer) => void;
}) {
  const { t } = useLang();
  const [reqFilter, setReqFilter] = useState<RequestFilter>("all");

  const pending = engineers.filter((e) => e.status === "pending");
  const approved = engineers.filter((e) => e.status === "approved");

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

  return (
    <div className="space-y-5">
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
                      onClick={() => onResend(e)}
                    >
                      <Mail className="size-4" />
                      {t("admin.resendEmail")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onRotate(e)}
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
            <Stat label={t("admin.stageClaimed")} value={progress.claimedOnly} />
            <Stat label={t("admin.stageContacted")} value={progress.contacted} />
            <Stat label={t("admin.stageVisited")} value={progress.visited} />
            <Stat
              label={t("admin.stageResolved")}
              value={progress.resolved}
              tone="green"
            />
            <Stat label={t("admin.stalled")} value={progress.stalled} tone="red" />
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
    </div>
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
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
