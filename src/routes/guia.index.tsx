import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Landmark,
  Mountain,
  Radar,
  Ruler,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  EncyclopediaBreadcrumb,
  encyclopediaCrumbs,
} from "@/components/EncyclopediaBreadcrumb";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const PATH = "/guia";

const META = {
  es: {
    title: "Aprende sobre sismos en Venezuela | EvalúaYa",
    description:
      "Centro de información sobre sismos en Venezuela: qué hacer después de un temblor, cómo identificar grietas peligrosas, qué es FUNVISIS y la Falla de Boconó. Guías claras y gratuitas.",
  },
  en: {
    title: "Learn about earthquakes in Venezuela | EvalúaYa",
    description:
      "Information hub on earthquakes in Venezuela: what to do after a tremor, how to spot dangerous cracks, what FUNVISIS is, and the Boconó Fault. Clear, free guides.",
  },
};

type GuideLink = {
  to: string;
  icon: typeof BookOpen;
  title: string;
  desc: string;
};

type GuideGroup = {
  heading: string;
  items: GuideLink[];
};

const GROUPS: Record<"es" | "en", GuideGroup[]> = {
  es: [
    {
      heading: "Justo después de un temblor",
      items: [
        {
          to: "/guia/que-hacer-despues-de-un-temblor",
          icon: ShieldCheck,
          title: "Qué hacer después de un temblor",
          desc: "Pasos de seguridad en los primeros minutos y cuándo evacuar.",
        },
        {
          to: "/guia/grietas-peligrosas-despues-de-un-sismo",
          icon: Ruler,
          title: "Grietas peligrosas: cómo identificarlas",
          desc: "Distingue una fisura superficial de una grieta estructural, con fotos.",
        },
      ],
    },
    {
      heading: "Entender los sismos en Venezuela",
      items: [
        {
          to: "/guia/funvisis-que-es-y-como-funciona",
          icon: Landmark,
          title: "FUNVISIS: qué es y cómo leer sus reportes",
          desc: "El organismo oficial de sismología y cómo interpretar magnitud y epicentro.",
        },
        {
          to: "/guia/falla-de-bocono",
          icon: Mountain,
          title: "Falla de Boconó: qué es y qué estados cruza",
          desc: "La principal falla activa del occidente del país y su impacto.",
        },
        {
          to: "/temblo-en-venezuela-hoy",
          icon: Waves,
          title: "¿Tembló hoy? Sismos recientes",
          desc: "Sismos registrados cerca de Venezuela en las últimas horas (datos de USGS).",
        },
      ],
    },
    {
      heading: "Cómo funciona EvalúaYa",
      items: [
        {
          to: "/metodologia",
          icon: Radar,
          title: "Cómo funciona la metodología",
          desc: "Qué revisa la autoevaluación y cómo se calcula el nivel de riesgo.",
        },
        {
          to: "/ayuda",
          icon: HelpCircle,
          title: "Ayuda y preguntas frecuentes",
          desc: "Privacidad, uso sin conexión, resultados y cómo guardar tus reportes.",
        },
      ],
    },
  ],
  en: [
    {
      heading: "Right after a tremor",
      items: [
        {
          to: "/guia/que-hacer-despues-de-un-temblor",
          icon: ShieldCheck,
          title: "What to do after a tremor",
          desc: "Safety steps in the first minutes and when to evacuate.",
        },
        {
          to: "/guia/grietas-peligrosas-despues-de-un-sismo",
          icon: Ruler,
          title: "Dangerous cracks: how to identify them",
          desc: "Tell a cosmetic crack from a structural one, with photos.",
        },
      ],
    },
    {
      heading: "Understanding earthquakes in Venezuela",
      items: [
        {
          to: "/guia/funvisis-que-es-y-como-funciona",
          icon: Landmark,
          title: "FUNVISIS: what it is and how to read its reports",
          desc: "The official seismology agency and how to read magnitude and epicenter.",
        },
        {
          to: "/guia/falla-de-bocono",
          icon: Mountain,
          title: "Boconó Fault: what it is and the states it crosses",
          desc: "The country's main active western fault and its impact.",
        },
        {
          to: "/temblo-en-venezuela-hoy",
          icon: Waves,
          title: "Quake today? Recent earthquakes",
          desc: "Quakes recorded near Venezuela in recent hours (USGS data).",
        },
      ],
    },
    {
      heading: "How EvalúaYa works",
      items: [
        {
          to: "/metodologia",
          icon: Radar,
          title: "How the methodology works",
          desc: "What the self-assessment reviews and how the risk level is calculated.",
        },
        {
          to: "/ayuda",
          icon: HelpCircle,
          title: "Help and frequently asked questions",
          desc: "Privacy, offline use, results and how to save your reports.",
        },
      ],
    },
  ],
};

