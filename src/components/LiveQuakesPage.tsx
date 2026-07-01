import { queryOptions } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Info,
  MapPin,
  Radar,
  Waves,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/datetime";
import {
  getRecentVenezuelaQuakes,
  SIGNIFICANT_24H_MAG,
  type QuakeFeed,
} from "@/lib/quakes.functions";

/** Shared query for both language routes. Short stale time keeps it fresh. */
export const quakeFeedQuery = queryOptions({
  queryKey: ["venezuela-quakes"],
  queryFn: () => getRecentVenezuelaQuakes(),
  staleTime: 5 * 60 * 1000,
});

export const ES_PATH = "/temblo-en-venezuela-hoy";
export const EN_PATH = "/earthquake-in-venezuela-today";

export const LIVE_META = {
  es: {
    title: "¿Tembló en Venezuela hoy? Sismos recientes | EvalúaYa",
    description:
      "¿Tembló en Venezuela hoy? Mira los sismos recientes cerca de Venezuela (datos de USGS): magnitud, epicentro y hora. Si lo sentiste, revisa tu vivienda gratis.",
  },
  en: {
    title: "Earthquake in Venezuela today? Recent quakes | EvalúaYa",
    description:
      "Was there an earthquake in Venezuela today? See recent quakes near Venezuela (USGS data): magnitude, epicenter and time. Felt it? Check your home for free.",
  },
};

const COPY = {
  es: {
    kicker: "Sismos en vivo",
    h1: "¿Tembló en Venezuela hoy?",
    yesTitle: (n: number, mag: string) =>
      `Sí. Se registraron ${n} sismo${n === 1 ? "" : "s"} cerca de Venezuela en las últimas 24 horas` +
      (mag ? ` (el mayor de magnitud ${mag}).` : "."),
    noTitle:
      "No se han registrado sismos significativos cerca de Venezuela en las últimas 24 horas.",
    answerHint:
      "La magnitud no determina el daño en tu vivienda: depende de tu estructura, suelo y cercanía al epicentro. Si sentiste el movimiento, conviene revisar.",
    updated: "Actualizado",
    justNow: "hace instantes",
    minutesAgo: (m: number) => `hace ${m} min`,
    hoursAgo: (h: number) => `hace ${h} h`,
    source: "Fuente: USGS (Servicio Geológico de EE. UU.)",
    recentTitle: "Sismos recientes cerca de Venezuela",
    recentNote: "Últimos 7 días, magnitud 2.5 o mayor.",
    none7d: "No hay sismos de magnitud 2.5+ en los últimos 7 días.",
    depth: "prof.",
    fromCaracas: "de Caracas",
    felt: (n: number) => `${n} reportes de “lo sentí”`,
    statsToday: "últimas 24 h",
    stats7d: "últimos 7 días",
    stats30d: "últimos 30 días",
    ctaTitle: "¿Sentiste el temblor? Revisa tu vivienda",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita en pocos minutos. Sin registro y funciona con poca señal. Recibe un nivel de riesgo y pasos a seguir.",
    ctaButton: "Iniciar autoevaluación",
    funvisisLink: "Cómo leer un reporte de FUNVISIS",
    tremorLink: "Qué hacer después de un temblor",
    mapLink: "Ver el mapa de daños reportados",
    unavailableTitle: "No pudimos cargar los sismos en este momento",
    unavailableBody:
      "Vuelve a intentar en unos minutos. Para confirmar un sismo, consulta el reporte oficial de FUNVISIS.",
    faqTitle: "Preguntas frecuentes",
    disclaimer:
      "EvalúaYa no detecta sismos en tiempo real; mostramos datos públicos de USGS como referencia. Los reportes oficiales en Venezuela los publica FUNVISIS.",
  },
  en: {
    kicker: "Live quakes",
    h1: "Was there an earthquake in Venezuela today?",
    yesTitle: (n: number, mag: string) =>
      `Yes. ${n} earthquake${n === 1 ? "" : "s"} near Venezuela in the last 24 hours` +
      (mag ? ` (strongest magnitude ${mag}).` : "."),
    noTitle:
      "No significant earthquakes near Venezuela in the last 24 hours.",
    answerHint:
      "Magnitude doesn't determine the damage to your home: it depends on your structure, soil and distance from the epicenter. If you felt it, it's worth checking.",
    updated: "Updated",
    justNow: "just now",
    minutesAgo: (m: number) => `${m} min ago`,
    hoursAgo: (h: number) => `${h} h ago`,
    source: "Source: USGS (U.S. Geological Survey)",
    recentTitle: "Recent earthquakes near Venezuela",
    recentNote: "Last 7 days, magnitude 2.5 or higher.",
    none7d: "No magnitude 2.5+ earthquakes in the last 7 days.",
    depth: "depth",
    fromCaracas: "from Caracas",
    felt: (n: number) => `${n} “felt it” reports`,
    statsToday: "last 24 h",
    stats7d: "last 7 days",
    stats30d: "last 30 days",
    ctaTitle: "Felt the quake? Check your home",
    ctaBody:
      "Run a free, guided self-assessment in a few minutes. No sign-up, works on low bandwidth. Get a risk level and clear next steps.",
    ctaButton: "Start self-assessment",
    funvisisLink: "How to read a FUNVISIS report",
    tremorLink: "What to do after a tremor",
    mapLink: "See the reported-damage map",
    unavailableTitle: "We couldn't load earthquakes right now",
    unavailableBody:
      "Try again in a few minutes. To confirm a quake, check the official FUNVISIS report.",
    faqTitle: "Frequently asked questions",
    disclaimer:
      "EvalúaYa does not detect earthquakes in real time; we show public USGS data for reference. Official reports in Venezuela are published by FUNVISIS.",
  },
};

