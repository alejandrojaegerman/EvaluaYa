import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Info,
  Landmark,
  MapPin,
  Mountain,
  ShieldCheck,
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
import { absoluteUrl } from "@/lib/site";

const PATH = "/guia/falla-de-bocono";

const STATES = [
  "Táchira",
  "Mérida",
  "Trujillo",
  "Lara",
  "Yaracuy",
  "Carabobo",
  "Aragua",
  "Miranda",
];

const META = {
  es: {
    title: "Falla de Boconó: qué es y qué estados cruza | EvalúaYa",
    description:
      "Qué es la Falla de Boconó, los estados que atraviesa y su impacto en la sismicidad de Venezuela. Guía informativa con autoevaluación de daños gratis.",
  },
  en: {
    title: "Boconó Fault: what it is and the states it crosses | EvalúaYa",
    description:
      "What the Boconó Fault is, the states it crosses, and its impact on Venezuela's seismicity. Informative guide with a free damage self-assessment.",
  },
};

type Section = { icon: typeof Mountain; title: string; body: string };

const SECTIONS: Record<"es" | "en", Section[]> = {
  es: [
    {
      icon: Mountain,
      title: "¿Qué es la Falla de Boconó?",
      body: "La Falla de Boconó es la principal falla geológica activa del occidente de Venezuela. Se trata de una falla de desplazamiento horizontal (rumbo-deslizante dextral) que recorre los Andes venezolanos a lo largo de unos 500 km. Marca el límite entre la placa Caribe y la placa Suramericana, y es una de las fuentes sísmicas más importantes del país.",
    },
    {
      icon: MapPin,
      title: "¿Por qué estados pasa?",
      body: "La traza de la falla cruza el occidente y centro-norte del país: Táchira, Mérida, Trujillo, Lara, Yaracuy, Carabobo, Aragua y se conecta hacia Miranda. Las poblaciones cercanas a la traza —incluida la ciudad de Boconó, que le da el nombre— tienen mayor exposición al peligro sísmico.",
    },
    {
      icon: Landmark,
      title: "Su impacto en la historia sísmica",
      body: "La Falla de Boconó ha sido asociada a varios de los sismos más fuertes de Venezuela, como el terremoto de Mérida de 1812 y el de El Tocuyo de 1950. Por eso FUNVISIS, el organismo oficial de investigación sismológica, la monitorea de forma permanente como parte del estudio del peligro sísmico nacional.",
    },
    {
      icon: ShieldCheck,
      title: "Qué significa para tu vivienda",
      body: "Vivir cerca de una falla activa no significa que tu casa esté en peligro hoy, pero sí que conviene saber cómo responde tu vivienda ante un sismo. Conocer el estado de columnas, vigas y muros te permite actuar a tiempo si ocurre un temblor.",
    },
  ],
  en: [
    {
      icon: Mountain,
      title: "What is the Boconó Fault?",
      body: "The Boconó Fault is the main active geological fault in western Venezuela. It is a right-lateral strike-slip fault that runs through the Venezuelan Andes for roughly 500 km. It marks the boundary between the Caribbean and South American plates and is one of the country's most important seismic sources.",
    },
    {
      icon: MapPin,
      title: "Which states does it cross?",
      body: "The fault trace crosses western and north-central Venezuela: Táchira, Mérida, Trujillo, Lara, Yaracuy, Carabobo, Aragua, and connects toward Miranda. Communities near the trace — including the town of Boconó, which gives it its name — have higher exposure to seismic hazard.",
    },
    {
      icon: Landmark,
      title: "Its impact on seismic history",
      body: "The Boconó Fault has been linked to several of Venezuela's strongest earthquakes, such as the 1812 Mérida earthquake and the 1950 El Tocuyo earthquake. For this reason FUNVISIS, the official seismological research agency, monitors it continuously as part of the national seismic hazard assessment.",
    },
    {
      icon: ShieldCheck,
      title: "What it means for your home",
      body: "Living near an active fault doesn't mean your home is in danger today, but it's worth knowing how your home responds to an earthquake. Knowing the condition of columns, beams and walls lets you act in time if a tremor occurs.",
    },
  ],
};

