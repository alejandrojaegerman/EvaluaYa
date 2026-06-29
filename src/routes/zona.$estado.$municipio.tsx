import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CircleAlert,
  Map as MapIcon,
  MapPin,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { RiskGauge } from "@/components/RiskGauge";
import { ShareApp } from "@/components/ShareApp";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/datetime";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import {
  getMunicipioStats,
  type MunicipioStats,
} from "@/lib/stats.functions";
import {
  estadoSlug,
  getEstadoBySlug,
  getMunicipioBySlug,
} from "@/lib/venezuela";

const ZONA_OG = absoluteUrl("/og-map.jpg");

export const Route = createFileRoute("/zona/$estado/$municipio")({
  loader: async ({ params }) => {
    const est = getEstadoBySlug(params.estado);
    if (!est) throw notFound();
    const muni = getMunicipioBySlug(est.name, params.municipio);
    if (!muni) throw notFound();
    const stats = await getMunicipioStats({
      data: { state: est.name, municipality: muni.name },
    });
    return { estadoName: est.name, municipioName: muni.name, stats };
  },
  head: ({ params, loaderData }) => {
    const estadoName = loaderData?.estadoName ?? "Venezuela";
    const municipioName = loaderData?.municipioName ?? "";
    const url = absoluteUrl(`/zona/${params.estado}/${params.municipio}`);
    const title = `Daños estructurales en ${municipioName}, ${estadoName} — EvalúaYa`;
    const description = `Reportes anónimos de daños estructurales en ${municipioName}, ${estadoName}. Evalúa tu vivienda gratis, sin registro, en pocos minutos.`;
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
                name: estadoName,
                item: absoluteUrl(`/zona/${params.estado}`),
              },
              {
                "@type": "ListItem",
                position: 4,
                name: municipioName,
                item: url,
              },
            ],
          }),
        },
      ],
    };
  },
  component: MunicipioPage,
  notFoundComponent: MunicipioNotFound,
  errorComponent: MunicipioError,
});

function MunicipioPage() {
  const { estadoName, municipioName, stats } = Route.useLoaderData() as {
    estadoName: string;
    municipioName: string;
    stats: MunicipioStats;
  };
  const { t, lang } = useLang();
  const hasData = stats.total > 0;
  const estadoSlugValue = estadoSlug(estadoName);

  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          {t("zona.breadcrumbHome")}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link to="/mapa" className="hover:text-foreground">
          {t("map.title")}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link
          to="/zona/$estado"
          params={{ estado: estadoSlugValue }}
          className="hover:text-foreground"
        >
          {estadoName}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">{municipioName}</span>
      </nav>

      {/* Hero */}
      <header className="mt-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <MapPin className="size-3.5" aria-hidden />
          {t("municipio.eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {t("municipio.h1Prefix")} {municipioName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("municipio.intro")
            .replace("{municipio}", municipioName)
            .replace("{estado}", estadoName)}
        </p>
      </header>

      {/* Primary CTA */}
      <Button asChild size="lg" className="mt-5 w-full text-base font-semibold">
        <Link to="/assess/property" search={{ estado: estadoName }}>
          {t("municipio.ctaPrefix")} {municipioName}
          <ArrowRight className="size-5" />
        </Link>
      </Button>

      {/* Stats */}
      {hasData ? (
        <>
          <section className="mt-6">
            <Stat value={stats.total} label={t("municipio.totalReports")} />
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
                  label={t("municipio.totalReports")}
                />
              </div>
              {stats.lastReport && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("municipio.lastReport")}:{" "}
                  {formatDate(stats.lastReport, lang)}
                </p>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("municipio.notEnough").replace("{municipio}", municipioName)}
          </p>
        </section>
      )}

      {/* Back to state — full analysis lives at the state level */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold">
          {t("zona.aboutTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("zona.aboutBody")}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-primary">
          <Link
            to="/zona/$estado"
            params={{ estado: estadoSlugValue }}
            className="inline-flex items-center gap-1 hover:underline"
          >
            {t("municipio.backToState").replace("{estado}", estadoName)}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
          <Link
            to="/mapa"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <MapIcon className="size-4" aria-hidden />
            {t("zona.viewMap")}
          </Link>
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

function MunicipioNotFound() {
  const { t } = useLang();
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CircleAlert className="size-12 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-lg font-semibold">{t("municipio.notFound")}</p>
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

function MunicipioError() {
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
