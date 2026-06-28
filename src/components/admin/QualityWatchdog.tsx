import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  ClipboardCheck,
  Camera,
  ExternalLink,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";
import { RISK_HEX } from "@/lib/risk";
import {
  adminGetFlaggedReports,
  adminGetQualityMetrics,
  adminGetVerificationMetrics,
  type FlaggedFilter,
  type FlaggedReport,
  type QualityMetrics,
  type VerificationMetrics,
} from "@/lib/admin-analytics.functions";
import { adminCreateReviewRequest } from "@/lib/volunteers.functions";
import { APP_ROOT } from "@/lib/volunteer-links";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {children}
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof ShieldCheck;
  title: string;
}) {
  return (
    <h2 className="mt-7 flex items-center gap-2 font-display text-base font-bold">
      <Icon className="size-4 text-primary" aria-hidden />
      {title}
    </h2>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p
        className={
          highlight
            ? "font-display text-2xl font-extrabold text-risk-red"
            : "font-display text-2xl font-extrabold text-primary"
        }
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

const FILTERS: FlaggedFilter[] = [
  "all",
  "no_photos",
  "mostly_unsure",
  "thin",
  "missing_location",
  "unverified_high",
];

export function QualityWatchdog({ secret }: { secret: string }) {
  const { t, lang } = useLang();
  const getQuality = useServerFn(adminGetQualityMetrics);
  const getVerification = useServerFn(adminGetVerificationMetrics);
  const getFlagged = useServerFn(adminGetFlaggedReports);
  const createReview = useServerFn(adminCreateReviewRequest);

  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [verification, setVerification] = useState<VerificationMetrics | null>(
    null,
  );
  const [reports, setReports] = useState<FlaggedReport[]>([]);
  const [filter, setFilter] = useState<FlaggedFilter>("all");
  const [loadingList, setLoadingList] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    getQuality({ data: { adminSecret: secret } })
      .then((res) => alive && res.ok && setQuality(res.quality))
      .catch(() => {});
    getVerification({ data: { adminSecret: secret } })
      .then((res) => alive && res.ok && setVerification(res.verification))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  useEffect(() => {
    let alive = true;
    setLoadingList(true);
    getFlagged({ data: { adminSecret: secret, filter, limit: 50 } })
      .then((res) => {
        if (alive && res.ok) setReports(res.reports);
      })
      .catch(() => {})
      .finally(() => alive && setLoadingList(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, filter]);

  async function onRequestReview(publicId: string) {
    setReviewing(publicId);
    try {
      const res = await createReview({
        data: { adminSecret: secret, publicId },
      });
      if (res.ok) {
        setRequested((prev) => new Set(prev).add(publicId));
        toast.success(t("dash.reviewRequested"));
      } else if (res.reason === "already_open") {
        setRequested((prev) => new Set(prev).add(publicId));
        toast.message(t("dash.reviewExists"));
      } else {
        toast.error(t("dash.actionError"));
      }
    } catch {
      toast.error(t("dash.actionError"));
    } finally {
      setReviewing(null);
    }
  }

  async function onCopyLink(publicId: string) {
    const url = `${APP_ROOT}/a/${publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("dash.linkCopied"));
    } catch {
      toast.error(t("dash.actionError"));
    }
  }

  const disagreement =
    verification && verification.agree + verification.adjust > 0
      ? Math.round(
          (verification.adjust /
            (verification.agree + verification.adjust)) *
            100,
        )
      : 0;

  return (
    <>
      {/* Goal 1A — Quality & completeness scorecard */}
      {quality && (
        <>
          <SectionTitle icon={ClipboardCheck} title={t("dash.quality")} />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dash.qualityHint")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label={t("dash.qComplete")}
              value={pct(quality.complete, quality.total)}
              hint={`${quality.complete}/${quality.total}`}
            />
            <Stat
              label={t("dash.qWithPhotos")}
              value={pct(quality.withPhotos, quality.total)}
              hint={`${quality.withPhotos}/${quality.total}`}
            />
            <Stat
              label={t("dash.qLowQuality")}
              value={quality.lowQuality}
              highlight={quality.lowQuality > 0}
            />
            <Stat
              label={t("dash.qUnverifiedHigh")}
              value={quality.unverifiedHigh}
              highlight={quality.unverifiedHigh > 0}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label={t("dash.qMissingLocation")}
              value={quality.missingLocation}
            />
            <Stat
              label={t("dash.qMissingBuilding")}
              value={quality.missingBuilding}
            />
            <Stat
              label={t("dash.qMissingIntensity")}
              value={quality.missingIntensity}
            />
            <Stat
              label={t("dash.qProfessional")}
              value={quality.professional}
            />
          </div>
        </>
      )}

      {/* Goal 1B — Needs-attention worklist */}
      <SectionTitle icon={Camera} title={t("dash.worklist")} />
      <p className="mt-1 text-xs text-muted-foreground">
        {t("dash.worklistHint")}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40"
            }
          >
            {t(`dash.filter.${f}`)}
          </button>
        ))}
      </div>
      <Card>
        {loadingList ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-risk-green">{t("dash.worklistEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => {
              const done = requested.has(r.publicId);
              return (
                <li
                  key={r.publicId}
                  className="rounded-xl border bg-card/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/a/$publicId"
                      params={{ publicId: r.publicId }}
                      className="group min-w-0 flex-1"
                    >
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: rgb(r.riskLevel) }}
                          aria-hidden
                        />
                        <span className="truncate">
                          {r.buildingType
                            ? t(`property.type.${r.buildingType}`)
                            : r.municipality}
                        </span>
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.municipality} · {r.state} ·{" "}
                        {formatDate(r.createdAt, lang)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                        {r.photoCount} {t("dash.photosWord")} · {r.unsureCount}{" "}
                        {t("dash.unsureWord")}
                      </p>
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.noPhotos && <FlagChip label={t("dash.flagNoPhotos")} />}
                    {r.mostlyUnsure && (
                      <FlagChip label={t("dash.flagUnsure")} />
                    )}
                    {r.thin && <FlagChip label={t("dash.flagThin")} />}
                    {r.missingLocation && (
                      <FlagChip label={t("dash.flagLocation")} />
                    )}
                    {r.unverifiedHigh && (
                      <FlagChip label={t("dash.flagUnverified")} danger />
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={done ? "secondary" : "default"}
                      disabled={done || reviewing === r.publicId}
                      onClick={() => onRequestReview(r.publicId)}
                    >
                      <Stethoscope className="size-3.5" />
                      {done ? t("dash.reviewRequested") : t("dash.requestReview")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopyLink(r.publicId)}
                    >
                      {t("dash.copyLink")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Goal 1C — Verification push */}
      {verification && (
        <>
          <SectionTitle icon={ShieldCheck} title={t("dash.verification")} />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dash.verificationHint")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label={t("dash.vProfessional")}
              value={verification.professional}
              hint={`${verification.selfAssessed} ${t("dash.vSelf")}`}
            />
            <Stat label={t("dash.vVerified")} value={verification.verified} />
            <Stat
              label={t("dash.vDisagreement")}
              value={`${disagreement}%`}
              hint={`${verification.agree} ${t("dash.vAgree")} · ${verification.adjust} ${t("dash.vAdjust")}`}
            />
            <Stat
              label={t("dash.vUnverifiedHigh")}
              value={verification.unverifiedHigh}
              highlight={verification.unverifiedHigh > 0}
            />
          </div>
          <Card>
            <p className="text-sm font-semibold">{t("dash.vUnverifiedHigh")}</p>
            {verification.unverifiedHighList.length === 0 ? (
              <p className="mt-3 text-sm text-risk-green">
                {t("dash.vUnverifiedEmpty")}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {verification.unverifiedHighList.map((r) => {
                  const done = requested.has(r.publicId);
                  return (
                    <li
                      key={r.publicId}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 p-3"
                    >
                      <Link
                        to="/a/$publicId"
                        params={{ publicId: r.publicId }}
                        className="min-w-0 flex-1"
                      >
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: rgb(r.riskLevel) }}
                            aria-hidden
                          />
                          <span className="truncate">
                            {r.municipality} · {r.state}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatDate(r.createdAt, lang)}
                        </p>
                      </Link>
                      <Button
                        size="sm"
                        variant={done ? "secondary" : "default"}
                        disabled={done || reviewing === r.publicId}
                        onClick={() => onRequestReview(r.publicId)}
                      >
                        <Stethoscope className="size-3.5" />
                        {done
                          ? t("dash.reviewRequested")
                          : t("dash.requestReview")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function FlagChip({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <span
      className={
        danger
          ? "rounded-full bg-risk-red-soft px-2 py-0.5 text-[11px] font-semibold text-risk-red"
          : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

function pct(n: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}
