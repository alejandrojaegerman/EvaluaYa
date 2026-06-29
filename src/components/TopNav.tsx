import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FolderOpen,
  HandHeart,
  Home,
  LifeBuoy,
  Map,
  MessageSquareHeart,
  ShieldCheck,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHasReports } from "@/hooks/use-has-reports";
import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";

const linkClass =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-accent/60 data-[status=active]:text-foreground";

/** Desktop-only top navigation. Hidden on mobile (BottomNav takes over). */
export function TopNav() {
  const { t, lang } = useLang();
  const online = useOnline();
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

        <nav className="ml-2 flex items-center gap-1">
          <Link
            to="/"
            className={linkClass}
            activeOptions={{ exact: true }}
            activeProps={{ "data-status": "active" }}
          >
            <Home className="size-4" aria-hidden />
            {t("nav.home")}
          </Link>
          <Link
            to={lang === "es" ? "/temblo-en-venezuela-hoy" : "/earthquake-in-venezuela-today"}
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <Waves className="size-4" aria-hidden />
            {t("nav.today")}
          </Link>
          <Link
            to="/mapa"
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <Map className="size-4" aria-hidden />
            {t("nav.map")}
          </Link>
          <Link
            to="/datos"
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <BarChart3 className="size-4" aria-hidden />
            {t("nav.data")}
          </Link>
          <Link
            to="/voluntarios"
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <HandHeart className="size-4" aria-hidden />
            {t("nav.volunteers")}
          </Link>
          <Link
            to="/metodologia"
            className={linkClass}
            activeProps={{ "data-status": "active" }}
          >
            <BookOpen className="size-4" aria-hidden />
            {t("nav.methodology")}
          </Link>
          {hasReports && (
            <Link
              to="/mis-reportes"
              className={linkClass}
              activeProps={{ "data-status": "active" }}
            >
              <FolderOpen className="size-4" aria-hidden />
              {t("nav.reports")}
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className={linkClass}>
              {t("nav.more")}
              <ChevronDown className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
            title={online ? t("common.online") : t("common.offline")}
          >
            {online ? (
              <Wifi className="size-3.5 text-risk-green" aria-hidden />
            ) : (
              <WifiOff className="size-3.5" aria-hidden />
            )}
            {online ? t("common.online") : t("common.offline")}
          </span>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