const FAQS: Record<"es" | "en", { q: string; a: string }[]> = {
  es: [
    {
      q: "¿La Falla de Boconó puede causar un terremoto grande?",
      a: "Es una falla activa capaz de generar sismos de magnitud importante, como ya ocurrió históricamente. No se puede predecir cuándo, por eso la mejor protección es tener una vivienda que sepas que es segura y un plan de respuesta.",
    },
    {
      q: "¿Vivo cerca de la falla, debo preocuparme?",
      a: "No es para alarmarse, sino para estar preparado. Si vives en Táchira, Mérida, Trujillo, Lara, Yaracuy, Carabobo, Aragua o Miranda, vale la pena conocer el estado estructural de tu vivienda y revisar tu plan familiar ante sismos.",
    },
    {
      q: "¿Dónde confirmo información oficial sobre sismos?",
      a: "FUNVISIS publica los reportes oficiales de magnitud, epicentro y estudios de fallas. EvalúaYa no detecta sismos en tiempo real: te ayuda a revisar si tu vivienda quedó segura después de un temblor.",
    },
    {
      q: "¿Cómo reviso si mi casa es segura?",
      a: "Con la autoevaluación guiada de EvalúaYa revisas columnas, vigas, muros y escaleras en pocos minutos, gratis y sin registro. Obtienes un nivel de riesgo y pasos a seguir.",
    },
  ],
  en: [
    {
      q: "Can the Boconó Fault cause a large earthquake?",
      a: "It is an active fault capable of generating significant earthquakes, as has happened historically. When can't be predicted, so the best protection is a home you know is safe and a response plan.",
    },
    {
      q: "I live near the fault — should I worry?",
      a: "It's not about alarm, it's about being prepared. If you live in Táchira, Mérida, Trujillo, Lara, Yaracuy, Carabobo, Aragua or Miranda, it's worth knowing your home's structural condition and reviewing your family earthquake plan.",
    },
    {
      q: "Where do I confirm official earthquake information?",
      a: "FUNVISIS publishes official reports on magnitude, epicenter and fault studies. EvalúaYa doesn't detect quakes in real time — it helps you check whether your home is safe after a tremor.",
    },
    {
      q: "How do I check if my home is safe?",
      a: "With EvalúaYa's guided self-assessment you review columns, beams, walls and stairs in a few minutes, for free and without sign-up. You get a risk level and next steps.",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Guía sísmica",
    h1: "Falla de Boconó: la principal falla activa de Venezuela",
    intro:
      "La Falla de Boconó es la fuente sísmica más relevante del occidente venezolano. Entender qué es, por dónde pasa y su historia te ayuda a estar mejor preparado.",
    statesTitle: "Estados que atraviesa la traza",
    sectionsTitle: "Lo esencial sobre la falla",
    ctaTitle: "Revisa si tu vivienda es segura",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita en pocos minutos. Sin registro y funciona con poca señal.",
    ctaButton: "Iniciar autoevaluación",
    tremorLink: "Qué hacer después de un temblor",
    faqTitle: "Preguntas frecuentes",
    sourceNote:
      "Información de referencia educativa. Los estudios oficiales de fallas y peligro sísmico los publica FUNVISIS.",
  },
  en: {
    kicker: "Seismic guide",
    h1: "Boconó Fault: Venezuela's main active fault",
    intro:
      "The Boconó Fault is the most relevant seismic source in western Venezuela. Understanding what it is, where it runs, and its history helps you be better prepared.",
    statesTitle: "States the trace crosses",
    sectionsTitle: "The essentials about the fault",
    ctaTitle: "Check whether your home is safe",
    ctaBody:
      "Run a free, guided self-assessment in a few minutes. No sign-up, works on low bandwidth.",
    ctaButton: "Start self-assessment",
    tremorLink: "What to do after a tremor",
    faqTitle: "Frequently asked questions",
    sourceNote:
      "Educational reference information. Official fault and seismic hazard studies are published by FUNVISIS.",
  },
};

export const Route = createFileRoute("/guia/falla-de-bocono")({
  head: () => {
    const { title, description } = META.es;
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Falla de Boconó: qué es y qué estados cruza",
      description,
      inLanguage: "es",
      url: absoluteUrl(PATH),
      about: "Falla de Boconó",
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
  component: BoconoPage,
});

function BoconoPage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const sections = SECTIONS[lang];
  const faqs = FAQS[lang];

  return (
    <AppShell>
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Waves className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* States */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.statesTitle}</h2>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STATES.map((s) => (
            <li
              key={s}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium shadow-sm"
            >
              {s}
            </li>
          ))}
        </ul>
      </section>

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
