import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  Download,
  Share2,
  RotateCcw,
  CircleCheck,
  CircleAlert,
  Home as HomeIcon,
  Info,
  ImageDown,
  MessageCircle,
  MessageSquareHeart,
  Map as MapIcon,
  Users,
  Activity,
  ShieldCheck,


} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ConnectEngineers } from "@/components/ConnectEngineers";
import { RiskBadge } from "@/components/RiskBadge";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { SaveReportsCard } from "@/components/SaveReportsCard";
import { SameBuildingCard } from "@/components/SameBuildingCard";
import { Button } from "@/components/ui/button";
import { getAssessment } from "@/lib/assessment.functions";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { damageCategoryKey } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { downloadAssessmentPdf } from "@/lib/pdf";
import { RISK_THEME } from "@/lib/risk";
import { generateResultCard, shareImageBlob } from "@/lib/share-card";
import { absoluteUrl, withUtm } from "@/lib/site";
import { trackStep } from "@/lib/track";
import { cn } from "@/lib/utils";

const RESULT_OG = {
  green: absoluteUrl("/og-result-green.jpg"),
  yellow: absoluteUrl("/og-result-yellow.jpg"),
  orange: absoluteUrl("/og-result-orange.jpg"),
  red: absoluteUrl("/og-result-red.jpg"),
} as const;



export const Route = createFileRoute("/a/$publicId")({
  loader: async ({ params }) => {
    const record = (await getAssessment({
      data: { publicId: params.publicId },
    })) as AssessmentRecord | null;
    return { record };
  },
  head: ({ params, loaderData }) => {
    const level = loaderData?.record?.riskLevel ?? "yellow";
    const ogImage = RESULT_OG[level];
    const url = absoluteUrl(`/a/${params.publicId}`);
    const title = "Mi evaluación estructural — EvalúaYa";
    const description =
      "Resultado de una autoevaluación de daños estructurales con EvalúaYa. Evalúa tu vivienda gratis y sin registro.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        // Private result — keep out of search indexes.
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: ogImage },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: ResultPage,
});


