import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Landmark, Phone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { OfficialDirectory } from "@/components/OfficialDirectory";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const PATH = "/contactos-oficiales";

const META = {
  es: {
    title: "Contactos oficiales tras un sismo en Venezuela | EvalúaYa",
    description:
      "Directorio oficial verificado: Protección Civil, VEN 9-1-1, Bomberos, Cruz Roja y FUNVISIS. Toca para llamar y solicitar la evaluación oficial de tu edificio.",
  },
  en: {
    title: "Official contacts after an earthquake in Venezuela | EvalúaYa",
    description:
      "Verified official directory: Civil Protection, VEN 9-1-1, Fire Dept, Red Cross and FUNVISIS. Tap to call and request your building's official assessment.",
  },
};

const COPY = {
  es: {
    kicker: "Directorio oficial",
    h1: "Contactos oficiales",
    intro:
      "EvalúaYa es solo una verificación visual rápida. La evaluación oficial y la etiqueta la realiza personal certificado por la autoridad. Aquí tienes los números oficiales a un toque.",
    processTitle: "¿Cómo funciona el proceso oficial?",
    processBody:
      "Conoce las fases oficiales y qué pasos tomar después de tu autoevaluación.",
    processCta: "Ver el proceso oficial",
  },
  en: {
    kicker: "Official directory",
    h1: "Official contacts",
    intro:
      "EvalúaYa is only a quick visual check. The official assessment and label are carried out by personnel certified by the authority. Here are the official numbers, one tap away.",
    processTitle: "How does the official process work?",
    processBody:
      "Learn the official phases and the steps to take after your self-assessment.",
    processCta: "See the official process",
  },
};

export const Route = createFileRoute("/contactos-oficiales")({
  head: () => {
    const { title, description } = META.es;
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
    };
  },
  component: OfficialContactsPage,
});

function OfficialContactsPage() {
  const { lang } = useLang();
  const c = COPY[lang];

  return (
    <AppShell>
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Phone className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      <div className="mt-6">
        <OfficialDirectory sos showHeader={false} />
      </div>

      <section className="mt-8 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.processTitle}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.processBody}
        </p>
        <Button asChild size="lg" variant="outline" className="mt-4 w-full">
          <Link to="/guia/proceso-oficial-funvisis">
            {c.processCta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </AppShell>
  );
}
