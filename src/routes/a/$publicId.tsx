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
  Map as MapIcon,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { getAssessment } from "@/lib/assessment.functions";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { downloadAssessmentPdf } from "@/lib/pdf";
import { RISK_THEME } from "@/lib/risk";
import { generateResultCard, shareImageBlob } from "@/lib/share-card";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const RESULT_OG = {
  green: absoluteUrl("/og-result-green.jpg"),
  yellow: absoluteUrl("/og-result-yellow.jpg"),
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

  async function handleShare() {
    const url = window.location.href;
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
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("result.copied"));
    } catch {
      toast.error(t("result.genericError"));
    }
  }

  function shareWhatsApp() {
    const url = window.location.origin;
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
      const blob = await generateResultCard({
        riskLevel: record!.riskLevel,
        tag: t(`result.${record!.riskLevel}.tag`),
        action: t(`result.${record!.riskLevel}.action`),
        url: window.location.origin,
        footer: t("result.cardFooter"),
      });
      const outcome = await shareImageBlob(blob, {
        filename: `evaluaya-${record!.publicId}.png`,
        title: "EvalúaYa",
        text: `${t("result.whatsappMessage")} ${window.location.origin}`,
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
        <p className={cn("mt-4 font-display text-2xl font-extrabold", theme.text)}>
          {t(theme.actionKey)}
        </p>
        {record.aiResult.summary && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {record.aiResult.summary}
          </p>
        )}
      </section>

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

      {/* Photos */}
      {Object.keys(record.photoUrls).length > 0 && (
        <Section title={t("result.photos")}>
          <div className="grid grid-cols-2 gap-2">
            {record.answers
              .filter((a) => record.photoUrls[a.id]?.length)
              .flatMap((a) =>
                record.photoUrls[a.id].map((url, i) => (
                  <figure
                    key={`${a.id}-${i}`}
                    className="overflow-hidden rounded-xl border border-border"
                  >
                    <img
                      src={url}
                      alt={t(`item.${a.id}.area`)}
                      loading="lazy"
                      className="h-28 w-full object-cover"
                    />
                    <figcaption className="bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {t(`item.${a.id}.area`)}
                    </figcaption>
                  </figure>
                )),
              )}
          </div>
        </Section>
      )}


      {/* Inspection summary */}
      <Section title={t("pdf.inspection")}>
        <ul className="divide-y divide-border">
          {record.answers.map((a) => (
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

      {/* Actions */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button
          size="lg"
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
          onClick={shareWhatsApp}
          className="col-span-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
        >
          <MessageCircle className="size-4" />
          {t("result.shareWhatsapp")}
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

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/50 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("result.disclaimerShort")}
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
