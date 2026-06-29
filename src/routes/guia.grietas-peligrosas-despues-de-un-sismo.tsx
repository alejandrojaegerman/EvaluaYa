import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Ruler,
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

import crackCosmetic from "@/assets/cracks/crack-cosmetic.jpg";
import crackVertical from "@/assets/cracks/crack-vertical.jpg";
import crackDiagonal from "@/assets/cracks/crack-diagonal.jpg";
import crackRebar from "@/assets/cracks/crack-rebar.jpg";

const PATH = "/guia/grietas-peligrosas-despues-de-un-sismo";

const META = {
  es: {
    title: "Grietas peligrosas después de un sismo: cómo identificarlas | EvalúaYa",
    description:
      "Aprende a distinguir una grieta superficial de una estructural tras un temblor: fisuras finas, verticales, diagonales y en X, y concreto con cabilla expuesta. Con fotos y autoevaluación gratis.",
  },
  en: {
    title: "Dangerous cracks after an earthquake: how to identify them | EvalúaYa",
    description:
      "Learn to tell a cosmetic crack from a structural one after a tremor: hairline, vertical, diagonal and X-shaped cracks, and exposed rebar. With photos and a free self-assessment.",
  },
};

type Level = "green" | "yellow" | "red";

type CrackType = {
  img: string;
  alt: string;
  level: Level;
  badge: string;
  name: string;
  desc: string;
  verdict: string;
};

const LEVEL_STYLES: Record<
  Level,
  { border: string; badge: string; verdict: string }
> = {
  green: {
    border: "border-risk-green/40",
    badge: "bg-risk-green-soft text-risk-green",
    verdict: "text-risk-green",
  },
  yellow: {
    border: "border-risk-yellow/40",
    badge: "bg-risk-yellow-soft text-risk-yellow",
    verdict: "text-risk-yellow",
  },
  red: {
    border: "border-risk-red/40",
    badge: "bg-risk-red-soft text-risk-red",
    verdict: "text-risk-red",
  },
};

const CRACK_TYPES: Record<"es" | "en", CrackType[]> = {
  es: [
    {
      img: crackCosmetic,
      alt: "Pared con fisuras finas tipo telaraña en la pintura",
      level: "green",
      badge: "Probablemente superficial",
      name: "Fisuras finas (capilares)",
      desc: "Líneas muy delgadas, como cabellos, solo en la pintura o el friso. Más finas que una tarjeta y sin desnivel entre los bordes. Suelen ser cosméticas.",
      verdict: "Vigila, pero rara vez es urgente.",
    },
    {
      img: crackVertical,
      alt: "Pared con una grieta vertical de asentamiento",
      level: "yellow",
      badge: "Vigilar de cerca",
      name: "Grietas verticales o de asentamiento",
      desc: "Grietas mayormente verticales, a veces cerca de puertas o ventanas. Si crecen, se ensanchan a más de 1 cm o reaparecen tras taparlas, conviene una revisión.",
      verdict: "Documenta y limita el uso si crecen.",
    },
    {
      img: crackDiagonal,
      alt: "Muro con grietas diagonales, en X y en escalera",
      level: "red",
      badge: "Señal de peligro",
      name: "Grietas diagonales, en X o en escalera",
      desc: "Grietas en diagonal, cruzadas en forma de X, o que siguen las juntas de los bloques en escalera. Indican que la estructura trabajó bajo el sismo. Son las más serias en columnas y muros de carga.",
      verdict: "No ignores: pide revisión profesional.",
    },
    {
      img: crackRebar,
      alt: "Columna de concreto con concreto desprendido y cabilla expuesta",
      level: "red",
      badge: "Evacúa y pide ayuda",
      name: "Concreto desprendido con cabilla expuesta",
      desc: "Trozos de concreto caídos en columnas o vigas dejando el acero (cabilla) a la vista, a veces doblado. Es daño estructural grave: la capacidad de carga está comprometida.",
      verdict: "Sal del inmueble y no vuelvas a entrar.",
    },
  ],
  en: [
    {
      img: crackCosmetic,
      alt: "Wall with fine spiderweb hairline cracks in the paint",
      level: "green",
      badge: "Likely cosmetic",
      name: "Hairline cracks",
      desc: "Very thin, hair-like lines only in the paint or plaster. Thinner than a card, with no offset between edges. Usually cosmetic.",
      verdict: "Keep an eye on it, rarely urgent.",
    },
    {
      img: crackVertical,
      alt: "Wall with a vertical settlement crack",
      level: "yellow",
      badge: "Watch closely",
      name: "Vertical / settlement cracks",
      desc: "Mostly vertical cracks, sometimes near doors or windows. If they grow, widen past 1 cm, or reappear after patching, get them reviewed.",
      verdict: "Document and limit use if they grow.",
    },
    {
      img: crackDiagonal,
      alt: "Wall with diagonal, X-shaped and stair-step cracks",
      level: "red",
      badge: "Danger sign",
      name: "Diagonal, X-shaped or stair-step cracks",
      desc: "Diagonal cracks, X-shaped crossings, or cracks following block mortar joints in a staircase pattern. They show the structure worked hard during the quake — most serious in columns and load-bearing walls.",
      verdict: "Don't ignore — request a professional review.",
    },
    {
      img: crackRebar,
      alt: "Concrete column with spalled concrete and exposed rebar",
      level: "red",
      badge: "Evacuate and get help",
      name: "Spalled concrete with exposed rebar",
      desc: "Concrete chunks fallen off columns or beams, leaving steel (rebar) visible and sometimes bent. This is severe structural damage: load capacity is compromised.",
      verdict: "Leave the building and don't go back in.",
    },
  ],
};

