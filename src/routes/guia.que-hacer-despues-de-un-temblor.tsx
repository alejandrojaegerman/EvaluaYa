import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Flame,
  HelpCircle,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  EncyclopediaBreadcrumb,
  breadcrumbJsonLd,
  encyclopediaCrumbs,
} from "@/components/EncyclopediaBreadcrumb";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const PATH = "/guia/que-hacer-despues-de-un-temblor";

const META = {
  es: {
    title: "Qué hacer después de un temblor en Venezuela | EvalúaYa",
    description:
      "Guía de seguridad tras un sismo en Venezuela: qué hacer en los primeros minutos, cómo revisar tu casa y cuándo evacuar. Incluye autoevaluación gratis.",
  },
  en: {
    title: "What to do after an earthquake in Venezuela | EvalúaYa",
    description:
      "Safety guide after an earthquake in Venezuela: what to do in the first minutes, how to check your home, and when to evacuate. Free self-assessment.",
  },
};

type Step = { icon: typeof ShieldCheck; title: string; body: string };

const STEPS: Record<"es" | "en", Step[]> = {
  es: [
    {
      icon: ShieldCheck,
      title: "1. Mantén la calma y protégete de réplicas",
      body: "Las réplicas son comunes en los minutos y horas siguientes. Aléjate de ventanas, vidrios, fachadas y objetos que puedan caer. Si estás dentro y la estructura parece estable, agáchate, cúbrete y agárrate hasta que pase el movimiento.",
    },
    {
      icon: DoorOpen,
      title: "2. Sal con cuidado si es seguro hacerlo",
      body: "Si hueles gas, ves grietas grandes o el edificio se siente inestable, sal con calma por las escaleras (nunca el ascensor) hacia un espacio abierto lejos de cables, postes y muros. No corras y ayuda a personas mayores, niños y personas con movilidad reducida.",
    },
    {
      icon: Flame,
      title: "3. Corta gas y electricidad ante cualquier duda",
      body: "Si percibes olor a gas, cierra la llave principal, no enciendas luces ni fósforos y ventila. Ante cables sueltos o chispas, baja el breaker principal si puedes hacerlo de forma segura.",
    },
    {
      icon: PhoneCall,
      title: "4. Confirma que todos estén bien e infórmate",
      body: "Revisa a tu familia y vecinos. Usa mensajes de texto o WhatsApp en vez de llamadas para no saturar la red. Sigue fuentes oficiales (FUNVISIS, Protección Civil) y evita rumores.",
    },
    {
      icon: ClipboardCheck,
      title: "5. Revisa tu vivienda antes de volver a usarla",
      body: "Antes de dormir o seguir viviendo en el inmueble, inspecciona columnas, vigas, muros y escaleras. Una autoevaluación guiada te ayuda a decidir si es seguro permanecer, limitar el uso o evacuar.",
    },
  ],
  en: [
    {
      icon: ShieldCheck,
      title: "1. Stay calm and protect yourself from aftershocks",
      body: "Aftershocks are common in the minutes and hours that follow. Move away from windows, glass, façades and objects that could fall. If you are indoors and the structure seems stable, drop, cover and hold on until the shaking stops.",
    },
    {
      icon: DoorOpen,
      title: "2. Exit carefully if it is safe to do so",
      body: "If you smell gas, see large cracks, or the building feels unstable, leave calmly via the stairs (never the elevator) toward an open area away from cables, poles and walls. Don't run, and help elderly people, children and those with reduced mobility.",
    },
    {
      icon: Flame,
      title: "3. Shut off gas and power if in doubt",
      body: "If you smell gas, close the main valve, don't switch on lights or strike matches, and ventilate. If you see loose wires or sparks, switch off the main breaker if you can do so safely.",
    },
    {
      icon: PhoneCall,
      title: "4. Check everyone is safe and stay informed",
      body: "Check on family and neighbors. Use text messages or WhatsApp instead of calls to avoid overloading the network. Follow official sources (FUNVISIS, Civil Protection) and avoid rumors.",
    },
    {
      icon: ClipboardCheck,
      title: "5. Inspect your home before using it again",
      body: "Before sleeping or continuing to live in the building, inspect columns, beams, walls and stairs. A guided self-assessment helps you decide whether it's safe to stay, limit use, or evacuate.",
    },
  ],
};

