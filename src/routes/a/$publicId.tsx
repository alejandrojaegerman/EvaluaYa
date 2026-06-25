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
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { getAssessment } from "@/lib/assessment.functions";
import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { downloadAssessmentPdf } from "@/lib/pdf";
import { RISK_THEME } from "@/lib/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/a/$publicId")({
  loader: async ({ params }) => {
    const record = (await getAssessment({
      data: { publicId: params.publicId },
    })) as AssessmentRecord | null;
    return { record };
  },
  component: ResultPage,
});

function ResultPage() {
  const { record } = Route.useLoaderData();
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
              .filter((a) => record.photoUrls[a.id])
              .map((a) => (
                <figure
                  key={a.id}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={record.photoUrls[a.id]}
                    alt={t(`item.${a.id}.area`)}
                    loading="lazy"
                    className="h-28 w-full object-cover"
                  />
                  <figcaption className="bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    {t(`item.${a.id}.area`)}
                  </figcaption>
                </figure>
              ))}
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
        <Button size="lg" onClick={handleShare}>
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
