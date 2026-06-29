import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Map as MapIcon,
  MapPin,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskFactorsPanel } from "@/components/RiskFactorsPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { ShareApp } from "@/components/ShareApp";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/datetime";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import {
  getRiskFactors,
  getStateMunicipios,
  getStateStats,
  type MunicipioStats,
  type RiskFactors,
  type StateStats,
} from "@/lib/stats.functions";
import {
  ESTADOS,
  estadoSlug,
  getEstadoBySlug,
} from "@/lib/venezuela";

const ZONA_OG = absoluteUrl("/og-map.jpg");

export const Route = createFileRoute("/zona/$estado")({
  loader: async ({ params }) => {
    const est = getEstadoBySlug(params.estado);
    if (!est) throw notFound();
    const stats = await getStateStats({ data: { state: est.name } });
    return { estadoName: est.name, stats };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.estadoName ?? "Venezuela";
    const url = absoluteUrl(`/zona/${params.estado}`);
    const title = `Daños estructurales en ${name} — EvalúaYa`;
    const description = `Reportes anónimos de daños estructurales en ${name}, Venezuela. Evalúa tu vivienda gratis, sin registro, y consulta el mapa comunitario de la zona.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: ZONA_OG },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ZONA_OG },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: absoluteUrl("/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Mapa",
                item: absoluteUrl("/mapa"),
              },
              {
                "@type": "ListItem",
                position: 3,
                name,
                item: url,
              },
            ],
          }),
        },
      ],
    };
  },
  component: ZonaPage,
  notFoundComponent: ZonaNotFound,
  errorComponent: ZonaError,
});

function ZonaPage() {
  const { estadoName, stats } = Route.useLoaderData() as {
    estadoName: string;
    stats: StateStats;
  };
  const { t, lang } = useLang();
  const hasData = stats.total > 0;

  // Inline "why" drill-down for this state.
  const [showWhy, setShowWhy] = useState(false);
  const [factors, setFactors] = useState<RiskFactors | null>(null);
  const [factorsLoading, setFactorsLoading] = useState(false);

  function toggleWhy() {
    if (showWhy) {
      setShowWhy(false);
      return;
    }
    setShowWhy(true);
    if (factors) return;
    setFactorsLoading(true);
    getRiskFactors({ data: { state: estadoName } })
      .then((f) => setFactors(f))
      .catch(() => {})
      .finally(() => setFactorsLoading(false));
  }

  // Sibling states for internal linking (a few alphabetical neighbours).
  const others = ESTADOS.filter((e) => e.name !== estadoName).slice(0, 8);


  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          {t("zona.breadcrumbHome")}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link to="/mapa" className="hover:text-foreground">
          {t("map.title")}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">{estadoName}</span>
      </nav>

      {/* Hero */}
      <header className="mt-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <MapPin className="size-3.5" aria-hidden />
          {t("zona.eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {t("zona.h1Prefix")} {estadoName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("zona.intro").replace("{estado}", estadoName)}
        </p>
      </header>

      {/* Primary CTA */}
      <Button
        asChild
        size="lg"
        className="mt-5 w-full text-base font-semibold"
      >
        <Link to="/assess/property" search={{ estado: estadoName }}>
          {t("zona.ctaPrefix")} {estadoName}
          <ArrowRight className="size-5" />
        </Link>
      </Button>

      {/* Stats */}
      {hasData ? (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3">
            <Stat value={stats.total} label={t("zona.totalReports")} />
            <Stat value={stats.municipios} label={t("zona.municipios")} />
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-4">
              <p className="text-sm font-semibold">{t("map.distribution")}</p>
              <div className="mt-3">
                <RiskGauge
                  green={stats.green}
                  yellow={stats.yellow}
                  orange={stats.orange}
                  red={stats.red}
                  label={t("zona.totalReports")}
                />
              </div>
              {stats.lastReport && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("zona.lastReport")}: {formatDate(stats.lastReport, lang)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={toggleWhy}
              aria-expanded={showWhy}
              className="flex w-full items-center justify-center gap-1 border-t border-border px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-accent/40"
            >
              {showWhy ? t("factors.hideWhy") : t("factors.why")}
              <ChevronDown
                className={`size-3.5 transition-transform ${showWhy ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {showWhy && (
              <div className="border-t border-border bg-muted/30 p-3">
                <RiskFactorsPanel factors={factors} loading={factorsLoading} />
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("zona.noData").replace("{estado}", estadoName)}
          </p>
        </section>
      )}

      {/* About / data note */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold">{t("zona.aboutTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("zona.aboutBody")}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-primary">
          <Link to="/mapa" className="inline-flex items-center gap-1 hover:underline">
            <MapIcon className="size-4" aria-hidden />
            {t("zona.viewMap")}
          </Link>
          <Link to="/metodologia" className="inline-flex items-center gap-1 hover:underline">
            {t("home.methodologyLink")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Other states — internal linking for discovery + crawl depth */}
      <section className="mt-6">
        <h2 className="font-display text-base font-bold">{t("zona.otherStates")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((e) => (
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

      {/* Spread the word */}
      <ShareApp className="mt-8" />
    </AppShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="font-display text-2xl font-extrabold text-primary">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}



function ZonaNotFound() {
  const { t } = useLang();
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CircleAlert className="size-12 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-lg font-semibold">{t("zona.notFound")}</p>
        <Link to="/mapa" className="mt-6">
          <Button size="lg">
            <MapIcon className="size-4" />
            {t("zona.viewMap")}
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}

function ZonaError() {
  const { t } = useLang();
  const router = useRouter();
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CircleAlert className="size-12 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-lg font-semibold">{t("analyze.errorTitle")}</p>
        <Button size="lg" className="mt-6" onClick={() => router.invalidate()}>
          {t("common.retry")}
        </Button>
      </div>
    </AppShell>
  );
}
