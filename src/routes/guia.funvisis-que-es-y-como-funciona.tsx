import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Info,
  Landmark,
  Radar,
  ShieldCheck,
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
import { absoluteUrl } from "@/lib/site";

const PATH = "/guia/funvisis-que-es-y-como-funciona";

const META = {
  es: {
    title: "FUNVISIS: qué es y cómo leer sus reportes sísmicos | EvalúaYa",
    description:
      "Qué es FUNVISIS, el organismo oficial de sismología de Venezuela, cómo leer sus reportes de magnitud y epicentro, y cómo EvalúaYa complementa su trabajo.",
  },
  en: {
    title: "FUNVISIS: what it is and how to read its seismic reports | EvalúaYa",
    description:
      "What FUNVISIS is, Venezuela's official seismological agency, how to read its magnitude and epicenter reports, and how EvalúaYa complements its work.",
  },
};

type Section = { icon: typeof Landmark; title: string; body: string };

const SECTIONS: Record<"es" | "en", Section[]> = {
  es: [
    {
      icon: Landmark,
      title: "¿Qué es FUNVISIS?",
      body: "La Fundación Venezolana de Investigaciones Sismológicas (FUNVISIS) es el organismo científico oficial encargado de estudiar y vigilar la actividad sísmica en Venezuela. Adscrita al Estado, opera la red sismológica nacional, investiga las fallas geológicas activas del país y produce los mapas de amenaza sísmica que sirven de base para las normas de construcción.",
    },
    {
      icon: Radar,
      title: "Cómo monitorea los sismos",
      body: "FUNVISIS mantiene estaciones sismológicas distribuidas por todo el territorio que registran el movimiento del suelo en tiempo real. Cuando ocurre un sismo, sus analistas determinan la magnitud, la profundidad y la ubicación del epicentro, y publican un reporte oficial. Es la fuente autorizada para confirmar si realmente tembló y con qué intensidad.",
    },
    {
      icon: Activity,
      title: "Cómo leer un reporte de FUNVISIS",
      body: "Un reporte típico indica la fecha y hora, la magnitud (escala de Richter/momento), la profundidad en kilómetros y el epicentro (ubicación con coordenadas y referencia geográfica). A mayor magnitud y menor profundidad, mayor suele ser el sacudimiento percibido. Un sismo lejano o profundo puede sentirse poco aunque su magnitud sea alta.",
    },
    {
      icon: Building2,
      title: "Magnitud no es lo mismo que daño",
      body: "El reporte de FUNVISIS te dice qué tan fuerte fue el sismo, pero no si tu vivienda quedó dañada. Dos casas cerca del mismo epicentro pueden quedar muy distintas según su estructura, edad y construcción. Por eso, tras confirmar un sismo con FUNVISIS, conviene revisar tu propia vivienda.",
    },
  ],
  en: [
    {
      icon: Landmark,
      title: "What is FUNVISIS?",
      body: "The Venezuelan Foundation for Seismological Research (FUNVISIS) is the official scientific body responsible for studying and monitoring seismic activity in Venezuela. As a state institution, it operates the national seismological network, researches the country's active geological faults, and produces the seismic hazard maps that underpin construction codes.",
    },
    {
      icon: Radar,
      title: "How it monitors earthquakes",
      body: "FUNVISIS maintains seismological stations across the country that record ground motion in real time. When an earthquake occurs, its analysts determine the magnitude, depth, and epicenter location, and publish an official report. It is the authoritative source for confirming whether a tremor actually happened and how intense it was.",
    },
    {
      icon: Activity,
      title: "How to read a FUNVISIS report",
      body: "A typical report shows the date and time, the magnitude (Richter/moment scale), the depth in kilometers, and the epicenter (location with coordinates and a geographic reference). Higher magnitude and shallower depth usually mean stronger shaking. A distant or deep earthquake may be felt little even if its magnitude is high.",
    },
    {
      icon: Building2,
      title: "Magnitude is not the same as damage",
      body: "A FUNVISIS report tells you how strong the earthquake was, but not whether your home was damaged. Two houses near the same epicenter can end up very differently depending on their structure, age, and construction. That's why, after confirming a quake with FUNVISIS, it's worth checking your own home.",
    },
  ],
};