function ResultPage() {
  const { record } = Route.useLoaderData() as {
    record: AssessmentRecord | null;
  };
  const { t } = useLang();
  const navigate = useNavigate();

  if (!record) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <CircleAlert className="size-12 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-lg font-semibold">{t("result.notFound")}</p>
          <Link to="/" className="mt-6">
            <Button size="lg">
              <HomeIcon className="size-4" />
              {t("result.goHome")}
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const theme = RISK_THEME[record.riskLevel];
  const [cardBusy, setCardBusy] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Flatten all photos into a single ordered list for the gallery + lightbox,
  // so the engineer can open any photo and swipe through the whole case.
  const photoItems = record.answers
    .filter((a) => record.photoUrls[a.id]?.length)
    .flatMap((a) =>
      record.photoUrls[a.id].map((url, i) => {
        const label = record.photoCaptions?.[a.id]?.[i];
        const key = damageCategoryKey(label);
        return {
          id: a.id,
          url,
          caption: key ? t(key) : (label ?? t(`item.${a.id}.area`)),
        };
      }),
    );

  // Funnel: resident reached the final result — the completed conversion.
  useEffect(() => {
    trackStep("result_reached");
  }, []);

  async function handleShare() {
    const url = withUtm(`/a/${record!.publicId}`, {
      source: "native",
      medium: "share",
      campaign: "result",
    });
    const shareData = {
      title: "EvalúaYa",
      text: t(`result.${record!.riskLevel}.tag`),
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        withUtm(`/a/${record!.publicId}`, {
          source: "copy",
          medium: "share",
          campaign: "result",
        }),
      );
      toast.success(t("result.copied"));
    } catch {
      toast.error(t("result.genericError"));
    }
  }

  function shareWhatsApp() {
    const url = withUtm(`/a/${record!.publicId}`, {
      source: "whatsapp",
      medium: "share",
      campaign: "result",
    });
    const text = `${t("result.whatsappMessage")} ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareCard() {
    if (cardBusy) return;
    setCardBusy(true);
    try {
      // The URL drawn on the card stays clean/short; the tappable link in the
      // accompanying share text carries the UTM attribution.
      const cardUrl = absoluteUrl(`/a/${record!.publicId}`);
      const linkUrl = withUtm(`/a/${record!.publicId}`, {
        source: "image",
        medium: "share",
        campaign: "result",
      });
      const blob = await generateResultCard({
        riskLevel: record!.riskLevel,
        tag: t(`result.${record!.riskLevel}.tag`),
        action: t(`result.${record!.riskLevel}.action`),
        url: cardUrl,
        footer: t("result.cardFooter"),
      });
      const outcome = await shareImageBlob(blob, {
        filename: `evaluaya-${record!.publicId}.png`,
        title: "EvalúaYa",
        text: `${t("result.whatsappMessage")} ${linkUrl}`,
      });
      if (outcome === "downloaded") toast.success(t("share.imageSaved"));
    } catch {
      toast.error(t("result.genericError"));
    } finally {
      setCardBusy(false);
    }
  }


  return (
    <AppShell>
      {/* Risk hero card */}
      <section
        className={cn(
          "rounded-3xl p-6 text-center shadow-sm ring-1",
          theme.soft,
          theme.ring,
        )}
      >
        <div className="flex justify-center">
          <RiskBadge level={record.riskLevel} />
        </div>
        {record.reportType === "professional" && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t("result.proBadge")}
          </div>
        )}
        <p className={cn("mt-4 font-display text-2xl font-extrabold", theme.text)}>
          {t(theme.actionKey)}
        </p>
        {record.aiResult.summary && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {record.aiResult.summary}
          </p>
        )}
        <p className="mt-4 rounded-xl bg-background/60 px-3 py-2.5 text-left text-xs leading-relaxed text-muted-foreground">
          {t("result.findingsDisclaimer")}
        </p>
      </section>


      {record.priorRiskLevel && record.priorRiskLevel !== record.riskLevel && (
        <p className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {t("reclassify.updated")
            .replace("{from}", t(`result.${record.priorRiskLevel}.tag`))
            .replace("{to}", t(`result.${record.riskLevel}.tag`))}
        </p>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs leading-relaxed">
        <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-semibold text-foreground">
            {t("result.shareOwnerTitle")}
          </span>{" "}
          <span className="text-muted-foreground">
            {t("result.shareOwnerBody")}
          </span>
        </span>
      </div>

      {/* Findings */}
      {record.aiResult.findings.length > 0 && (
        <Section title={t("result.findings")}>
          <ul className="space-y-2">
            {record.aiResult.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CircleAlert
                  className={cn("mt-0.5 size-4 shrink-0", theme.text)}
                  aria-hidden
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Next steps */}
      {record.aiResult.next_steps.length > 0 && (
        <Section title={t("result.nextSteps")}>
          <ul className="space-y-2">
            {record.aiResult.next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CircleCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Connect with a volunteer engineer (Red / Orange / Yellow) — placed
          high, right after findings, so urgent residents see the help option. */}
      {(record.riskLevel === "red" ||
        record.riskLevel === "orange" ||
        record.riskLevel === "yellow") && <ConnectEngineers record={record} />}

      {/* Other reports from the same building (anonymized counts) */}
      <SameBuildingCard record={record} />



      {/* Seismic context (data-driven, from USGS ShakeMap) */}
      {typeof record.property.seismicIntensity === "number" && (
        <Section title={t("result.seismicContext")}>
          <div className="flex items-start gap-2.5">
            <Activity
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <div className="flex-1">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">{t("result.mmi")}</dt>
                <dd className="text-right font-medium tabular-nums">
                  {record.property.seismicIntensityRoman ?? ""} (
                  {record.property.seismicIntensity})
                </dd>
                {typeof record.property.pga === "number" && (
                  <>
                    <dt className="text-muted-foreground">{t("result.pga")}</dt>
                    <dd className="text-right font-medium tabular-nums">
                      {(record.property.pga * 100).toFixed(0)}%g
                    </dd>
                  </>
                )}
                {typeof record.property.pgv === "number" && (
                  <>
                    <dt className="text-muted-foreground">{t("result.pgv")}</dt>
                    <dd className="text-right font-medium tabular-nums">
                      {record.property.pgv.toFixed(0)} cm/s
                    </dd>
                  </>
                )}
                {typeof record.property.spectralDemand === "number" && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("result.spectralDemand")}
                    </dt>
                    <dd className="text-right font-medium tabular-nums">
                      {(record.property.spectralDemand * 100).toFixed(0)}%g
                      {record.property.spectralBand
                        ? ` · SA(${record.property.spectralBand})`
                        : ""}
                    </dd>
                  </>
                )}
                {record.property.soilClass && (
                  <>
                    <dt className="text-muted-foreground">{t("result.soil")}</dt>
                    <dd className="text-right font-medium">
                      {t(`soil.${record.property.soilClass}`)}
                      {typeof record.property.vs30 === "number"
                        ? ` (${record.property.vs30} m/s)`
                        : ""}
                    </dd>
                  </>
                )}
              </dl>
              <p className="mt-2.5 text-xs text-muted-foreground">
                {t("result.seismicContextHint")}
              </p>
            </div>
          </div>
        </Section>
      )}


      {/* Photos */}
      {photoItems.length > 0 && (
        <Section title={t("result.photos")}>
          <p className="mb-2 text-xs text-muted-foreground">
            {t("result.photosHint")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {photoItems.map((photo, i) => (
              <button
                key={`${photo.id}-${i}`}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group overflow-hidden rounded-xl border border-border text-left"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  loading="lazy"
                  className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="block bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {photo.caption}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoItems.map((p) => ({ url: p.url, caption: p.caption }))}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}


      {/* Inspection summary */}
      <Section title={t("pdf.inspection")}>
        <ul className="divide-y divide-border">
          {record.answers
            .filter((a) => a.id !== "facade" && a.id !== "damage_photos")
            .map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-muted-foreground">{t(`item.${a.id}.area`)}</span>
              <span
                className={cn(
                  "font-semibold",
                  a.value === "yes"
                    ? "text-risk-red"
                    : a.value === "no"
                      ? "text-risk-green"
                      : "text-muted-foreground",
                )}
              >
                {t(`checklist.answer.${a.value}`)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Actions — WhatsApp first: it's the dominant sharing channel in
          Venezuela, so it's the primary one-tap action. */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button
          size="lg"
          onClick={shareWhatsApp}
          className="col-span-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
        >
          <MessageCircle className="size-4" />
          {t("result.shareWhatsapp")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={shareCard}
          disabled={cardBusy}
          className="col-span-2"
        >
          <ImageDown className="size-4" />
          {cardBusy ? t("share.generating") : t("result.shareCard")}
        </Button>
        <Button size="lg" variant="outline" onClick={handleShare}>
          <Share2 className="size-4" />
          {t("result.share")}
        </Button>
        <Button size="lg" variant="outline" onClick={copyLink}>
          <Copy className="size-4" />
          {t("result.copyLink")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => downloadAssessmentPdf(record)}
          className="col-span-2"
        >
          <Download className="size-4" />
          {t("result.downloadPdf")}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => navigate({ to: "/assess/property" })}
          className="col-span-2"
        >
          <RotateCcw className="size-4" />
          {t("result.newAssessment")}
        </Button>
      </div>


      {/* Save reports — optional, passwordless account */}
      <SaveReportsCard />

      {/* Community flywheel — invite + map */}
      <section className="mt-6 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">
            {t("result.inviteTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("result.inviteBody")}
        </p>
        <div className="mt-4 grid gap-2">
          <Button onClick={shareWhatsApp}>
            <MessageCircle className="size-4" />
            {t("result.inviteCta")}
          </Button>
          <Button asChild variant="outline">
            <Link to="/mapa">
              <MapIcon className="size-4" />
              {t("result.viewMap")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Feedback prompt */}
      <Link
        to="/feedback"
        className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <MessageSquareHeart className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">
            {t("feedback.promptTitle")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("feedback.promptBody")}
          </p>
        </div>
      </Link>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/50 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("legal.short")}{" "}
          <Link
            to="/legal"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t("legal.readMore")}
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
