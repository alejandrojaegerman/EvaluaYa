import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  HandHeart,
  Home,
  Languages,
  LifeBuoy,
  Map,
  MessageSquareHeart,
  MoreHorizontal,
  Phone,
  Scale,
  ShieldQuestion,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { useHasReports } from "@/hooks/use-has-reports";
import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const tabClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary";

type MenuLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  desc?: string;
};

/** A single menu row rendered as a card. Shared by tiles and accordion items. */
function MenuRow({ to, label, icon: Icon, desc }: MenuLink) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          {label}
          {desc && (
            <span className="block text-xs font-normal text-muted-foreground">
              {desc}
            </span>
          )}
        </span>
      </Link>
    </SheetClose>
  );
}

export function BottomNav() {
  const { t, lang, setLang } = useLang();
  const online = useOnline();
  const hasReports = useHasReports();
  const [open, setOpen] = useState(false);

  // High-use destinations stay visible; less-visited categories collapse into
  // accordions so the sheet opens compact and evaluation-focused.
  const primaryLinks: MenuLink[] = [
    { to: "/mapa", label: t("nav.map"), icon: Map },
    ...(hasReports
      ? [{ to: "/mis-reportes", label: t("nav.reports"), icon: FolderOpen }]
      : []),
    { to: "/datos", label: t("nav.data"), icon: BarChart3 },
    { to: "/voluntarios", label: t("nav.volunteers"), icon: HandHeart },
  ];

  const resourceLinks: MenuLink[] = [
    { to: "/metodologia", label: t("nav.methodology"), icon: BookOpen },
    { to: "/ayuda", label: t("nav.help"), icon: LifeBuoy },
    { to: "/feedback", label: t("nav.feedback"), icon: MessageSquareHeart },
  ];

  const officialLegalLinks: MenuLink[] = [
    { to: "/contactos-oficiales", label: t("nav.officialContacts"), icon: Phone },
    { to: "/legal", label: t("nav.legal"), icon: Scale },
    { to: "/privacidad", label: t("nav.privacy"), icon: ShieldQuestion },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden print:hidden">
      <div className="mx-auto flex w-full max-w-screen-sm items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        <Link
          to="/"
          className={tabClass}
          activeOptions={{ exact: true }}
          activeProps={{ "data-status": "active" }}
        >
          <Home className="size-5" aria-hidden />
          <span>{t("nav.home")}</span>
        </Link>

        <Link
          to="/assess/property"
          className={tabClass}
          activeProps={{ "data-status": "active" }}
        >
          <ClipboardCheck className="size-5" aria-hidden />
          <span>{t("nav.evaluate")}</span>
        </Link>

        <Link
          to={lang === "es" ? "/temblo-en-venezuela-hoy" : "/earthquake-in-venezuela-today"}
          className={tabClass}
          activeProps={{ "data-status": "active" }}
        >
          <Waves className="size-5" aria-hidden />
          <span>{t("nav.today")}</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={cn(tabClass, "cursor-pointer")}>
            <MoreHorizontal className="size-5" aria-hidden />
            <span>{t("nav.more")}</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="mx-auto max-h-[85vh] max-w-screen-sm overflow-y-auto rounded-t-3xl"
          >
            <SheetHeader>
              <SheetTitle className="text-left">{t("nav.more")}</SheetTitle>
            </SheetHeader>

            {/* High-use destinations */}
            <div className="mt-4 grid gap-1">
              {primaryLinks.map((link) => (
                <MenuRow key={link.to} {...link} />
              ))}
            </div>

            {/* Less-visited categories, grouped and collapsed by default */}
            <Accordion type="multiple" className="mt-2">
              <AccordionItem value="resources" className="border-b-0">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("footer.resources")}
                </AccordionTrigger>
                <AccordionContent className="grid gap-1">
                  {resourceLinks.map((link) => (
                    <MenuRow key={link.to} {...link} />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="official-legal" className="border-b-0">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("nav.officialLegal")}
                </AccordionTrigger>
                <AccordionContent className="grid gap-1">
                  {officialLegalLinks.map((link) => (
                    <MenuRow key={link.to} {...link} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Languages className="size-4.5 text-muted-foreground" aria-hidden />
                {t("nav.language")}
              </span>
              <div
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-0.5 text-xs font-semibold"
                role="group"
                aria-label={t("nav.language")}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={cn(
                      "rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors",
                      lang === code
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
              {online ? (
                <Wifi className="size-3.5 text-risk-green" aria-hidden />
              ) : (
                <WifiOff className="size-3.5" aria-hidden />
              )}
              {online ? t("common.online") : t("common.offline")}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