const FAQS: Record<"es" | "en", { q: string; a: string }[]> = {
  es: [
    {
      q: "¿Cuándo una grieta en la pared es peligrosa?",
      a: "Es peligrosa cuando es diagonal o en forma de X, cuando sigue las juntas de los bloques en escalera, cuando supera 1 cm de ancho, o cuando aparece en columnas y vigas. Las grietas en elementos de carga son más graves que las de tabiques o frisos.",
    },
    {
      q: "¿Cómo sé si una grieta es estructural o solo del friso?",
      a: "Una fisura del friso es muy fina (como un cabello), está solo en la superficie y no tiene desnivel entre los bordes. Una grieta estructural es más ancha, atraviesa el bloque o el concreto, suele ser diagonal y puede tener bordes a distinto nivel. Ante la duda, trátala como estructural.",
    },
    {
      q: "¿Las grietas diagonales después de un temblor son graves?",
      a: "Sí, las grietas diagonales y en X son de las señales más importantes tras un sismo, porque indican que la estructura trabajó bajo las fuerzas del movimiento. En columnas o muros de carga, suspende el uso y busca una revisión profesional.",
    },
    {
      q: "Veo cabilla (acero) expuesta en una columna. ¿Qué hago?",
      a: "Es daño estructural grave. Sal del inmueble con calma, no vuelvas a entrar y pide una evaluación de un ingeniero. La columna perdió capacidad y una réplica podría empeorar el daño.",
    },
    {
      q: "¿Cómo mido el ancho de una grieta?",
      a: "Una regla práctica: si la punta de un lápiz o una moneda de borde fino entra en la grieta (más de 1 cm), considérala seria. También revisa si crece con el tiempo marcando los extremos con lápiz y la fecha.",
    },
  ],
  en: [
    {
      q: "When is a wall crack dangerous?",
      a: "It's dangerous when it's diagonal or X-shaped, when it follows block joints in a stair-step pattern, when it's wider than 1 cm, or when it appears in columns and beams. Cracks in load-bearing elements are far more serious than in partitions or plaster.",
    },
    {
      q: "How do I know if a crack is structural or just plaster?",
      a: "A plaster crack is very thin (hair-like), only on the surface, with no offset between edges. A structural crack is wider, runs through the block or concrete, is often diagonal and may have edges at different levels. When in doubt, treat it as structural.",
    },
    {
      q: "Are diagonal cracks after a tremor serious?",
      a: "Yes — diagonal and X-shaped cracks are among the most important signs after an earthquake, because they show the structure worked under the movement's forces. In columns or load-bearing walls, stop using the space and get a professional review.",
    },
    {
      q: "I see exposed rebar in a column. What do I do?",
      a: "This is severe structural damage. Leave the building calmly, don't go back in, and request an engineer's evaluation. The column has lost capacity and an aftershock could worsen it.",
    },
    {
      q: "How do I measure a crack's width?",
      a: "A practical rule: if a pencil tip or a thin coin edge fits into the crack (over 1 cm), treat it as serious. Also check whether it's growing by marking the ends with a pencil and the date.",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Guía de inspección",
    h1: "Grietas peligrosas: cómo identificarlas",
    intro:
      "No todas las grietas significan lo mismo. Esta guía te ayuda a distinguir una fisura superficial de una grieta estructural después de un sismo en Venezuela, con ejemplos visuales.",
    typesTitle: "Tipos de grietas y qué significan",
    rulerTitle: "Regla rápida del ancho",
    rulerBody:
      "Si la grieta es más fina que una tarjeta, suele ser superficial. Si entra la punta de un lápiz o supera 1 cm, trátala como seria. Lo más importante: dónde está (columnas y muros de carga = más grave) y su forma (diagonal o en X = alerta).",
    verdictLabel: "Qué hacer",
    ctaTitle: "¿No estás seguro de lo que ves?",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita. Te ayuda a clasificar el riesgo y decidir si es seguro quedarte, limitar el uso o evacuar. Sin registro y funciona con poca señal.",
    ctaButton: "Iniciar autoevaluación",
    faqTitle: "Preguntas frecuentes",
    moreLink: "Qué hacer después de un temblor",
    methodLink: "Cómo funciona la metodología",
  },
  en: {
    kicker: "Inspection guide",
    h1: "Dangerous cracks: how to identify them",
    intro:
      "Not all cracks mean the same thing. This guide helps you tell a cosmetic crack from a structural one after an earthquake in Venezuela, with visual examples.",
    typesTitle: "Crack types and what they mean",
    rulerTitle: "Quick width rule",
    rulerBody:
      "If the crack is thinner than a card, it's usually cosmetic. If a pencil tip fits or it's over 1 cm, treat it as serious. Most important: where it is (columns and load-bearing walls = worse) and its shape (diagonal or X = warning).",
    verdictLabel: "What to do",
    ctaTitle: "Not sure what you're seeing?",
    ctaBody:
      "Run a free, guided self-assessment. It helps you classify the risk and decide whether to stay, limit use, or evacuate. No sign-up, works on low bandwidth.",
    ctaButton: "Start self-assessment",
    faqTitle: "Frequently asked questions",
    moreLink: "What to do after a tremor",
    methodLink: "How the methodology works",
  },
};

export const Route = createFileRoute(
  "/guia/grietas-peligrosas-despues-de-un-sismo",
)({
  head: () => {
    const { title, description } = META.es;
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.es.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      inLanguage: "es",
      url: absoluteUrl(PATH),
      mainEntityOfPage: absoluteUrl(PATH),
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
        { property: "og:url", content: absoluteUrl(PATH) },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(PATH) }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleSchema) },
        { type: "application/ld+json", children: JSON.stringify(faqSchema) },
      ],
    };
  },
  component: CracksGuidePage,
});