export const LIVE_FAQS: Record<"es" | "en", { q: string; a: string }[]> = {
  es: [
    {
      q: "¿Tembló en Venezuela hoy?",
      a: "En esta página mostramos los sismos registrados cerca de Venezuela en las últimas 24 horas según el USGS, con su magnitud, epicentro y hora. Si la lista de hoy está vacía, no se han registrado sismos de magnitud 2.5 o mayor. Para el reporte oficial venezolano, consulta FUNVISIS.",
    },
    {
      q: "¿De cuánto fue el temblor de hoy en Venezuela?",
      a: "La magnitud de cada sismo reciente aparece en la lista de esta página, junto con la profundidad y la distancia al epicentro. Mostramos eventos de magnitud 2.5 o mayor de los últimos días con datos de USGS.",
    },
    {
      q: "Si la magnitud fue baja, ¿debo revisar mi casa?",
      a: "Sí, si sentiste el movimiento o notas algo distinto. La magnitud no determina el daño en tu vivienda específica; eso depende de tu estructura, el suelo y la cercanía al epicentro. Una autoevaluación rápida toma pocos minutos.",
    },
    {
      q: "¿EvalúaYa detecta los sismos?",
      a: "No. EvalúaYa no detecta sismos en tiempo real. Mostramos datos públicos del USGS como referencia y te ayudamos a revisar si tu vivienda quedó segura. Los reportes oficiales en Venezuela los publica FUNVISIS.",
    },
  ],
  en: [
    {
      q: "Was there an earthquake in Venezuela today?",
      a: "This page shows earthquakes recorded near Venezuela in the last 24 hours according to USGS, with magnitude, epicenter and time. If today's list is empty, no quakes of magnitude 2.5 or higher were recorded. For the official Venezuelan report, check FUNVISIS.",
    },
    {
      q: "How big was today's earthquake in Venezuela?",
      a: "Each recent quake's magnitude appears in the list on this page, along with depth and distance from the epicenter. We show events of magnitude 2.5 or higher from recent days using USGS data.",
    },
    {
      q: "If the magnitude was low, should I check my home?",
      a: "Yes, if you felt the movement or notice something different. Magnitude doesn't determine the damage to your specific home; that depends on your structure, soil and proximity to the epicenter. A quick self-assessment takes a few minutes.",
    },
    {
      q: "Does EvalúaYa detect earthquakes?",
      a: "No. EvalúaYa does not detect earthquakes in real time. We show public USGS data for reference and help you check whether your home is safe. Official reports in Venezuela are published by FUNVISIS.",
    },
  ],
};

function magClasses(mag: number | null): string {
  if (mag == null) return "bg-muted text-muted-foreground";
  if (mag >= 5) return "bg-risk-red-soft text-risk-red";
  if (mag >= 4) return "bg-risk-orange-soft text-risk-orange";
  if (mag >= 3) return "bg-risk-yellow-soft text-risk-yellow";
  return "bg-secondary text-secondary-foreground";
}

