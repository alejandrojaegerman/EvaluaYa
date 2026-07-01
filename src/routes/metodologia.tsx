import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileDown,
  HardHat,
  Info,
  Layers,
  MapPin,
  ScrollText,
  ShieldAlert,
  TriangleAlert,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  EncyclopediaBreadcrumb,
  breadcrumbJsonLd,
  type Crumb,
} from "@/components/EncyclopediaBreadcrumb";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

/** Top-level trail for the (now standalone) methodology page. */
function methodologyCrumbs(lang: "es" | "en", label: string): Crumb[] {
  return [{ label: lang === "es" ? "Inicio" : "Home", to: "/" }, { label }];
}

export const Route = createFileRoute("/metodologia")({
  head: () => {
    const title = "Cómo funciona — Metodología y credibilidad | EvalúaYa";
    const description =
      "Cómo EvalúaYa calcula el resultado: reglas tipo ATC-20, intensidad sísmica USGS ShakeMap y análisis con IA. Fuentes, límites y privacidad.";
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      inLanguage: "es",
      url: absoluteUrl("/metodologia"),
      mainEntityOfPage: absoluteUrl("/metodologia"),
      author: { "@type": "Organization", name: "EvalúaYa" },
      publisher: { "@type": "Organization", name: "EvalúaYa" },
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl("/metodologia") },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/metodologia") }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(articleSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd(
              encyclopediaCrumbs("es", {
                label: "Cómo funciona la metodología",
              }),
            ),
          ),
        },
      ],
    };
  },
  component: MethodologyPage,
});

function MethodologyPage() {
  const { t, lang } = useLang();

  const redItems = [
    t("methodology.red.urm"),
    t("methodology.red.liquefaction"),
    t("methodology.red.pounding"),
    t("methodology.red.plumbing"),
    t("methodology.red.combo"),
  ];
  const orangeItems = [
    t("methodology.orange.urm"),
    t("methodology.orange.severe"),
    t("methodology.orange.spectral"),
    t("methodology.orange.soil"),
  ];
  const yellowItems = [
    t("methodology.yellow.intensity"),
    t("methodology.yellow.soil"),
    t("methodology.yellow.floors"),
    t("methodology.yellow.structure"),
  ];
  const sources = [
    t("methodology.source.atc20"),
    t("methodology.source.usgs"),
    t("methodology.source.urm"),
    t("methodology.source.ai"),
  ];
  const limits = [
    t("methodology.limit.notCert"),
    t("methodology.limit.surface"),
    t("methodology.limit.depends"),
    t("methodology.limit.privacy"),
  ];

  return (
    <AppShell>
      <EncyclopediaBreadcrumb
        items={encyclopediaCrumbs(lang, { label: t("methodology.title") })}
      />
      {/* Header */}
      <header>
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <BookOpen className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {t("methodology.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("methodology.subtitle")}
        </p>
        <p className="mt-4 text-sm leading-relaxed">{t("methodology.intro")}</p>
      </header>

      {/* Two layers */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.layersTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("methodology.layersIntro")}
        </p>

        {/* Layer 1 */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="font-semibold">{t("methodology.layerA.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("methodology.layerA.body")}
          </p>

          <div className="mt-4 rounded-xl border border-risk-red/30 bg-risk-red-soft/50 p-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-risk-red" aria-hidden />
              <p className="text-sm font-semibold text-risk-red">
                {t("methodology.red.title")}
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {redItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk-red"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 rounded-xl border border-risk-orange/40 bg-risk-orange-soft/50 p-3">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-risk-orange" aria-hidden />
              <p className="text-sm font-semibold text-risk-orange">
                {t("methodology.orange.title")}
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {orangeItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk-orange"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>



          <div className="mt-3 rounded-xl border border-risk-yellow/40 bg-risk-yellow-soft/50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-risk-yellow" aria-hidden />
              <p className="text-sm font-semibold text-risk-yellow">
                {t("methodology.yellow.title")}
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {yellowItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk-yellow"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Layer 2 */}
        <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="font-semibold">{t("methodology.layerB.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("methodology.layerB.body")}
          </p>
        </div>
      </section>

      {/* Checklist */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.checklistTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("methodology.checklistBody")}
        </p>
      </section>

      {/* Seismic context */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.seismicTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("methodology.seismicBody")}
        </p>
      </section>

      {/* Volunteer engineer network — recruit → validate → connect */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <HardHat className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("engineers.methodologyTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("engineers.methodologyBody")}
        </p>
        <ol className="mt-3 space-y-2">
          {[
            { n: 1, title: t("engineers.recruit"), desc: t("engineers.recruitDesc") },
            { n: 2, title: t("engineers.validate"), desc: t("engineers.validateDesc") },
            { n: 3, title: t("engineers.connect"), desc: t("engineers.connectDesc") },
          ].map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 text-sm shadow-sm"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {step.n}
              </span>
              <span>
                <span className="font-semibold">{step.title}.</span>{" "}
                <span className="text-muted-foreground">{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Sources */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.sourcesTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("methodology.sourcesIntro")}
        </p>
        <ul className="mt-3 space-y-2">
          {sources.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 text-sm shadow-sm"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Limits */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.limitsTitle")}
          </h2>
        </div>
        <ul className="mt-3 space-y-2">
          {limits.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-sm"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("methodology.maintainedBy")}
        </p>
      </section>

      {/* For engineers — downloadable technical spec */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileDown className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("methodology.engineersTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("methodology.engineersBody")}
        </p>
        <Button asChild size="lg" variant="outline" className="mt-4 w-full">
          <a
            href={lang === "es" ? "/evaluaya-spec-es.pdf" : "/evaluaya-spec-en.pdf"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileDown className="size-4" aria-hidden />
            {t("methodology.specDownload")}
          </a>
        </Button>
        <Button asChild size="lg" variant="ghost" className="mt-2 w-full">
          <Link to="/voluntarios">
            <HardHat className="size-4" aria-hidden />
            {t("connect.areEngineer")}
          </Link>
        </Button>

      </section>


      {/* CTA */}

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
        <h2 className="font-display text-lg font-bold">
          {t("methodology.ctaTitle")}
        </h2>
        <Button asChild size="lg" className="mt-3 w-full">
          <Link to="/assess/property">
            {t("methodology.cta")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("methodology.disclaimer")}
        </p>
      </section>
    </AppShell>
  );
}
