import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquareHeart,
  Share2,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { translate, useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const FAQ_KEYS = [
  "free",
  "signup",
  "behalf",
  "offline",
  "results",
  "engineer",
  "privacy",
  "save",
  "photos",
  "newDamage",
  "official",
] as const;

export const Route = createFileRoute("/ayuda")({
  head: () => {
    const title = "Ayuda y preguntas frecuentes | EvalúaYa";
    const description =
      "Aprende a usar EvalúaYa paso a paso y resuelve dudas comunes: privacidad, uso sin conexión, qué significan los resultados y cómo guardar tus reportes.";
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map((key) => ({
        "@type": "Question",
        name: translate("es", `help.faq.${key}Q`),
        acceptedAnswer: {
          "@type": "Answer",
          text: translate("es", `help.faq.${key}A`),
        },
      })),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl("/ayuda") },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/ayuda") }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(faqSchema),
        },
      ],
    };
  },
  component: HelpPage,
});

function HelpPage() {
  const { t } = useLang();

  const steps = [
    {
      icon: Building2,
      title: t("help.step1Title"),
      desc: t("help.step1Desc"),
    },
    {
      icon: ClipboardCheck,
      title: t("help.step2Title"),
      desc: t("help.step2Desc"),
    },
    {
      icon: Sparkles,
      title: t("help.step3Title"),
      desc: t("help.step3Desc"),
    },
    {
      icon: Share2,
      title: t("help.step4Title"),
      desc: t("help.step4Desc"),
    },
  ];

  const faqs = [
    { q: t("help.faq.freeQ"), a: t("help.faq.freeA") },
    { q: t("help.faq.signupQ"), a: t("help.faq.signupA") },
    { q: t("help.faq.behalfQ"), a: t("help.faq.behalfA") },
    { q: t("help.faq.offlineQ"), a: t("help.faq.offlineA") },
    { q: t("help.faq.resultsQ"), a: t("help.faq.resultsA") },
    { q: t("help.faq.engineerQ"), a: t("help.faq.engineerA") },
    { q: t("help.faq.privacyQ"), a: t("help.faq.privacyA") },
    { q: t("help.faq.saveQ"), a: t("help.faq.saveA") },
    { q: t("help.faq.photosQ"), a: t("help.faq.photosA") },
    { q: t("help.faq.newDamageQ"), a: t("help.faq.newDamageA") },
    { q: t("help.faq.officialQ"), a: t("help.faq.officialA") },
  ];

  return (
    <AppShell>
      <section className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {t("help.title")}
        </h1>
      </section>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("help.subtitle")}
      </p>

      {/* Quick start */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">
          {t("help.quickStartTitle")}
        </h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <step.icon className="size-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="font-semibold leading-tight">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link to="/assess/property">
            {t("help.startCta")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold">{t("help.faqTitle")}</h2>
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
      </section>

      {/* Still need help */}
      <section className="mt-8 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <h2 className="font-display text-base font-bold">
          {t("help.moreTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("help.moreBody")}
        </p>
        <div className="mt-4 grid gap-2">
          <Button asChild>
            <Link to="/feedback">
              <MessageSquareHeart className="size-4" />
              {t("help.contactCta")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/guia/que-hacer-despues-de-un-temblor">
              {t("help.tremorGuideLink")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/guia/falla-de-bocono">
              {t("help.boconoGuideLink")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/metodologia">{t("home.methodologyLink")}</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
