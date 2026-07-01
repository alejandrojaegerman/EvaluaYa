import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FolderOpen,
  
  HandHeart,
  LifeBuoy,
  Map,
  MessageSquareHeart,
  Scale,
  ShieldCheck,
  ShieldQuestion,
  Waves,
} from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHasReports } from "@/hooks/use-has-reports";
import { useLang } from "@/lib/i18n";

const linkClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-accent/60 data-[status=active]:text-foreground";

/** Desktop-only top navigation. Hidden on mobile (BottomNav takes over). */
export function TopNav() {
  const { t, lang } = useLang();
  const hasReports = useHasReports();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/85 backdrop-blur-md md:block print:hidden">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            {t("app.name")}
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-0.5">
          {/* Primary action #1 — start an assessment */}
          <Link
            to="/assess/property"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            activeProps={{ "data-status": "active" }}
          >
            <ClipboardCheck className="size-4" aria-hidden />
            {t("nav.evaluate")}
          </Link>
          {/* Primary action #2 — register as a volunteer engineer */}
          <Link
            to="/voluntarios"
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <HandHeart className="size-4" aria-hidden />
            {t("nav.volunteers")}
          </Link>
          {/* Primary action #3 — did it just shake? */}
          <Link
            to={lang === "es" ? "/temblo-en-venezuela-hoy" : "/earthquake-in-venezuela-today"}
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <Waves className="size-4" aria-hidden />
            {t("nav.today")}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className={linkClass}>
              {t("nav.more")}
              <ChevronDown className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/mapa" className="flex items-center gap-2">
                  <Map className="size-4" aria-hidden />
                  {t("nav.map")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/datos" className="flex items-center gap-2">
                  <BarChart3 className="size-4" aria-hidden />
                  {t("nav.data")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/guia" className="flex items-center gap-2">
                  <BookOpen className="size-4" aria-hidden />
                  {t("nav.learn")}
                </Link>
              </DropdownMenuItem>
              {hasReports && (
                <DropdownMenuItem asChild>
                  <Link to="/mis-reportes" className="flex items-center gap-2">
                    <FolderOpen className="size-4" aria-hidden />
                    {t("nav.reports")}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/ayuda" className="flex items-center gap-2">
                  <LifeBuoy className="size-4" aria-hidden />
                  {t("nav.help")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/feedback" className="flex items-center gap-2">
                  <MessageSquareHeart className="size-4" aria-hidden />
                  {t("nav.feedback")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/legal" className="flex items-center gap-2">
                  <Scale className="size-4" aria-hidden />
                  {t("nav.legal")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/privacidad" className="flex items-center gap-2">
                  <ShieldQuestion className="size-4" aria-hidden />
                  {t("nav.privacy")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
