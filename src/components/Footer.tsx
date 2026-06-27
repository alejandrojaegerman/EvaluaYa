import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";
import { useLang } from "@/lib/i18n";

/** Desktop-only site footer. Hidden on mobile so it never collides with BottomNav. */
export function Footer() {
  const { t } = useLang();

  const columns: Array<{
    heading: string;
    note?: string;
    links: Array<{ to: string; label: string }>;
  }> = [
    {
      heading: t("footer.explore"),
      links: [
        { to: "/", label: t("nav.home") },
        { to: "/mapa", label: t("nav.map") },
        { to: "/datos", label: t("nav.data") },
      ],
    },
    {
      heading: t("footer.participate"),
      note: t("engineers.footerDesc"),
      links: [
        { to: "/voluntarios", label: t("nav.volunteers") },
        { to: "/assess/property", label: t("footer.evaluate") },
      ],
    },
    {
      heading: t("footer.resources"),
      links: [
        { to: "/metodologia", label: t("nav.methodology") },
        { to: "/ayuda", label: t("nav.help") },
        { to: "/feedback", label: t("nav.feedback") },
      ],
    },
  ];

  return (
    <footer className="mt-12 hidden border-t border-border/70 bg-muted/30 print:hidden md:block">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-8">
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
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
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
