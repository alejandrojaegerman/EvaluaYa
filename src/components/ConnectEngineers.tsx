import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HardHat, CheckCircle2, BadgeCheck, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UsefulPhotosTip } from "@/components/UsefulPhotosTip";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { hasLegalAck, setLegalAck } from "@/lib/legal-ack";
import { RISK_THEME } from "@/lib/risk";
import { cn } from "@/lib/utils";
import { submitHelpRequest } from "@/lib/volunteers.functions";

/** Static border classes per level (Tailwind can't extract interpolated names). */
const BORDER_BY_LEVEL = {
  green: "border-risk-green/30",
  yellow: "border-risk-yellow/40",
  orange: "border-risk-orange/40",
  red: "border-risk-red/30",
} as const;

/**
 * Shown on Red/Orange/Yellow results: a single "request a verified engineer"
 * form that records a help request for engineers to claim. Residents never see
 * the engineer directory — engineers get notified and claim open requests from
 * their own panels. The message is pre-filled from the resident's AI analysis.
 */
export function ConnectEngineers({ record }: { record: AssessmentRecord }) {
  const { t } = useLang();
  const submit = useServerFn(submitHelpRequest);

  // Follow the 4-level methodology: each level keeps its own tone and copy so
  // an orange ("serios") result is never presented as red ("severos").
  const level = record.riskLevel;
  const theme = RISK_THEME[level];
  const subtitleKey =
    level === "red"
      ? "connect.subtitleRed"
      : level === "orange"
        ? "connect.subtitleOrange"
        : "connect.subtitleYellow";

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

  const [residentName, setResidentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState(buildPrefill);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
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
          residentName,
          email,
          address,
          note,
        },
      });
      if (res.ok) {
        setLegalAck();
        setTrackingToken(res.residentToken ?? null);
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
        theme.soft,
        BORDER_BY_LEVEL[level],
      )}
    >
      <div className="flex items-center gap-2">
        <HardHat className={cn("size-5", theme.text)} aria-hidden />
        <h2 className="font-display text-base font-bold">
          {t("connect.title")}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        {t(subtitleKey)}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2.5 py-1 text-xs font-semibold text-foreground/70">
        <BadgeCheck className="size-3.5 text-primary" aria-hidden />
        {t("connect.reassure")}
      </p>

      {/* Official-process advisory: the volunteer review is a preliminary visual
          orientation, never the official assessment or label. */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-card/70 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("connect.officialNotice")}{" "}
          <Link
            to="/contactos-oficiales"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t("connect.officialNoticeLink")}
          </Link>
        </p>
      </div>

      {/* Request a verified engineer */}
      <div className="mt-5">
        {sent ? (
          <div className="rounded-xl border border-risk-green/30 bg-risk-green-soft/50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-risk-green">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              {t("connect.requestDone")}
            </p>
            {trackingToken && (
              <Link
                to="/seguimiento/$token"
                params={{ token: trackingToken }}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-risk-green/40 bg-card px-3 py-2 text-sm font-semibold text-risk-green underline-offset-2 hover:underline"
              >
                {t("connect.trackCta")}
              </Link>
            )}
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border bg-card p-3"
          >
            <h3 className="text-sm font-bold">{t("connect.requestTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("connect.requestBody")}
            </p>

            {/* Guidance on which photos help the engineer — shown here, where
                the resident is deciding to reach out. */}
            <UsefulPhotosTip />


            <div className="mt-3">
              <Label htmlFor="hr-name">
                {t("connect.yourName")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
              <Input
                id="hr-name"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder={t("connect.namePlaceholder")}
                required
                maxLength={160}
                autoComplete="name"
                className="mt-1.5"
              />
            </div>
            <div className="mt-3">
              <Label htmlFor="hr-wa">
                {t("connect.yourWhatsapp")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
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
              <Label htmlFor="hr-address">
                {t("connect.yourAddress")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
              <Textarea
                id="hr-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("connect.addressPlaceholder")}
                required
                maxLength={400}
                rows={2}
                autoComplete="street-address"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("connect.addressHint")}
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

            {!alreadyAcked && (
              <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                <Checkbox
                  checked={acked}
                  onCheckedChange={(v) => setAcked(v === true)}
                  className="mt-0.5"
                  aria-label={t("legal.ack")}
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  {t("legal.ack")}{" "}
                  <Link
                    to="/legal"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {t("legal.readMore")}
                  </Link>
                </span>
              </label>
            )}

            <Button
              type="submit"
              disabled={
                busy ||
                (!alreadyAcked && !acked) ||
                residentName.trim().length < 2 ||
                whatsapp.trim().length < 7 ||
                address.trim().length < 6
              }
              className="mt-3 w-full"
            >
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