function CracksGuidePage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const types = CRACK_TYPES[lang];
  const faqs = FAQS[lang];

  return (
    <AppShell>
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Ruler className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* Crack types */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.typesTitle}</h2>
        <div className="mt-4 space-y-4">
          {types.map((type) => {
            const s = LEVEL_STYLES[type.level];
            return (
              <article
                key={type.name}
                className={`overflow-hidden rounded-2xl border ${s.border} bg-card shadow-sm`}
              >
                <img
                  src={type.img}
                  alt={type.alt}
                  width={768}
                  height={576}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}
                  >
                    {type.badge}
                  </span>
                  <h3 className="mt-2 font-display text-base font-bold">
                    {type.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {type.desc}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${s.verdict}`}>
                    {c.verdictLabel}: {type.verdict}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Width rule */}
      <section className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
        <div className="flex items-center gap-2">
          <Ruler className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.rulerTitle}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.rulerBody}
        </p>
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
          <Link to="/guia/que-hacer-despues-de-un-temblor">{c.moreLink}</Link>
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
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            to="/metodologia"
            className="inline-flex items-center gap-1 font-semibold text-primary"
          >
            {c.methodLink}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-risk-green" aria-hidden />
          {lang === "es"
            ? "EvalúaYa es una herramienta comunitaria gratuita. No reemplaza la evaluación de un ingeniero."
            : "EvalúaYa is a free community tool. It does not replace an engineer's evaluation."}
        </p>
      </section>
    </AppShell>
  );
}
