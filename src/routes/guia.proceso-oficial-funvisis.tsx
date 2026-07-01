import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Download,
  FileText,
  Info,
  Landmark,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  EncyclopediaBreadcrumb,
  breadcrumbJsonLd,
  encyclopediaCrumbs,
} from "@/components/EncyclopediaBreadcrumb";
import { OfficialDirectory } from "@/components/OfficialDirectory";
import { Button } from "@/components/ui/button";
import boletin61 from "@/assets/official/boletin-61.pdf.asset.json";
import planillaV22b from "@/assets/official/planilla-v22b.pdf.asset.json";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const PATH = "/guia/proceso-oficial-funvisis";

const META = {
  es: {
    title: "Proceso oficial de FUNVISIS y Protección Civil | EvalúaYa",
    description:
      "Las fases oficiales para evaluar un edificio tras un sismo en Venezuela, dónde entra EvalúaYa y qué hacer después. Documentos oficiales descargables.",
  },
  en: {
    title: "FUNVISIS & Civil Protection official process | EvalúaYa",
    description:
      "The official phases to assess a building after an earthquake in Venezuela, where EvalúaYa fits and what to do next. Downloadable official documents.",
  },
};

type Phase = {
  n: string;
  title: string;
  who: string;
  role: string;
  isUs?: boolean;
};

const PHASES: Record<"es" | "en", Phase[]> = {
  es: [
    {
      n: "0",
      title: "Verificación visual rápida",
      who: "Comunidad + ingeniero voluntario",
      role: "Aquí estamos con EvalúaYa. No es oficial.",
      isUs: true,
    },
    {
      n: "1",
      title: "Evaluación Rápida oficial (coloca la etiqueta)",
      who: "Inspector certificado por la autoridad",
      role: "El usuario debe solicitarla a Protección Civil.",
    },
    {
      n: "2",
      title: "Inspección Detallada",
      who: "Ingeniero especializado",
      role: "Solo si el resultado sale Roja o Amarilla.",
    },
    {
      n: "3",
      title: "Evaluación Detallada",
      who: "Ingeniero estructural",
      role: "Para reparar o reforzar la estructura.",
    },
  ],
  en: [
    {
      n: "0",
      title: "Quick visual check",
      who: "Community + volunteer engineer",
      role: "This is EvalúaYa. Not official.",
      isUs: true,
    },
    {
      n: "1",
      title: "Official Rapid Evaluation (places the label)",
      who: "Inspector certified by the authority",
      role: "The user must request it from Civil Protection.",
    },
    {
      n: "2",
      title: "Detailed Inspection",
      who: "Specialized engineer",
      role: "Only if the result is Red or Yellow.",
    },
    {
      n: "3",
      title: "Detailed Evaluation",
      who: "Structural engineer",
      role: "To repair or reinforce the structure.",
    },
  ],
};

type Label = { key: string; label: string; meaning: string; tone: string };

const LABELS: Record<"es" | "en", Label[]> = {
  es: [
    {
      key: "green",
      label: "Permitido (Verde)",
      meaning: "Uso permitido. Se relaciona con el 🟢 de EvalúaYa.",
      tone: "risk-green",
    },
    {
      key: "yellow",
      label: "Restringido (Amarillo)",
      meaning: "Uso restringido / limitado. Se relaciona con 🟡 y 🟠.",
      tone: "risk-yellow",
    },
    {
      key: "red",
      label: "No Permitido (Rojo)",
      meaning: "No se permite el uso. Se relaciona con el 🔴 de EvalúaYa.",
      tone: "risk-red",
    },
  ],
  en: [
    {
      key: "green",
      label: "Allowed (Green)",
      meaning: "Use allowed. Maps to EvalúaYa's 🟢.",
      tone: "risk-green",
    },
    {
      key: "yellow",
      label: "Restricted (Yellow)",
      meaning: "Restricted / limited use. Maps to 🟡 and 🟠.",
      tone: "risk-yellow",
    },
    {
      key: "red",
      label: "Not allowed (Red)",
      meaning: "Use not permitted. Maps to EvalúaYa's 🔴.",
      tone: "risk-red",
    },
  ],
};

