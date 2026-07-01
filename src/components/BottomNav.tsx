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
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";


import { useHasReports } from "@/hooks/use-has-reports";
import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

export function BottomNav() {
  const { t, lang, setLang } = useLang();
  const online = useOnline();
  const hasReports = useHasReports();
  const [open, setOpen] = useState(false);

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
            className="mx-auto max-w-screen-sm rounded-t-3xl"
          >
            <SheetHeader>
              <SheetTitle className="text-left">{t("nav.more")}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 grid gap-1">
              <SheetClose asChild>
                <Link
                  to="/mapa"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Map className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.map")}
                </Link>
              </SheetClose>


              {hasReports && (
                <SheetClose asChild>
                  <Link
                    to="/mis-reportes"
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <FolderOpen className="size-4.5" aria-hidden />
                    </span>
                    {t("nav.reports")}
                  </Link>
                </SheetClose>
              )}

              <SheetClose asChild>
                <Link
                  to="/datos"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <BarChart3 className="size-4.5" aria-hidden />
                  </span>
                  <span className="flex-1">
                    {t("nav.data")}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t("nav.dataDesc")}
                    </span>
                  </span>
                </Link>
              </SheetClose>

              <SheetClose asChild>

                <Link
                  to="/voluntarios"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <HandHeart className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.volunteers")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/metodologia"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <BookOpen className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.methodology")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/ayuda"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <LifeBuoy className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.help")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/feedback"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <MessageSquareHeart className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.feedback")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/legal"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Scale className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.legal")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/privacidad"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <ShieldQuestion className="size-4.5" aria-hidden />
                  </span>
                  {t("nav.privacy")}
                </Link>
              </SheetClose>

            </div>

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
