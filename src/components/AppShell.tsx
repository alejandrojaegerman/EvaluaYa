import { Link } from "@tanstack/react-router";
import { ShieldCheck, Wifi, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { LanguageToggle } from "./LanguageToggle";
import { OfflineBanner } from "./OfflineBanner";
import { useOnline } from "@/hooks/use-online";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  hideBottomNav = false,
}: {
  children: ReactNode;
  className?: string;
  hideBottomNav?: boolean;
}) {
  const { t } = useLang();
  const online = useOnline();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              {t("app.name")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                online
                  ? "bg-risk-green-soft text-risk-green"
                  : "bg-muted text-muted-foreground",
              )}
              title={online ? t("common.online") : t("common.offline")}
            >
              {online ? (
                <Wifi className="size-3.5" aria-hidden />
              ) : (
                <WifiOff className="size-3.5" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {online ? t("common.online") : t("common.offline")}
              </span>
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <OfflineBanner />

      <main
        className={cn(
          "mx-auto w-full max-w-screen-sm flex-1 px-4 pb-28 pt-5",
          className,
        )}
      >
        {children}
      </main>

      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
