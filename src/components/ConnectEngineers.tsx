import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  HardHat,
  MessageCircle,
  CheckCircle2,
  BadgeCheck,
  ShieldQuestion,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { toWhatsappNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  getApprovedEngineersForState,
  revealEngineerContact,
  submitHelpRequest,
  type PublicEngineer,
} from "@/lib/volunteers.functions";

/**
 * Shown on Red/Yellow results: a directory of approved volunteer engineers for
 * the resident's estado (one-tap WhatsApp), plus a "request a callback" form
 * that records a help request for engineers to pick up.
 */
export function ConnectEngineers({ record }: { record: AssessmentRecord }) {
  const { t } = useLang();
  const fetchEngineers = useServerFn(getApprovedEngineersForState);
  const reveal = useServerFn(revealEngineerContact);
  const submit = useServerFn(submitHelpRequest);

  const state = record.property.state ?? "";
  const reportUrl = absoluteUrl(`/a/${record.publicId}`);
  const urgent = record.riskLevel === "red" || record.riskLevel === "orange";

  const [engineers, setEngineers] = useState<PublicEngineer[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    fetchEngineers({ data: { state } })
      .then((res) => {
        if (active) setEngineers(res);
      })
      .catch(() => {
        if (active) setEngineers([]);
      });
    return () => {
      active = false;
    };
  }, [fetchEngineers, state]);

  // Two-tap consent: first tap shows the consent line, second tap fetches the
  // number (kept out of the page payload) and opens WhatsApp.
  async function contactEngineer(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setRevealingId(id);
    try {
      const res = await reveal({ data: { engineerId: id } });
      if (!res.whatsapp) {
        toast.error(t("connect.revealError"));
        return;
      }
      const text = `${t("connect.waMessage")} ${reportUrl}`;
      window.open(
        `https://wa.me/${toWhatsappNumber(res.whatsapp)}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
      setConfirmingId(null);
    } catch {
      toast.error(t("connect.revealError"));
    } finally {
      setRevealingId(null);
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await submit({
        data: {
          assessmentPublicId: record.publicId,
          state: record.property.state ?? undefined,
          municipality: record.property.municipality ?? undefined,
          riskLevel: record.riskLevel,
          whatsapp,
          note,
        },
      });
      if (res.ok) {
        setSent(true);
        toast.success(t("connect.requestDone"));
      } else {
        toast.error(t("connect.requestError"));
      }
    } catch {
      toast.error(t("connect.requestError"));
    } finally {
      setBusy(false);
    }
  }

  const hasEngineers = engineers.length > 0;

  return (
    <section
      className={cn(
        "mt-6 rounded-2xl border p-5 shadow-sm",
        urgent
          ? "border-risk-red/30 bg-risk-red-soft/50"
          : "border-risk-yellow/40 bg-risk-yellow-soft/40",
      )}
    >
      <div className="flex items-center gap-2">
        <HardHat
          className={cn(
            "size-5",
            urgent ? "text-risk-red" : "text-risk-yellow",
          )}
          aria-hidden
        />
        <h2 className="font-display text-base font-bold">
          {t("connect.title")}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        {urgent ? t("connect.subtitleRed") : t("connect.subtitleYellow")}
      </p>

      {/* Directory of approved engineers */}
      {hasEngineers && (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("connect.directTitle")}
          </h3>
          <ul className="mt-2 space-y-2">
            {engineers.map((e) => {
              const isOrg = e.volunteerType === "organization";
              const primary = isOrg ? e.organization || e.name : e.name;
              const secondary = isOrg
                ? e.name && e.name !== e.organization
                  ? e.name
                  : null
                : e.organization;
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <BadgeCheck className="size-4 text-primary" aria-hidden />
                    <p className="font-semibold">{primary}</p>
                    {isOrg && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Building2 className="size-3" aria-hidden />
                        {t("connect.orgBadge")}
                      </span>
                    )}
                  </div>
                  {secondary && (
                    <p className="text-xs text-muted-foreground">{secondary}</p>
                  )}
                  {e.specialization && (
                    <p className="text-xs text-muted-foreground">
                      {e.specialization}
                    </p>
                  )}
                  {e.coversState && (
                    <p className="mt-0.5 text-[11px] font-medium text-risk-green">
                      {t("connect.coversYourState")}
                    </p>
                  )}
                  {confirmingId === e.id && (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {t("connect.revealConsent")}
                    </p>
                  )}
                  <Button
                    onClick={() => contactEngineer(e.id)}
                    disabled={revealingId === e.id}
                    className="mt-2 w-full bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                    size="sm"
                  >
                    <MessageCircle className="size-4" />
                    {revealingId === e.id
                      ? t("connect.revealing")
                      : t("connect.whatsappEngineer")}
                  </Button>

                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Request a callback */}
      <div className="mt-5">
        {sent ? (
          <p className="flex items-center gap-2 rounded-xl border border-risk-green/30 bg-risk-green-soft/50 p-3 text-sm font-medium text-risk-green">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden />
            {t("connect.requestDone")}
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border bg-card p-3"
          >
            <div className="flex items-center gap-1.5">
              {!hasEngineers && (
                <ShieldQuestion
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              )}
              <h3 className="text-sm font-bold">
                {hasEngineers
                  ? t("connect.requestTitle")
                  : t("connect.noneTitle")}
              </h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {hasEngineers ? t("connect.requestBody") : t("connect.noneBody")}
            </p>

            <div className="mt-3">
              <Label htmlFor="hr-wa">{t("connect.yourWhatsapp")}</Label>
              <Input
                id="hr-wa"
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t("connect.whatsappPlaceholder")}
                required
                maxLength={40}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("connect.whatsappHint")}
              </p>
            </div>
            <div className="mt-3">
              <Label htmlFor="hr-note">{t("connect.noteOptional")}</Label>
              <Textarea
                id="hr-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("connect.notePlaceholder")}
                maxLength={600}
                rows={2}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" disabled={busy} className="mt-3 w-full">
              {busy ? t("connect.requestSending") : t("connect.requestCta")}
            </Button>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {t("connect.privacy")}
            </p>
          </form>
        )}
      </div>

      {/* Recruit engineers */}
      <Link
        to="/voluntarios"
        className="mt-4 block text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        {t("connect.areEngineer")}
      </Link>
    </section>
  );
}
