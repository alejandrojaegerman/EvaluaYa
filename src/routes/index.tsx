import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  Sparkles,
  Building2,
  Info,
  History,
  ChevronRight,
  Map as MapIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { getHistory, type HistoryEntry } from "@/lib/history";
import { getDamageTotals, type DamageTotals } from "@/lib/stats.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EvalúaYa — Evaluación estructural" },
      {
        name: "description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Sin registro, funciona con poca señal.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [totals, setTotals] = useState<DamageTotals | null>(null);

  useEffect(() => {
    setHistory(getHistory());
    getDamageTotals()
      .then(setTotals)
      .catch(() => setTotals(null));
  }, []);

  const hasTotals = !!totals && totals.total > 0;

  const steps = [
    { icon: Building2, title: t("home.how1Title"), desc: t("home.how1Desc") },
    { icon: ClipboardCheck, title: t("home.how2Title"), desc: t("home.how2Desc") },
    { icon: Sparkles, title: t("home.how3Title"), desc: t("home.how3Desc") },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-8 text-primary-foreground shadow-lg">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
          {t("home.heroSubtitle")}
        </p>
        <Button
          size="lg"
          onClick={() => navigate({ to: "/assess/property" })}
          className="mt-6 w-full bg-card text-base font-semibold text-foreground shadow-md hover:bg-card/90"
        >
          {t("home.startCta")}
          <ArrowRight className="size-5" />
        </Button>
        <p className="mt-3 text-center text-xs font-medium text-primary-foreground/80">
          {t("home.timePromise")}
        </p>
      </section>

      {/* Live trust counters */}
      {hasTotals && (
        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-extrabold text-primary">
              {totals!.total.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("home.statBuildings")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-extrabold text-primary">
              {totals!.areas.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("home.statAreas")}
            </p>
          </div>
        </section>
      )}

      {/* Community map CTA */}
      <section className="mt-4">
        <Link
          to="/mapa"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <MapIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{t("home.mapTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("home.mapDesc")}
            </p>
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Link>
      </section>

      {/* How it works */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{t("home.howTitle")}</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <step.icon className="size-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="font-semibold leading-tight">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Recent assessments */}
      {history.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="font-display text-lg font-bold">
              {t("home.recentTitle")}
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li key={entry.publicId}>
                <Link
                  to="/a/$publicId"
                  params={{ publicId: entry.publicId }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40"
                >
                  <RiskBadge level={entry.riskLevel} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {entry.address || t("home.viewResult")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString(
                        entry.language === "es" ? "es-VE" : "en-US",
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Disclaimer */}
      <section className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-risk-yellow-soft/60 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-risk-yellow" aria-hidden />
        <div>
          <p className="text-sm font-semibold">{t("disclaimer.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("disclaimer.body")}
          </p>
        </div>
      </section>
    </AppShell>
  );
}
