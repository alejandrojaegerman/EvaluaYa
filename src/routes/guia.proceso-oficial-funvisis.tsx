import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Landmark,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  EncyclopediaBreadcrumb,
  breadcrumbJsonLd,
  encyclopediaCrumbs,
} from "@/components/EncyclopediaBreadcrumb";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const PATH = "/guia/proceso-oficial-funvisis";

const META = {
  es: {
    title: "Proceso oficial de FUNVISIS tras un sismo | EvalúaYa",
    description:
      "Guía del procedimiento oficial de FUNVISIS y Protección Civil después de un sismo en Venezuela: cuándo contactar, qué esperar y qué evidencia tener lista.",
  },
  en: {
    title: "FUNVISIS official process after an earthquake | EvalúaYa",
    description:
      "Guide to the official FUNVISIS and Civil Protection procedure after an earthquake in Venezuela: when to contact them, what to expect, and what evidence to have ready.",
  },
};

type Placeholder = { icon: typeof Landmark; title: string; desc: string };

const OUTLINE: Record<"es" | "en", Placeholder[]> = {
  es: [
    {
      icon: Phone,
      title: "Cuándo contactar a FUNVISIS / Protección Civil",
      desc: "En qué casos corresponde solicitar una evaluación oficial y a quién acudir.",
    },
    {
      icon: Clock,
      title: "Qué hacer mientras llega la evaluación oficial",
      desc: "Pasos de seguridad y precauciones mientras esperas la inspección profesional.",
    },
    {
      icon: FileText,
      title: "Documentos y evidencia que conviene tener",
      desc: "Fotos, ubicación y datos de la vivienda que agilizan el proceso oficial.",
    },
    {
      icon: ClipboardList,
      title: "Qué esperar del proceso paso a paso",
      desc: "El flujo oficial de la evaluación y qué significan sus resultados.",
    },
  ],
  en: [
    {
      icon: Phone,
      title: "When to contact FUNVISIS / Civil Protection",
      desc: "When it's appropriate to request an official assessment and whom to reach.",
    },
    {
      icon: Clock,
      title: "What to do while the official assessment arrives",
      desc: "Safety steps and precautions while you wait for the professional inspection.",
    },
    {
      icon: FileText,
      title: "Documents and evidence to have ready",
      desc: "Photos, location, and home details that speed up the official process.",
    },
    {
      icon: ClipboardList,
      title: "What to expect step by step",
      desc: "The official assessment flow and what its results mean.",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Proceso oficial",
    h1: "Proceso oficial de FUNVISIS",
    intro:
      "El procedimiento oficial que siguen FUNVISIS y Protección Civil para evaluar viviendas después de un sismo. Es la referencia central de esta Enciclopedia.",
    soonTitle: "Próximamente",
    soonBody:
      "Estamos documentando el proceso oficial paso a paso con fuentes verificadas. Pronto encontrarás aquí la guía completa. Mientras tanto, EvalúaYa te orienta con una autoevaluación rápida.",
    outlineTitle: "Qué incluirá esta guía",
    ctaTitle: "Mientras tanto, revisa tu vivienda",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita en pocos minutos. Sin registro y funciona con poca señal.",
    ctaButton: "Iniciar autoevaluación",
    note: "Esta sección es una referencia educativa en construcción. Los procedimientos y reportes oficiales los definen FUNVISIS y Protección Civil.",
  },
  en: {
    kicker: "Official process",
    h1: "FUNVISIS official process",
    intro:
      "The official procedure FUNVISIS and Civil Protection follow to assess homes after an earthquake. It's the central reference of this Encyclopedia.",
    soonTitle: "Coming soon",
    soonBody:
      "We're documenting the official process step by step with verified sources. The full guide will be here soon. Meanwhile, EvalúaYa helps with a quick self-assessment.",
    outlineTitle: "What this guide will cover",
    ctaTitle: "In the meantime, check your home",
    ctaBody:
      "Run a free, guided self-assessment in a few minutes. No sign-up, works on low bandwidth.",
    ctaButton: "Start self-assessment",
    note: "This section is an educational reference under construction. Official procedures and reports are defined by FUNVISIS and Civil Protection.",
  },
};

export const Route = createFileRoute("/guia/proceso-oficial-funvisis")({
  head: () => {
    const { title, description } = META.es;
    const crumbs = encyclopediaCrumbs("es", {
      label: "Proceso oficial de FUNVISIS",
    });
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
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd(crumbs)),
        },
      ],
    };
  },
  component: FunvisisProcessPage,
});

function FunvisisProcessPage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const outline = OUTLINE[lang];

  return (
    <AppShell>
      <EncyclopediaBreadcrumb items={encyclopediaCrumbs(lang, { label: c.h1 })} />

      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Landmark className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* Coming soon */}
      <section className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
          <Clock className="size-3.5" aria-hidden />
          {c.soonTitle}
        </span>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {c.soonBody}
        </p>
      </section>

      {/* Outline of upcoming content */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.outlineTitle}</h2>
        <ul className="mt-3 space-y-2">
          {outline.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">{item.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA to assessment */}
      <section className="mt-8 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
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
      </section>

      <p className="mt-8 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        {c.note}
      </p>
    </AppShell>
  );
}
