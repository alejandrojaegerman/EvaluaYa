import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";
import { useLang } from "@/lib/i18n";
import { contactMailto } from "@/lib/site";

/** Site footer. On mobile it adds extra bottom padding so it clears the fixed BottomNav. */
export function Footer() {
  const { t, lang } = useLang();

  const columns: Array<{
    heading: string;
    links: Array<{ to?: string; href?: string; label: string }>;
  }> = [
    {
      heading: t("footer.explore"),
      links: [
        { to: "/", label: t("nav.home") },
        {
          to:
            lang === "es"
              ? "/temblo-en-venezuela-hoy"
              : "/earthquake-in-venezuela-today",
          label: t("nav.today"),
        },
        { to: "/mapa", label: t("nav.map") },
        { to: "/datos", label: t("nav.data") },
      ],
    },
    {
      heading: t("footer.participate"),
      links: [
        { to: "/voluntarios", label: t("nav.volunteers") },
        { to: "/assess/property", label: t("footer.evaluate") },
      ],
    },
    {
      heading: t("footer.resources"),
      links: [
        { to: "/guia", label: t("nav.learn") },
        { to: "/ayuda", label: t("nav.help") },
        { to: "/feedback", label: t("nav.feedback") },
      ],
    },
    {
      heading: t("footer.legal"),
      links: [
        { to: "/legal", label: t("nav.legal") },
        { to: "/privacidad", label: t("nav.privacy") },
        { href: contactMailto(t("contact.subject")), label: t("footer.contact") },
      ],
    },
  ];

  return (
    <footer className="mt-8 border-t border-border/70 bg-muted/30 print:hidden md:mt-12">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-28 md:px-6 md:pt-10 md:pb-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          {/* Brand */}
          <div className="min-w-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                {t("app.name")}
              </span>
            </Link>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to!}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/70 pt-6">
          <p className="text-xs text-muted-foreground">{t("footer.note")}</p>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  );
}
