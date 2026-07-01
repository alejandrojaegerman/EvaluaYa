import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  Gavel,
  HardHat,
  Info,
  Mail,
  Scale,
  ShieldAlert,
  Siren,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/legal")({
  head: () => {
    const title = "Aviso legal y responsabilidad — EvalúaYa";
    const description =
      "EvalúaYa ofrece una orientación preliminar y no reemplaza una inspección oficial. Los ingenieros son voluntarios no remunerados; no nos hacemos responsables por sus recomendaciones.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl("/legal") },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/legal") }],
    };
  },
  component: LegalPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function LegalPage() {
  const { t } = useLang();

  return (
    <AppShell>
      <header>
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Scale className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {t("legal.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("legal.subtitle")}
        </p>
        <p className="mt-4 text-sm leading-relaxed">{t("legal.intro")}</p>
      </header>

      <Section icon={ShieldAlert} title={t("legal.s1.title")}>
        <p>{t("legal.s1.body")}</p>
      </Section>

      <Section icon={ClipboardCheck} title={t("legal.s2.title")}>
        <p>{t("legal.s2.body")}</p>
      </Section>

      <Section icon={HardHat} title={t("legal.s3.title")}>
        <p>{t("legal.s3.body")}</p>
      </Section>

      <Section icon={Gavel} title={t("legal.s4.title")}>
        <p>{t("legal.s4.body")}</p>
      </Section>

      {/* Emergencies — emphasized */}
      <section className="mt-8 rounded-2xl border border-risk-red/30 bg-risk-red-soft/50 p-4">
        <div className="flex items-center gap-2">
          <Siren className="size-4 text-risk-red" aria-hidden />
          <h2 className="font-display text-lg font-bold text-risk-red">
            {t("legal.s5.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {t("legal.s5.body")}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("legal.contact.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("legal.contact.body")}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button asChild size="lg" variant="outline" className="w-full">
            <a href="mailto:contacto@evaluaya.app">
              <Mail className="size-4" aria-hidden />
              contacto@evaluaya.app
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full">
            <Link to="/privacidad">{t("nav.privacy")}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 text-center">
        <Button asChild size="lg" className="w-full">
          <Link to="/assess/property">
            {t("common.start")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </AppShell>
  );
}
