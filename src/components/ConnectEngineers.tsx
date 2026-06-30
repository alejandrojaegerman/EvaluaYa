import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HardHat, CheckCircle2, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { hasLegalAck, setLegalAck } from "@/lib/legal-ack";
import { cn } from "@/lib/utils";
import { submitHelpRequest } from "@/lib/volunteers.functions";

/**
 * Shown on Red/Orange/Yellow results: a single "request a verified engineer"
 * form that records a help request for engineers to claim. Residents never see
 * the engineer directory — engineers get notified and claim open requests from
 * their own panels. The message is pre-filled from the resident's AI analysis.
 */
export function ConnectEngineers({ record }: { record: AssessmentRecord }) {
  const { t } = useLang();
  const submit = useServerFn(submitHelpRequest);

  const urgent = record.riskLevel === "red" || record.riskLevel === "orange";

  // Pre-fill the message from the analysis that already ran (no new AI call):
  // risk level + the top findings, in the resident's voice. Stays editable.
  const buildPrefill = () => {
    const riskLabel = t(`result.${record.riskLevel}.tag`);
    const findings = (record.aiResult?.findings ?? [])
      .slice(0, 3)
      .map((f) => f.trim())
      .filter(Boolean)
      .join("; ");
    if (!findings) return "";
    return t("connect.notePrefill")
      .replace("{risk}", riskLabel)
      .replace("{findings}", findings)
      .slice(0, 600);
  };

  const [whatsapp, setWhatsapp] = useState("");
  const [note, setNote] = useState(buildPrefill);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // One-time legal acknowledgement: ask once, then never interrupt again.
  const [alreadyAcked] = useState(hasLegalAck);
  const [acked, setAcked] = useState(false);

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
        setLegalAck();
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
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2.5 py-1 text-xs font-semibold text-foreground/70">
        <BadgeCheck className="size-3.5 text-primary" aria-hidden />
        {t("connect.reassure")}
      </p>

      {/* Request a verified engineer */}
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
            <h3 className="text-sm font-bold">{t("connect.requestTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("connect.requestBody")}
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
                rows={3}
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