const FAQS: Record<"es" | "en", { q: string; a: string }[]> = {
  es: [
    {
      q: "¿EvalúaYa es lo mismo que FUNVISIS?",
      a: "No. FUNVISIS es el organismo oficial que detecta y reporta los sismos y estudia las fallas del país. EvalúaYa es una herramienta comunitaria gratuita que te ayuda a revisar si tu vivienda quedó segura después de un temblor. Se complementan: FUNVISIS confirma el sismo, EvalúaYa te ayuda con tu casa.",
    },
    {
      q: "¿Dónde veo el reporte oficial de un sismo?",
      a: "Los reportes oficiales de magnitud, profundidad y epicentro los publica FUNVISIS, el organismo científico de sismología de Venezuela. EvalúaYa no detecta sismos en tiempo real.",
    },
    {
      q: "Si la magnitud fue baja, ¿igual debo revisar mi casa?",
      a: "Sí, si sentiste el movimiento o notas algo distinto. La magnitud reportada por FUNVISIS no determina el daño en tu vivienda específica; eso depende de tu estructura, suelo y cercanía al epicentro. Una revisión rápida toma pocos minutos.",
    },
    {
      q: "¿Cómo complementa EvalúaYa el trabajo de FUNVISIS?",
      a: "FUNVISIS aporta la ciencia oficial del sismo a nivel nacional. EvalúaYa lleva esa información al nivel de tu vivienda: con una autoevaluación guiada revisas columnas, vigas, muros y escaleras, obtienes un nivel de riesgo y, si hace falta, te conectamos con ingenieros voluntarios verificados.",
    },
    {
      q: "¿Cómo veo los sismos recientes en Venezuela?",
      a: "En EvalúaYa puedes ver una lista de sismos recientes cerca de Venezuela en la página “¿Tembló en Venezuela hoy?”, con magnitud, epicentro y hora a partir de datos públicos del USGS. Para el reporte oficial venezolano, consulta FUNVISIS. Si sentiste el movimiento, conviene revisar tu vivienda.",
    },
    {
      q: "Vi en FUNVISIS que tembló hoy. ¿Y ahora qué hago?",
      a: "Primero confirma que estás a salvo. Luego, aunque la magnitud parezca baja, revisa tu vivienda: la magnitud de FUNVISIS no determina el daño en tu casa específica. Una autoevaluación guiada y gratuita en EvalúaYa toma pocos minutos y te dice si es seguro quedarte, limitar el uso o evacuar.",
    },
  ],
  en: [
    {
      q: "Is EvalúaYa the same as FUNVISIS?",
      a: "No. FUNVISIS is the official agency that detects and reports earthquakes and studies the country's faults. EvalúaYa is a free community tool that helps you check whether your home is safe after a tremor. They complement each other: FUNVISIS confirms the quake, EvalúaYa helps with your house.",
    },
    {
      q: "Where do I see the official report of an earthquake?",
      a: "Official reports on magnitude, depth, and epicenter are published by FUNVISIS, Venezuela's scientific seismology agency. EvalúaYa does not detect earthquakes in real time.",
    },
    {
      q: "If the magnitude was low, should I still check my home?",
      a: "Yes, if you felt the movement or notice something different. The magnitude reported by FUNVISIS doesn't determine the damage to your specific home; that depends on your structure, soil, and proximity to the epicenter. A quick review takes a few minutes.",
    },
    {
      q: "How does EvalúaYa complement FUNVISIS's work?",
      a: "FUNVISIS provides the official science of the earthquake at the national level. EvalúaYa brings that information down to your home: with a guided self-assessment you review columns, beams, walls, and stairs, get a risk level, and if needed, we connect you with verified volunteer engineers.",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Guía sísmica",
    h1: "FUNVISIS: qué es y cómo funciona",
    intro:
      "FUNVISIS es el organismo oficial que vigila los sismos en Venezuela. Entender qué hace y cómo leer sus reportes te ayuda a reaccionar mejor cuando tiembla.",
    sectionsTitle: "Lo esencial sobre FUNVISIS",
    ctaTitle: "Confirma el sismo, luego revisa tu vivienda",
    ctaBody:
      "Después de ver el reporte de FUNVISIS, haz una autoevaluación guiada y gratuita en pocos minutos. Sin registro y funciona con poca señal.",
    ctaButton: "Iniciar autoevaluación",
    tremorLink: "Qué hacer después de un temblor",
    boconoLink: "Falla de Boconó: la principal falla activa",
    faqTitle: "Preguntas frecuentes",
    sourceNote:
      "Información de referencia educativa. Los reportes oficiales de sismos y estudios de peligro sísmico los publica FUNVISIS.",
  },
  en: {
    kicker: "Seismic guide",
    h1: "FUNVISIS: what it is and how it works",
    intro:
      "FUNVISIS is the official agency that monitors earthquakes in Venezuela. Understanding what it does and how to read its reports helps you react better when the ground shakes.",
    sectionsTitle: "The essentials about FUNVISIS",
    ctaTitle: "Confirm the quake, then check your home",
    ctaBody:
      "After seeing the FUNVISIS report, run a free, guided self-assessment in a few minutes. No sign-up, works on low bandwidth.",
    ctaButton: "Start self-assessment",
    tremorLink: "What to do after a tremor",
    boconoLink: "Boconó Fault: the main active fault",
    faqTitle: "Frequently asked questions",
    sourceNote:
      "Educational reference information. Official earthquake reports and seismic hazard studies are published by FUNVISIS.",
  },
};

export const Route = createFileRoute("/guia/funvisis-que-es-y-como-funciona")({
  head: () => {
    const { title, description } = META.es;
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "FUNVISIS: qué es y cómo leer sus reportes sísmicos",
      description,
      inLanguage: "es",
      url: absoluteUrl(PATH),
      about: "FUNVISIS",
    };
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.es.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(PATH) },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(PATH) }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(article) },
        { type: "application/ld+json", children: JSON.stringify(faqSchema) },
      ],
    };
  },
  component: FunvisisPage,
});

function FunvisisPage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const sections = SECTIONS[lang];
  const faqs = FAQS[lang];

  return (
    <AppShell>
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Radar className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* Sections */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.sectionsTitle}</h2>
        <div className="mt-4 space-y-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <section.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">{section.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA to assessment */}
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
          <Link to="/guia/que-hacer-despues-de-un-temblor">{c.tremorLink}</Link>
        </Button>
        <Button asChild variant="link" className="mt-1 w-full">
          <Link to="/guia/falla-de-bocono">{c.boconoLink}</Link>
        </Button>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.faqTitle}</h2>
        </div>
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
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 text-primary" aria-hidden />
          {c.sourceNote}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-risk-green" aria-hidden />
          {lang === "es"
            ? "EvalúaYa es una herramienta comunitaria gratuita. No reemplaza la evaluación de un ingeniero."
            : "EvalúaYa is a free community tool. It does not replace an engineer's evaluation."}
        </p>
      </section>
    </AppShell>
  );
}