type RedFlag = { icon: typeof ShieldAlert; text: string };

const RED_FLAGS: Record<"es" | "en", RedFlag[]> = {
  es: [
    { icon: AlertTriangle, text: "Grietas diagonales o en forma de X en columnas o muros de carga." },
    { icon: ShieldAlert, text: "Concreto desprendido con acero (cabilla) expuesto en columnas o vigas." },
    { icon: DoorOpen, text: "Puertas o ventanas que dejaron de abrir o cerrar (la estructura se movió)." },
    { icon: Waves, text: "El piso se hundió, se inclinó o el suelo alrededor se agrietó." },
    { icon: Flame, text: "Olor persistente a gas o daños en tuberías." },
  ],
  en: [
    { icon: AlertTriangle, text: "Diagonal or X-shaped cracks in columns or load-bearing walls." },
    { icon: ShieldAlert, text: "Spalled concrete with exposed rebar in columns or beams." },
    { icon: DoorOpen, text: "Doors or windows that no longer open or close (the structure shifted)." },
    { icon: Waves, text: "The floor sank or tilted, or the surrounding ground cracked." },
    { icon: Flame, text: "Persistent gas smell or damaged plumbing." },
  ],
};

const FAQS: Record<"es" | "en", { q: string; a: string }[]> = {
  es: [
    {
      q: "¿Tembló en Venezuela hoy? ¿Dónde confirmo la información?",
      a: "Los reportes oficiales de magnitud y epicentro los publica FUNVISIS. EvalúaYa no detecta sismos en tiempo real: te ayuda a revisar si tu vivienda quedó segura después de un temblor.",
    },
    {
      q: "Sentí un temblor pero no veo daños. ¿Debo revisar igual?",
      a: "Sí. Algunos daños estructurales no son evidentes a simple vista. Una revisión rápida de columnas, vigas y muros toma pocos minutos y te da tranquilidad o una alerta temprana.",
    },
    {
      q: "¿Cuándo debo evacuar de inmediato?",
      a: "Sal de inmediato si ves grietas grandes en elementos de carga, concreto con acero expuesto, inclinación del edificio, o si hueles gas. Ante la duda, es más seguro salir y pedir una revisión profesional.",
    },
    {
      q: "¿La autoevaluación reemplaza a un ingeniero?",
      a: "No. Es una guía de triaje rápido para tomar decisiones inmediatas de seguridad. Para una certificación, necesitas un ingeniero. EvalúaYa puede conectarte con ingenieros voluntarios verificados tras tu evaluación.",
    },
  ],
  en: [
    {
      q: "Was there an earthquake in Venezuela today? Where do I confirm it?",
      a: "Official magnitude and epicenter reports are published by FUNVISIS. EvalúaYa doesn't detect quakes in real time — it helps you check whether your home is safe after a tremor.",
    },
    {
      q: "I felt a tremor but see no damage. Should I still check?",
      a: "Yes. Some structural damage isn't obvious at a glance. A quick review of columns, beams and walls takes a few minutes and gives you peace of mind or an early warning.",
    },
    {
      q: "When should I evacuate immediately?",
      a: "Leave at once if you see large cracks in load-bearing elements, exposed rebar, building tilt, or if you smell gas. When in doubt, it's safer to leave and request a professional review.",
    },
    {
      q: "Does the self-assessment replace an engineer?",
      a: "No. It's a rapid triage guide for immediate safety decisions. For certification you need an engineer. EvalúaYa can connect you with verified volunteer engineers after your assessment.",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Guía de seguridad",
    h1: "Qué hacer después de un temblor",
    intro:
      "Si acabas de sentir un sismo en Venezuela, estos son los pasos clave para protegerte en los primeros minutos y saber si tu vivienda quedó segura.",
    stepsTitle: "Pasos inmediatos de seguridad",
    redTitle: "Señales de peligro: evacúa y pide ayuda",
    redIntro:
      "Si observas cualquiera de estas señales, no vuelvas a entrar y busca una revisión profesional.",
    ctaTitle: "Revisa si tu vivienda es segura",
    ctaBody:
      "Haz una autoevaluación guiada y gratuita en pocos minutos. Sin registro y funciona con poca señal.",
    ctaButton: "Iniciar autoevaluación",
    faqTitle: "Preguntas frecuentes",
    cracksLink: "Cómo identificar grietas peligrosas",
    moreLink: "Cómo funciona la metodología",
  },
  en: {
    kicker: "Safety guide",
    h1: "What to do after a tremor",
    intro:
      "If you just felt an earthquake in Venezuela, these are the key steps to protect yourself in the first minutes and find out whether your home is safe.",
    stepsTitle: "Immediate safety steps",
    redTitle: "Danger signs: evacuate and get help",
    redIntro:
      "If you notice any of these signs, don't go back in and seek a professional review.",
    ctaTitle: "Check whether your home is safe",
    ctaBody:
      "Run a free, guided self-assessment in a few minutes. No sign-up, works on low bandwidth.",
    ctaButton: "Start self-assessment",
    faqTitle: "Frequently asked questions",
    cracksLink: "How to identify dangerous cracks",
    moreLink: "How the methodology works",
  },
};

export const Route = createFileRoute("/guia/que-hacer-despues-de-un-temblor")({
  head: () => {
    const { title, description } = META.es;
    const howTo = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Qué hacer después de un temblor en Venezuela",
      description,
      inLanguage: "es",
      url: absoluteUrl(PATH),
      step: STEPS.es.map((s) => ({
        "@type": "HowToStep",
        name: s.title.replace(/^\d+\.\s*/, ""),
        text: s.body,
      })),
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
        { type: "application/ld+json", children: JSON.stringify(howTo) },
        { type: "application/ld+json", children: JSON.stringify(faqSchema) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd(
              encyclopediaCrumbs("es", {
                label: "Qué hacer después de un temblor",
              }),
            ),
          ),
        },
      ],
    };
  },
  component: GuidePage,
});

