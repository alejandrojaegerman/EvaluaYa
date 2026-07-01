import { Link } from "@tanstack/react-router";
import {
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  ShieldCheck,
  ClipboardCheck,
  Circle,
  Landmark,
  User,
  Home,
} from "lucide-react";
import { useState } from "react";

import { PhotoLightbox } from "@/components/PhotoLightbox";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RiskLevel } from "@/lib/assessment-types";
import { formatDateTime } from "@/lib/datetime";
import { useLang } from "@/lib/i18n";

import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import type {
  EngineerRequest,
  ProgressStage,
} from "@/lib/volunteers.functions";



const STAGES: { key: ProgressStage; labelKey: string }[] = [
  { key: "claimed", labelKey: "panel.stage.claimed" },
  { key: "contacted", labelKey: "panel.stage.contacted" },
  { key: "visited", labelKey: "panel.stage.visited" },
  { key: "resolved", labelKey: "panel.stage.resolved" },
];

function stageIndex(stage: ProgressStage | null): number {
  if (!stage) return 0; // claimed baseline
  return STAGES.findIndex((s) => s.key === stage);
}

export function EngineerRequestCard({
  r,
  acting,
  onClaim,
  onContact,
  onProgress,
  onVerdict,
  ageLabel,
}: {
  r: EngineerRequest;
  acting: boolean;
  onClaim: (id: string) => void;
  onContact: (phone: string) => void;
  onProgress: (id: string, stage: ProgressStage, note: string) => void;
  onVerdict: (
    id: string,
    verdict: "agree" | "adjust",
    level: RiskLevel | undefined,
    notes: string,
  ) => void;
  ageLabel: (createdAt: string) => string;
}) {
  const { t, lang } = useLang();
  const [progressNote, setProgressNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [verdictNote, setVerdictNote] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const curStage = stageIndex(r.progressStage);

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate">
              {r.municipality
                ? `${r.municipality}${r.state ? `, ${r.state}` : ""}`
                : r.state || t("panel.noLocation")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(r.createdAt, lang)}
          </p>
          {r.status === "open" && ageLabel(r.createdAt) && (
            <p className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {ageLabel(r.createdAt)}
            </p>
          )}
        </div>
        {r.riskLevel && <RiskBadge level={r.riskLevel} />}
      </div>

      {r.note && (
        <p className="mt-2 rounded-lg bg-muted/60 p-2 text-sm">{r.note}</p>
      )}

      {/* Photo evidence preview — the core triage signal, so the engineer can
          prioritize without opening each case. Tap to inspect full screen. */}
      {r.thumbnails.length > 0 && (
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto">
            {r.thumbnails.map((url, i) => (
              <button
                key={`${r.id}-thumb-${i}`}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="relative shrink-0 overflow-hidden rounded-lg border border-border"
                aria-label={t("lightbox.title")}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 object-cover"
                />
                {/* Show "+N more" overlay on the last thumb when extra photos exist. */}
                {i === r.thumbnails.length - 1 &&
                  r.photoCount > r.thumbnails.length && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-semibold text-white">
                      +{r.photoCount - r.thumbnails.length}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={r.thumbnails.map((url) => ({ url, caption: "" }))}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Progress tracker (only after the engineer claims the request) */}
      {r.claimedByMe && (
        <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("panel.progressTitle")}
          </p>
          <ol className="mt-2 flex items-center justify-between gap-1">
            {STAGES.map((s, i) => {
              const done = i <= curStage;
              return (
                <li
                  key={s.key}
                  className="flex flex-1 flex-col items-center gap-1 text-center"
                >
                  <span className="flex items-center w-full">
                    {i > 0 && (
                      <span
                        className={cn(
                          "h-0.5 flex-1",
                          i <= curStage ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-border" />
                    )}
                    {i < STAGES.length - 1 && (
                      <span
                        className={cn(
                          "h-0.5 flex-1",
                          i < curStage ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-tight",
                      done
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {t(s.labelKey)}
                  </span>
                </li>
              );
            })}
          </ol>

          {r.engineerNote && (
            <p className="mt-2 rounded-lg bg-background/70 p-2 text-xs italic text-muted-foreground">
              “{r.engineerNote}”
            </p>
          )}

          {r.status !== "closed" && (
            <>
              <Textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder={t("panel.progressNotePlaceholder")}
                rows={2}
                className="mt-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {curStage < 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting}
                    onClick={() =>
                      onProgress(r.id, "contacted", progressNote.trim())
                    }
                  >
                    {t("panel.markContacted")}
                  </Button>
                )}
                {curStage < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting}
                    onClick={() =>
                      onProgress(r.id, "visited", progressNote.trim())
                    }
                  >
                    {t("panel.markVisited")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={acting}
                  onClick={() =>
                    onProgress(r.id, "resolved", progressNote.trim())
                  }
                >
                  {t("panel.markResolved")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Record professional observations (no AI verdict shown) */}
      {r.claimedByMe && r.assessmentPublicId && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <ClipboardCheck className="size-4" aria-hidden />
            {t("panel.reviewTitle")}
          </p>

          {r.verified ? (
            <>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-risk-green">
                <ShieldCheck className="size-4" aria-hidden />
                {t("panel.reviewedByYou")}
              </p>
              {/* Remit to authorities: after the volunteer review, remind that
                  the resident can show the report to the official organism. */}
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <Landmark className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t("panel.remitBody")}{" "}
                  <Link
                    to="/contactos-oficiales"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {t("panel.remitLink")}
                  </Link>
                </p>
              </div>
            </>
          ) : !reviewing ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("panel.reviewBody")}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setReviewing(true)}
              >
                {t("panel.reviewCta")}
              </Button>
            </>
          ) : (
            <div className="mt-2 space-y-2">
              <Textarea
                value={verdictNote}
                onChange={(e) => setVerdictNote(e.target.value)}
                placeholder={t("panel.reviewNotePlaceholder")}
                rows={3}
                className="text-sm"
              />
              <label className="flex items-start gap-2 rounded-lg bg-background/70 p-2 text-[11px] leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0"
                />
                <span>{t("panel.reviewDescargo")}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={acting || !accepted}
                  onClick={() =>
                    onVerdict(r.id, "agree", undefined, verdictNote.trim())
                  }
                >
                  <CheckCircle2 className="size-4" />
                  {t("panel.reviewSubmit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReviewing(false);
                    setAccepted(false);
                  }}
                >
                  {t("panel.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Resident contact details — revealed only after this engineer claims. */}
      {r.claimedByMe && (r.residentName || r.residentAddress) && (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("panel.residentContactTitle")}
          </p>
          {r.residentName && (
            <p className="flex items-start gap-2 text-sm text-foreground">
              <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{r.residentName}</span>
            </p>
          )}
          {r.residentAddress && (
            <p className="flex items-start gap-2 text-sm text-foreground">
              <Home className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="whitespace-pre-line">{r.residentAddress}</span>
            </p>
          )}
        </div>
      )}

      {/* Primary actions */}
      <div className="mt-3 grid gap-2">
        {r.status === "open" && (
          <Button
            variant="outline"
            onClick={() => onClaim(r.id)}
            disabled={acting}
          >
            <CheckCircle2 className="size-4" />
            {t("panel.claim")}
          </Button>
        )}
        {r.residentWhatsapp ? (
          <Button
            onClick={() => onContact(r.residentWhatsapp!)}
            className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
          >
            <MessageCircle className="size-4" />
            {t("panel.contactResident")}
          </Button>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("panel.contactLocked")}
          </p>
        )}
        {r.assessmentPublicId && (
          <Button asChild variant="ghost" size="sm">
            <a
              href={absoluteUrl(`/a/${r.assessmentPublicId}`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              {t("panel.viewReport")}
            </a>
          </Button>
        )}
      </div>
    </li>
  );
}
