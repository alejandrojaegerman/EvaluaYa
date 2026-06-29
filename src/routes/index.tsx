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
  CloudUpload,
  WifiOff,
  BadgeCheck,
  UserX,
  EyeOff,
  Users,
  HardHat,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ShareApp } from "@/components/ShareApp";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";
import { getHistory, type HistoryEntry } from "@/lib/history";
import { loadDraft, isReadyToSend } from "@/lib/draft-store";
import { getDamageTotals, type DamageTotals } from "@/lib/stats.functions";
import { ESTADOS, estadoSlug } from "@/lib/venezuela";
import { trackStep } from "@/lib/track";
import { SITE_URL } from "@/lib/site";
import heroEngineer from "@/assets/hero-engineer.webp";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EvalúaYa — Evaluación estructural tras un sismo" },
      {
        name: "description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Sin registro, funciona con poca señal. Te conectamos con un ingeniero voluntario verificado.",
      },
      {
        property: "og:title",
        content: "EvalúaYa — Evaluación estructural tras un sismo",
      },
      {
        property: "og:description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Sin registro, funciona con poca señal. Te conectamos con un ingeniero voluntario verificado.",
      },
      { property: "og:url", content: SITE_URL },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      {
        rel: "preload",
        as: "image",
        href: heroEngineer,
        fetchpriority: "high",
        // Image is hidden below sm; only preload where it actually renders so
        // low-bandwidth mobile users don't pay for an offscreen asset.
        media: "(min-width: 640px)",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const online = useOnline();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [totals, setTotals] = useState<DamageTotals | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    loadDraft()
      .then((d) => setPending(isReadyToSend(d)))
      .catch(() => setPending(false));
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.36_0.06_220)] px-6 py-8 text-primary-foreground shadow-lg">
        <img
          src={heroEngineer}
          alt=""
          aria-hidden
          width={400}
          height={400}
          fetchPriority="high"
          decoding="async"
          className="pointer-events-none absolute -right-6 -top-2 hidden h-44 w-44 select-none opacity-90 sm:block"
        />
        <div className="relative sm:max-w-[72%]">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90">
            {t("home.heroSubtitle")}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            trackStep("home_cta");
            navigate({ to: "/assess/property" });
          }}
          className="relative mt-6 w-full bg-card text-base font-semibold text-foreground shadow-md hover:bg-card/90"
        >
          {t("home.startCta")}
          <ArrowRight className="size-5" />
        </Button>
        <p className="relative mt-3 text-center text-xs font-medium text-primary-foreground/90">
          {t("home.timePromise")}
        </p>
        <div className="relative mt-4 flex items-start gap-2 rounded-xl bg-primary-foreground/10 px-3 py-2.5 text-left text-xs leading-relaxed text-primary-foreground/90">
          <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{t("home.behalfTitle")}</span>{" "}
            {t("home.behalfBody")}
          </span>
        </div>
      </section>

      {/* Trust strip — addresses the top hesitations (cost, sign-up,
          connectivity, privacy) that drive the Home → Property drop-off. */}
      <section className="mt-4 flex flex-wrap gap-2">
        {[
          { icon: BadgeCheck, label: t("home.trustFree") },
          { icon: UserX, label: t("home.trustNoSignup") },
          { icon: WifiOff, label: t("home.trustOffline") },
          { icon: EyeOff, label: t("home.trustAnon") },
        ].map(({ icon: PillIcon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
          >
            <PillIcon className="size-3.5 text-primary" aria-hidden />
            {label}
          </span>
        ))}
      </section>

      {/* "Did it just shake?" — captures real-time quake intent and routes it
          into an assessment. Links to the language-matched live page. */}
      <section className="mt-4">
        <Link
          to={lang === "es" ? "/temblo-en-venezuela-hoy" : "/earthquake-in-venezuela-today"}
          className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-secondary/40 p-4 shadow-sm transition-colors hover:bg-secondary/60"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Waves className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{t("home.todayTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("home.todayDesc")}
            </p>
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Link>
      </section>

      {/* Pending submission — offline-first resume card */}
      {pending && (
        <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {online ? (
                <CloudUpload className="size-5" aria-hidden />
              ) : (
                <WifiOff className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">
                {t("home.pendingTitle")}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {online ? t("home.pendingBody") : t("home.pendingOffline")}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            disabled={!online}
            onClick={() => navigate({ to: "/assess/analyze" })}
            className="mt-3 w-full"
          >
            <CloudUpload className="size-4" />
            {t("home.pendingCta")}
          </Button>
        </section>
      )}


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
          <div className="flex flex-col justify-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-risk-orange" />
              <span className="font-display text-lg font-extrabold text-risk-orange">
                {totals!.orange.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("result.orange.tag")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-risk-red" />
              <span className="font-display text-lg font-extrabold text-risk-red">
                {totals!.red.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("result.red.tag")}
              </span>
            </div>
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

      {/* Explore your state — regional landing pages for discovery + SEO */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">{t("home.exploreTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("home.exploreDesc")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Link
              key={e.name}
              to="/zona/$estado"
              params={{ estado: estadoSlug(e.name) }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {e.name}
            </Link>
          ))}
        </div>
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

      {/* Volunteer engineer support — secondary thread, never competes with the
          hero self-assessment CTA. */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <HardHat className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">
              {t("engineers.sectionTitle")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("engineers.homeBody")}
            </p>
            <Link
              to="/voluntarios"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {t("engineers.learnMore")}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Spread the word — flywheel */}
      <ShareApp className="mt-8" />



      {/* Recent assessments */}
      {history.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="font-display text-lg font-bold">
                {t("home.recentTitle")}
              </h2>
            </div>
            <Link
              to="/mis-reportes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {t("account.viewMyReports")}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
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
                      {formatDate(
                        entry.createdAt,
                        entry.language === "es" ? "es" : "en",
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
          <Link
            to="/metodologia"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {t("home.methodologyLink")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