function GuidePage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const steps = STEPS[lang];
  const redFlags = RED_FLAGS[lang];
  const faqs = FAQS[lang];

  return (
    <AppShell>
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          {c.kicker}
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
      </header>

      {/* Immediate steps */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.stepsTitle}</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <step.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold leading-tight">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Danger signs */}
      <section className="mt-8 rounded-2xl border border-risk-red/30 bg-risk-red-soft/40 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-risk-red" aria-hidden />
          <h2 className="font-display text-lg font-bold text-risk-red">
            {c.redTitle}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.redIntro}
        </p>
        <ul className="mt-3 space-y-2">
          {redFlags.map((flag) => (
            <li key={flag.text} className="flex items-start gap-2 text-sm">
              <flag.icon
                className="mt-0.5 size-4 shrink-0 text-risk-red"
                aria-hidden
              />
              <span>{flag.text}</span>
            </li>
          ))}
        </ul>
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
          <Link to="/guia/grietas-peligrosas-despues-de-un-sismo">
            {c.cracksLink}
          </Link>
        </Button>
        <Button asChild variant="link" className="mt-1 w-full">
          <Link to="/metodologia">{c.moreLink}</Link>
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
          <CheckCircle2 className="size-3.5 text-risk-green" aria-hidden />
          {lang === "es"
            ? "EvalúaYa es una herramienta comunitaria gratuita. No reemplaza la evaluación de un ingeniero."
            : "EvalúaYa is a free community tool. It does not replace an engineer's evaluation."}
        </p>
      </section>
    </AppShell>
  );
}