const FEATURED = {
  to: "/guia/proceso-oficial-funvisis",
  es: {
    badge: "Próximamente",
    title: "Proceso oficial de FUNVISIS",
    desc: "El procedimiento oficial paso a paso tras un sismo. La pieza central de la Enciclopedia.",
  },
  en: {
    badge: "Coming soon",
    title: "FUNVISIS official process",
    desc: "The official step-by-step procedure after an earthquake. The core of the Encyclopedia.",
  },
};

const COPY = {
  es: {
    kicker: "Enciclopedia",
    h1: "Enciclopedia",
    intro:
      "Todo en un solo lugar: qué hacer después de un temblor, cómo revisar tu vivienda, entender los sismos en Venezuela y cómo funciona EvalúaYa. Guías claras y gratuitas.",
    ctaTitle: "¿Sentiste un temblor?",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita en pocos minutos. Recibe una orientación y pasos a seguir.",
    ctaButton: "Iniciar autoevaluación",
    disclaimer:
      "EvalúaYa es una herramienta comunitaria gratuita. Orienta pero no reemplaza a un ingeniero civil colegiado ni la evaluación oficial de FUNVISIS o Protección Civil.",
  },
  en: {
    kicker: "Encyclopedia",
    h1: "Encyclopedia",
    intro:
      "Everything in one place: what to do after a tremor, how to check your home, understanding earthquakes in Venezuela, and how EvalúaYa works. Clear, free guides.",
    ctaTitle: "Felt a tremor?",
    ctaBody:
      "Run a free, guided self-assessment in a few minutes. Get guidance and clear next steps.",
    ctaButton: "Start self-assessment",
    disclaimer:
      "EvalúaYa is a free community tool. It offers guidance but does not replace a licensed civil engineer or an official assessment by FUNVISIS or Civil Protection.",
  },
};

export const Route = createFileRoute("/guia/")({
  head: () => {
    const { title, description } = META.es;
    const links = [
      { title: FEATURED.es.title, to: FEATURED.to },
      ...GROUPS.es.flatMap((g) => g.items),
    ];
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Aprende sobre sismos en Venezuela",
      description,
      url: absoluteUrl(PATH),
      itemListElement: links.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.title,
        url: absoluteUrl(item.to),
      })),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl(PATH) },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(PATH) }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(itemList) },
      ],
    };
  },
  component: GuideHub,
});

function GuideHub() {
  const { lang } = useLang();
  const c = COPY[lang];
  const groups = GROUPS[lang];
  const featured = FEATURED[lang];

  return (
    <AppShell>
      <EncyclopediaBreadcrumb items={encyclopediaCrumbs(lang)} />

      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <BookOpen className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* Featured: official FUNVISIS process */}
      <Link
        to={FEATURED.to}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm transition-colors hover:bg-primary/10"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Landmark className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            <Clock className="size-3" aria-hidden />
            {featured.badge}
          </span>
          <span className="mt-1 block font-display font-bold leading-tight">
            {featured.title}
          </span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
            {featured.desc}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-primary" aria-hidden />
      </Link>


      {/* Compact CTA */}
      <section className="mt-6 rounded-2xl border border-primary/20 bg-secondary/40 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.ctaTitle}</h2>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {c.ctaBody}
        </p>
        <Button asChild size="lg" className="mt-3 w-full">
          <Link to="/assess/property">
            {c.ctaButton}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {/* Guide groups */}
      {groups.map((group) => (
        <section key={group.heading} className="mt-8">
          <h2 className="font-display text-lg font-bold">{group.heading}</h2>
          <ul className="mt-3 space-y-2">
            {group.items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-tight">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-8 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-risk-green" aria-hidden />
        {c.disclaimer}
      </p>
    </AppShell>
  );
}