const COPY = {
  es: {
    kicker: "Proceso oficial",
    h1: "Proceso oficial de FUNVISIS y Protección Civil",
    intro:
      "Después de un sismo, evaluar un edificio sigue fases oficiales. EvalúaYa es solo la primera, rápida y no oficial: te orienta y te dice a quién acudir para la evaluación real.",
    phasesTitle: "Las fases oficiales",
    labelsTitle: "Qué significan las etiquetas oficiales",
    labelsNote:
      "El naranja (🟠) es un matiz propio de EvalúaYa entre amarillo y rojo; no es una etiqueta oficial.",
    legalTitle: "Por qué EvalúaYa siempre te remite al organismo oficial",
    legalBody:
      "La planilla de evaluación oficial debe ser llenada por personas con el Certificado de Inspector de Evaluación de Daños que otorga la autoridad competente. Solo FUNVISIS y Protección Civil pueden emitir la etiqueta oficial. Por eso EvalúaYa documenta el proceso, pero nunca lo reemplaza.",
    readyTitle: "Qué tener listo para agilizar la evaluación oficial",
    ready: [
      "Fotos claras de los daños (columnas, vigas, muros, grietas, inclinación).",
      "Ubicación exacta y nombre del edificio o torre.",
      "Número de pisos y de sótanos / semisótanos.",
      "Tu reporte de EvalúaYa (PDF) para dar contexto al inspector.",
    ],
    docsTitle: "Documentos oficiales (descargables)",
    docsNote:
      "Documentos de referencia técnica. Los procedimientos y la etiqueta oficial los definen FUNVISIS y Protección Civil.",
    boletinTitle: "Boletín 61 — Evaluación de Daños (ANIH)",
    boletinDesc:
      "Metodología oficial de evaluación de daños tras un sismo: fases, niveles de daño y criterios.",
    planillaTitle: "Planilla oficial V22b (FUNVISIS)",
    planillaDesc:
      "Formato oficial que usa el inspector certificado para registrar la evaluación del edificio.",
    download: "Descargar PDF",
    contactsTitle: "Solicita la evaluación oficial",
    contactsBody:
      "EvalúaYa no agenda ni realiza la inspección. El residente o el ingeniero voluntario contacta a Protección Civil para coordinarla.",
    ctaTitle: "¿Aún no evalúas tu vivienda?",
    ctaButton: "Iniciar autoevaluación",
    note: "Referencia educativa. La evaluación y la etiqueta oficial las realiza personal certificado por la autoridad.",
  },
  en: {
    kicker: "Official process",
    h1: "FUNVISIS & Civil Protection official process",
    intro:
      "After an earthquake, assessing a building follows official phases. EvalúaYa is only the first — quick and unofficial: it guides you and tells you who to reach for the real assessment.",
    phasesTitle: "The official phases",
    labelsTitle: "What the official labels mean",
    labelsNote:
      "Orange (🟠) is an EvalúaYa nuance between yellow and red; it is not an official label.",
    legalTitle: "Why EvalúaYa always refers you to the official body",
    legalBody:
      "The official evaluation form must be filled out by people holding the Damage Evaluation Inspector Certificate issued by the competent authority. Only FUNVISIS and Civil Protection can issue the official label. That's why EvalúaYa documents the process but never replaces it.",
    readyTitle: "What to have ready to speed up the official assessment",
    ready: [
      "Clear photos of the damage (columns, beams, walls, cracks, tilt).",
      "Exact location and building or tower name.",
      "Number of floors and basements / semi-basements.",
      "Your EvalúaYa report (PDF) to give the inspector context.",
    ],
    docsTitle: "Official documents (downloadable)",
    docsNote:
      "Technical reference documents. Official procedures and the label are defined by FUNVISIS and Civil Protection.",
    boletinTitle: "Bulletin 61 — Damage Evaluation (ANIH)",
    boletinDesc:
      "Official damage-evaluation methodology after an earthquake: phases, damage levels and criteria.",
    planillaTitle: "Official form V22b (FUNVISIS)",
    planillaDesc:
      "Official form the certified inspector uses to record the building's evaluation.",
    download: "Download PDF",
    contactsTitle: "Request the official assessment",
    contactsBody:
      "EvalúaYa does not schedule or perform the inspection. The resident or volunteer engineer contacts Civil Protection to coordinate it.",
    ctaTitle: "Haven't assessed your home yet?",
    ctaButton: "Start self-assessment",
    note: "Educational reference. The official assessment and label are performed by personnel certified by the authority.",
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
  const phases = PHASES[lang];
  const labels = LABELS[lang];

  const docs = [
    {
      title: c.boletinTitle,
      desc: c.boletinDesc,
      url: boletin61.url,
      icon: FileText,
    },
    {
      title: c.planillaTitle,
      desc: c.planillaDesc,
      url: planillaV22b.url,
      icon: ClipboardList,
    },
  ];

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

      {/* Phases timeline */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.phasesTitle}</h2>
        <ol className="mt-3 space-y-2">
          {phases.map((p) => (
            <li
              key={p.n}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
                p.isUs
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold",
                  p.isUs
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {p.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold leading-tight">{p.title}</h3>
                  {p.isUs && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      EvalúaYa
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-foreground/80">
                  {p.who}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {p.role}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Official labels */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{c.labelsTitle}</h2>
        <ul className="mt-3 space-y-2">
          {labels.map((l) => (
            <li
              key={l.key}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span
                className={cn("mt-1 size-3 shrink-0 rounded-full", `bg-${l.tone}`)}
                aria-hidden
              />
              <div>
                <h3 className="font-semibold leading-tight">{l.label}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {l.meaning}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          {c.labelsNote}
        </p>
      </section>

      {/* Legal base */}
      <section className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.legalTitle}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.legalBody}
        </p>
      </section>

      {/* What to have ready */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.readyTitle}</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {c.ready.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-3 text-sm shadow-sm"
            >
              <ClipboardList
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Downloads */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Download className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.docsTitle}</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.title}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <d.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">
                    {d.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                    {d.desc}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Download className="size-3" aria-hidden />
                    {c.download}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          {c.docsNote}
        </p>
      </section>

      {/* Official contacts */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Phone className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">{c.contactsTitle}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {c.contactsBody}
        </p>
        <OfficialDirectory showHeader={false} />
      </section>

      {/* CTA */}
      <section className="mt-8 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <Wrench className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">{c.ctaTitle}</h2>
        </div>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link to="/assess/property">
            {c.ctaButton}
            <ArrowRight className="size-4" aria-hidden />
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
