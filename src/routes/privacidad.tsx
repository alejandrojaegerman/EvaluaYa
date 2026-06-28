import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cookie,
  Database,
  FileText,
  Info,
  Lock,
  Mail,
  Server,
  Share2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/privacidad")({
  head: () => {
    const title = "Política de privacidad — EvalúaYa";
    const description =
      "Cómo EvalúaYa recoge, usa y protege tus datos. Evaluaciones anónimas, fotos privadas y datos agregados. Contacto: contacto@evaluaya.app.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl("/privacidad") },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/privacidad") }],
    };
  },
  component: PrivacyPage,
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

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm">
          <span
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PrivacyPage() {
  const { t } = useLang();

  return (
    <AppShell>
      <header>
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {t("privacy.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("privacy.subtitle")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("privacy.updated")}
        </p>
        <p className="mt-4 text-sm leading-relaxed">{t("privacy.intro")}</p>
      </header>

      <Section icon={UserCheck} title={t("privacy.responsible.title")}>
        <p>{t("privacy.responsible.body")}</p>
      </Section>

      <Section icon={Database} title={t("privacy.collect.title")}>
        <p>{t("privacy.collect.intro")}</p>
        <Bullets
          items={[
            t("privacy.collect.b1"),
            t("privacy.collect.b2"),
            t("privacy.collect.b3"),
            t("privacy.collect.b4"),
            t("privacy.collect.b5"),
          ]}
        />
      </Section>

      <Section icon={FileText} title={t("privacy.use.title")}>
        <p>{t("privacy.use.intro")}</p>
        <Bullets
          items={[
            t("privacy.use.b1"),
            t("privacy.use.b2"),
            t("privacy.use.b3"),
            t("privacy.use.b4"),
          ]}
        />
      </Section>

      <Section icon={Share2} title={t("privacy.share.title")}>
        <p>{t("privacy.share.body")}</p>
      </Section>

      <Section icon={Lock} title={t("privacy.retention.title")}>
        <p>{t("privacy.retention.body")}</p>
      </Section>

      <Section icon={Server} title={t("privacy.processors.title")}>
        <p>{t("privacy.processors.body")}</p>
      </Section>

      <Section icon={Cookie} title={t("privacy.cookies.title")}>
        <p>{t("privacy.cookies.body")}</p>
      </Section>

      <Section icon={UserCheck} title={t("privacy.rights.title")}>
        <p>{t("privacy.rights.body")}</p>
      </Section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">
            {t("privacy.contact.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("privacy.contact.body")}
        </p>
        <Button asChild size="lg" variant="outline" className="mt-4 w-full">
          <a href="mailto:contacto@evaluaya.app">
            <Mail className="size-4" aria-hidden />
            contacto@evaluaya.app
          </a>
        </Button>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex gap-3">
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            {t("privacy.disclaimer")}
          </p>
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
