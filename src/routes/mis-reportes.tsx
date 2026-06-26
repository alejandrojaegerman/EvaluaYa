import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  FolderOpen,
  Home as HomeIcon,
  LogOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { SaveReportsCard } from "@/components/SaveReportsCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  claimAssessments,
  getMyAssessments,
  type MyAssessment,
} from "@/lib/account.functions";
import { getDeviceId } from "@/lib/device-id";
import { getHistory } from "@/lib/history";
import { useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/mis-reportes")({
  head: () => ({
    meta: [
      { title: "Mis reportes — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MyReportsPage,
});

type Status = "loading" | "signed_out" | "ready";

function MyReportsPage() {
  const { t } = useLang();
  const [status, setStatus] = useState<Status>("loading");
  const [reports, setReports] = useState<MyAssessment[]>([]);
  const claimedRef = useRef(false);

  const loadForUser = useCallback(async () => {
    if (!claimedRef.current) {
      claimedRef.current = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const deviceId = params.get("d") || getDeviceId();
        const publicIds = getHistory().map((h) => h.publicId);
        await claimAssessments({ data: { deviceId, publicIds } });
      } catch {
        /* non-fatal — still show whatever is already claimed */
      }
    }
    try {
      const list = await getMyAssessments();
      setReports(list);
    } catch {
      setReports([]);
    }
    setStatus("ready");
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        loadForUser();
      } else {
        setStatus("signed_out");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      if (session) {
        loadForUser();
      } else {
        claimedRef.current = false;
        setReports([]);
        setStatus("signed_out");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadForUser]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <FolderOpen className="size-5 text-primary" aria-hidden />
        <h1 className="font-display text-2xl font-extrabold">
          {t("account.myReportsTitle")}
        </h1>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("account.loading")}
        </p>
      )}

      {status === "signed_out" && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("account.signInBody")}
          </p>
          <SaveReportsCard />
        </>
      )}

      {status === "ready" && (
        <>
          {reports.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("account.emptyReports")}
            </p>
          ) : (
            <ul className="mt-6 space-y-2">
              {reports.map((r) => (
                <li key={r.publicId}>
                  <Link
                    to="/a/$publicId"
                    params={{ publicId: r.publicId }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40"
                  >
                    {r.riskLevel && <RiskBadge level={r.riskLevel} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.address || r.state || t("home.viewResult")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(
                          r.createdAt,
                          r.language === "es" ? "es" : "en",
                        )}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid gap-2">
            <Button asChild variant="outline">
              <Link to="/">
                <HomeIcon className="size-4" />
                {t("result.goHome")}
              </Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="size-4" />
              {t("account.signOut")}
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