export function LiveQuakesPage({ feed }: { feed: QuakeFeed }) {
  const { lang } = useLang();
  const c = COPY[lang];
  const faqs = LIVE_FAQS[lang];

  const now = Date.now();
  const recent = feed.quakes
    .filter((q) => now - Date.parse(q.time) <= 7 * 24 * 60 * 60 * 1000)
    .slice(0, 12);

  const ageMs = now - Date.parse(feed.updatedAt);
  const ageMin = Math.max(0, Math.round(ageMs / 60000));
  const updatedLabel =
    ageMin < 1
      ? c.justNow
      : ageMin < 60
        ? c.minutesAgo(ageMin)
        : c.hoursAgo(Math.round(ageMin / 60));

  const maxMagStr = feed.maxMag24h != null ? feed.maxMag24h.toFixed(1) : "";

  return (
    <AppShell>
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
      </header>

      {/* Answer-first card */}
      {feed.unavailable ? (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-muted-foreground" aria-hidden />
            <h2 className="font-display text-base font-bold">
              {c.unavailableTitle}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {c.unavailableBody}
          </p>
        </section>
      ) : (
        <section
          className={
            "mt-5 rounded-2xl border p-5 shadow-sm " +
            (feed.significantToday
              ? "border-risk-orange/40 bg-risk-orange-soft/40"
              : "border-risk-green/30 bg-risk-green-soft/40")
          }
        >
          <div className="flex items-start gap-3">
            <span
              className={
                "flex size-10 shrink-0 items-center justify-center rounded-xl " +
                (feed.significantToday
                  ? "bg-risk-orange/15 text-risk-orange"
                  : "bg-risk-green/15 text-risk-green")
              }
            >
              {feed.significantToday ? (
                <Waves className="size-5" aria-hidden />
              ) : (
                <CheckCircle2 className="size-5" aria-hidden />
              )}
            </span>
            <p className="text-base font-bold leading-snug">
              {feed.significantToday
                ? c.yesTitle(feed.count24h, maxMagStr)
                : c.noTitle}
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {c.answerHint}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {c.updated} {updatedLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Info className="size-3.5" aria-hidden />
              {c.source}
            </span>
          </div>
        </section>
      )}

      {/* Quick stats */}
      {!feed.unavailable && (
        <section className="mt-4 grid grid-cols-3 gap-3">
          {[
            { n: feed.count24h, label: c.statsToday },
            { n: feed.count7d, label: c.stats7d },
            { n: feed.count30d, label: c.stats30d },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm"
            >
              <p className="font-display text-2xl font-extrabold text-primary">
                {s.n}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Recent list */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.recentTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.recentNote}</p>

        {recent.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
            {c.none7d}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((q) => (
              <li key={q.id}>
                <a
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span
                    className={
                      "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl font-display font-extrabold " +
                      magClasses(q.mag)
                    }
                  >
                    <span className="text-base leading-none">
                      {q.mag != null ? q.mag.toFixed(1) : "—"}
                    </span>
                    <span className="text-[9px] font-semibold uppercase opacity-80">
                      M
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{q.place}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(q.time, lang)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="size-3" aria-hidden />
                        {q.distanceKm.toLocaleString()} km {c.fromCaracas}
                      </span>
                      {q.depthKm != null && (
                        <span>
                          {c.depth} {q.depthKm} km
                        </span>
                      )}
                      {q.felt != null && q.felt > 0 && (
                        <span className="text-primary">{c.felt(q.felt)}</span>
                      )}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CTA */}
      <section className="mt-8 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.ctaTitle}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.ctaBody}
        </p>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link to="/assess/property">
            {c.ctaButton}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="link" className="mt-1 w-full">
          <Link to="/guia/funvisis-que-es-y-como-funciona">
            {c.funvisisLink}
          </Link>
        </Button>
        <Button asChild variant="link" className="mt-1 w-full">
          <Link to="/guia/que-hacer-despues-de-un-temblor">{c.tremorLink}</Link>
        </Button>
        <Button asChild variant="link" className="mt-1 w-full">
          <Link to="/mapa">{c.mapLink}</Link>
        </Button>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.faqTitle}</h2>
        <Accordion type="single" collapsible className="mt-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          {c.disclaimer}
        </p>
      </section>
    </AppShell>
  );
}

/** Shared JSON-LD builder so both language routes emit consistent structured data. */
export function buildLiveSchemas(lang: "es" | "en", path: string, updatedAt: string) {
  const meta = LIVE_META[lang];
  const faqs = LIVE_FAQS[lang];
  const url = `https://evaluaya.app${path}`;
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name:
      lang === "es"
        ? "Sismos recientes cerca de Venezuela"
        : "Recent earthquakes near Venezuela",
    description: meta.description,
    url,
    inLanguage: lang,
    isAccessibleForFree: true,
    dateModified: updatedAt,
    creator: { "@type": "Organization", name: "EvalúaYa" },
    isBasedOn: "https://earthquake.usgs.gov/",
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return [dataset, faqSchema];
}

export { SIGNIFICANT_24H_MAG };
