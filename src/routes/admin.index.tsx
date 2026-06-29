import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Lock,
  BarChart3,
  Building2,
  Users,
  UserPlus,
  HandHeart,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ListChecks,
  LayoutDashboard,
  Database,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { QualityWatchdog } from "@/components/admin/QualityWatchdog";
import { SeguimientoPanel } from "@/components/admin/SeguimientoPanel";
import { VolunteersPanel } from "@/components/admin/VolunteersPanel";
import { RiskFactorsPanel } from "@/components/RiskFactorsPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { formatDate, formatDayLabel } from "@/lib/datetime";
import { RISK_HEX } from "@/lib/risk";
import { cn } from "@/lib/utils";
import {
  adminGetAnalytics,
  adminGetBuildingClusters,
  adminGetStateDrilldown,
  type AdminAnalytics,
  type BuildingCluster,
  type StateDrilldown,
} from "@/lib/admin-analytics.functions";
import {
  adminGetAccounts,
  type AdminAccounts,
} from "@/lib/admin-accounts.functions";
import {
  getFunnelMetrics,
  FUNNEL_STEPS,
  type FunnelMetrics,
  type FunnelStep,
} from "@/lib/funnel.functions";
import {
  adminListEngineers,
  adminReviewEngineer,
  adminResendAccessLink,
  adminRotateAccessLink,
  adminListHelpRequests,
  adminRemindEngineer,
  adminReclaimRequest,
  adminReassignRequest,
  type AdminEngineer,
  type AdminHelpRequest,
  type AdminMatchingProgress,
} from "@/lib/volunteers.functions";
import { getPhotoStats, type PhotoStats } from "@/lib/stats.functions";
import { PhotoEvidencePanel } from "@/components/PhotoEvidencePanel";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin · Panel — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

type AdminTab = "seguimiento" | "resumen" | "voluntarios" | "datos";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

function AdminDashboard() {
  const { t, lang } = useLang();
  const getAnalytics = useServerFn(adminGetAnalytics);
  const getDrilldown = useServerFn(adminGetStateDrilldown);
  const getClusters = useServerFn(adminGetBuildingClusters);
  const getAccounts = useServerFn(adminGetAccounts);
  const getFunnel = useServerFn(getFunnelMetrics);
  const listEngineers = useServerFn(adminListEngineers);
  const listRequests = useServerFn(adminListHelpRequests);
  const review = useServerFn(adminReviewEngineer);
  const resend = useServerFn(adminResendAccessLink);
  const rotate = useServerFn(adminRotateAccessLink);
  const remindEngineer = useServerFn(adminRemindEngineer);
  const reclaimRequest = useServerFn(adminReclaimRequest);
  const reassignRequest = useServerFn(adminReassignRequest);

  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<AdminTab>("seguimiento");

  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [clusters, setClusters] = useState<BuildingCluster[]>([]);
  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null);
  const [accounts, setAccounts] = useState<AdminAccounts | null>(null);
  const [photoStats, setPhotoStats] = useState<PhotoStats | null>(null);

  // Volunteer + help-request state (shared by Seguimiento and Voluntarios tabs).
  const [engineers, setEngineers] = useState<AdminEngineer[]>([]);
  const [requests, setRequests] = useState<AdminHelpRequest[]>([]);
  const [progress, setProgress] = useState<AdminMatchingProgress | null>(null);

  // Per-state "why" drill-down.
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [drilldownCache, setDrilldownCache] = useState<
    Record<string, StateDrilldown>
  >({});
  const [drilldownLoading, setDrilldownLoading] = useState<string | null>(null);

  function toggleState(state: string) {
    if (expandedState === state) {
      setExpandedState(null);
      return;
    }
    setExpandedState(state);
    if (drilldownCache[state]) return;
    setDrilldownLoading(state);
    getDrilldown({ data: { adminSecret: secret, state } })
      .then((res) => {
        if (res.ok) {
          setDrilldownCache((prev) => ({ ...prev, [state]: res.drilldown }));
        }
      })
      .catch(() => {})
      .finally(() =>
        setDrilldownLoading((cur) => (cur === state ? null : cur)),
      );
  }

  // Refresh volunteer + help-request data after follow-through actions.
  async function refreshVolunteers(s: string) {
    const [e, r] = await Promise.all([
      listEngineers({ data: { adminSecret: s } }),
      listRequests({ data: { adminSecret: s } }),
    ]);
    if (e.ok) setEngineers(e.engineers);
    if (r.ok) {
      setRequests(r.requests);
      setProgress(r.progress);
    }
  }

  async function onUnlock(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await getAnalytics({ data: { adminSecret: secret } });
      if (res.ok) {
        setData(res.analytics);
        setUnlocked(true);
        refreshVolunteers(secret).catch(() => {});
        getClusters({ data: { adminSecret: secret } })
          .then((c) => {
            if (c.ok) setClusters(c.clusters);
          })
          .catch(() => {});
        getAccounts({ data: { adminSecret: secret } })
          .then((acc) => {
            if (acc.ok) setAccounts(acc.accounts);
          })
          .catch(() => {});
        getFunnel({ data: { adminSecret: secret, windowHours: 48 } })
          .then((f) => {
            if (f.ok) setFunnel(f.metrics);
          })
          .catch(() => {});
        getPhotoStats({ data: {} })
          .then((s) => setPhotoStats(s))
          .catch(() => {});
      } else {
        toast.error(t("admin.wrong"));
      }
    } catch {
      toast.error(t("admin.wrong"));
    } finally {
      setBusy(false);
    }
  }

  async function onReview(id: string, action: "approve" | "reject") {
    const res = await review({ data: { adminSecret: secret, id, action } });
    if (res.ok) await refreshVolunteers(secret);
    else toast.error(t("admin.wrong"));
  }

  async function onResend(e: AdminEngineer) {
    setBusy(true);
    try {
      const res = await resend({ data: { adminSecret: secret, id: e.id } });
      if (res.ok) toast.success(t("admin.resent"));
      else toast.error(t("admin.resendFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onRotate(e: AdminEngineer) {
    if (!window.confirm(t("admin.rotateConfirm"))) return;
    setBusy(true);
    try {
      const res = await rotate({ data: { adminSecret: secret, id: e.id } });
      if (res.ok) {
        toast.success(t("admin.rotated"));
        await refreshVolunteers(secret);
      } else toast.error(t("admin.rotateFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemind(id: string) {
    setBusy(true);
    try {
      const res = await remindEngineer({
        data: { adminSecret: secret, requestId: id },
      });
      if (res.ok) {
        toast.success(t("vadmin.reminded"));
        await refreshVolunteers(secret);
      } else toast.error(t("vadmin.actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function onReclaim(id: string) {
    setBusy(true);
    try {
      const res = await reclaimRequest({
        data: { adminSecret: secret, requestId: id },
      });
      if (res.ok) {
        toast.success(t("vadmin.reclaimed"));
        await refreshVolunteers(secret);
      } else toast.error(t("vadmin.actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function onReassign(id: string, engineerId: string) {
    setBusy(true);
    try {
      const res = await reassignRequest({
        data: { adminSecret: secret, requestId: id, engineerId },
      });
      if (res.ok) {
        toast.success(t("vadmin.reassigned"));
        await refreshVolunteers(secret);
      } else toast.error(t("vadmin.actionError"));
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked || !data) {
    return (
      <AppShell>
        <form
          onSubmit={onUnlock}
          className="mx-auto mt-12 max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" aria-hidden />
            <h1 className="font-display text-lg font-bold">
              {t("dash.title")}
            </h1>
          </div>
          <div className="mt-4">
            <Label htmlFor="secret">{t("admin.secret")}</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-1.5"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={busy}>
            {t("admin.unlock")}
          </Button>
        </form>
      </AppShell>
    );
  }

  const a = data.assessments;
  const v = data.volunteers;
  const m = data.matching;
  const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
  const series = data.timeseries.map((d) => ({
    ...d,
    label: formatDayLabel(d.day, lang),
  }));

  // Count of items needing follow-through, for the tab badge.
  const worklistCount = requests.filter(
    (r) => r.status === "open" || (r.status === "claimed" && r.stalled),
  ).length;
  const pendingVolunteers = engineers.filter(
    (e) => e.status === "pending",
  ).length;

  const tabs: { key: AdminTab; label: string; icon: typeof Users; badge?: number }[] =
    [
      {
        key: "seguimiento",
        label: t("admin.tab.seguimiento"),
        icon: ListChecks,
        badge: worklistCount,
      },
      { key: "resumen", label: t("admin.tab.resumen"), icon: LayoutDashboard },
      {
        key: "voluntarios",
        label: t("admin.tab.voluntarios"),
        icon: Users,
        badge: pendingVolunteers,
      },
      { key: "datos", label: t("admin.tab.datos"), icon: Database },
    ];

  return (
    <AppShell>
      <header className="mt-2">
        <h1 className="font-display text-xl font-extrabold tracking-tight">
          {t("dash.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dash.subtitle")}
        </p>
      </header>

      {/* Tab bar */}
      <div
        role="tablist"
        className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
      >
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(tb.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {tb.label}
              {tb.badge != null && tb.badge > 0 && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-risk-red-soft text-risk-red",
                  )}
                >
                  {tb.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "seguimiento" && (
          <SeguimientoPanel
            requests={requests}
            engineers={engineers}
            progress={progress}
            busy={busy}
            onRemind={onRemind}
            onReclaim={onReclaim}
            onReassign={onReassign}
          />
        )}

        {tab === "voluntarios" && (
          <VolunteersPanel
            engineers={engineers}
            requests={requests}
            progress={progress}
            busy={busy}
            onReview={onReview}
            onResend={onResend}
            onRotate={onRotate}
          />
        )}

        {tab === "resumen" && (
          <>
            {/* Assessments */}
            <SectionTitle icon={BarChart3} title={t("dash.assessments")} first />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("dash.totalReports")} value={a.total} />
              <Stat
                label={t("dash.completion")}
                value={fmtPct(a.completionRate)}
                hint={`${a.analyzed}/${a.total}`}
              />
              <Stat label={t("dash.drafts")} value={a.drafts} />
              <Stat label={t("dash.areas")} value={data.topStates.length} />
            </div>

            <Card>
              <p className="text-sm font-semibold">{t("dash.distribution")}</p>
              <div className="mt-3">
                <RiskGauge
                  green={a.green}
                  yellow={a.yellow}
                  orange={a.orange}
                  red={a.red}
                />
              </div>
            </Card>

            {series.length > 0 && (
              <Card>
                <p className="text-sm font-semibold">{t("dash.trend")}</p>
                <div className="mt-3 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={series}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="fillTotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeOpacity={0.15} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        minTickGap={24}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        allowDecimals={false}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "12px",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name={t("dash.totalReports")}
                        stroke="hsl(var(--primary))"
                        fill="url(#fillTotal)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {funnel && <FunnelCard metrics={funnel} t={t} />}

            {data.topStates.length > 0 && (
              <Card>
                <p className="text-sm font-semibold">{t("dash.topStates")}</p>
                <ul className="mt-3 space-y-1">
                  {data.topStates.map((s) => {
                    const expanded = expandedState === s.state;
                    const drill = drilldownCache[s.state];
                    return (
                      <li
                        key={s.state}
                        className="border-b border-border last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleState(s.state)}
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm transition-colors hover:bg-accent/30"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <ChevronDown
                              className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${
                                expanded ? "rotate-180" : ""
                              }`}
                              aria-hidden
                            />
                            <span className="truncate">{s.state}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <MiniDots
                              green={s.green}
                              yellow={s.yellow}
                              orange={s.orange}
                              red={s.red}
                            />
                            <span className="w-8 text-right font-semibold tabular-nums">
                              {s.total}
                            </span>
                          </span>
                        </button>
                        {expanded && (
                          <div className="space-y-4 rounded-xl bg-muted/30 p-3">
                            <RiskFactorsPanel
                              factors={drill?.factors ?? null}
                              loading={drilldownLoading === s.state}
                            />
                            {drill && drill.reports.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {t("dash.recentReports")}
                                </p>
                                <ul className="mt-2 divide-y divide-border">
                                  {drill.reports.map((r) => (
                                    <li key={r.publicId}>
                                      <Link
                                        to="/a/$publicId"
                                        params={{ publicId: r.publicId }}
                                        className="flex items-center gap-2 py-2 text-xs transition-colors hover:bg-accent/30"
                                      >
                                        <span
                                          className="size-2.5 shrink-0 rounded-full"
                                          style={{
                                            backgroundColor: rgb(r.riskLevel),
                                          }}
                                          aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                          <span className="block truncate font-medium">
                                            {[
                                              r.buildingType
                                                ? t(
                                                    `property.type.${r.buildingType}`,
                                                  )
                                                : null,
                                              r.age
                                                ? t(`property.age.${r.age}`)
                                                : null,
                                            ]
                                              .filter(Boolean)
                                              .join(" · ") || r.municipality}
                                          </span>
                                          <span className="block truncate text-muted-foreground">
                                            {formatDate(r.createdAt, lang)} ·{" "}
                                            {r.flaggedCount}{" "}
                                            {t("dash.issuesWord")}
                                            {r.seismicIntensity != null
                                              ? ` · MMI ${r.seismicIntensity}`
                                              : ""}
                                          </span>
                                        </span>
                                        <ChevronRight
                                          className="size-4 shrink-0 text-muted-foreground"
                                          aria-hidden
                                        />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            <SectionTitle icon={Users} title={t("dash.volunteers")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("dash.totalVolunteers")} value={v.total} />
              <Stat label={t("admin.approved")} value={v.approved} />
              <Stat
                label={t("admin.pending")}
                value={v.pending}
                highlight={v.pending > 0}
              />
              <Stat
                label={t("dash.orgs")}
                value={v.organizations}
                hint={`${v.individuals} ${t("dash.individuals")}`}
              />
            </div>

            {data.coverage.length > 0 && (
              <Card>
                <p className="text-sm font-semibold">{t("dash.coverage")}</p>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                  {data.coverage.map((c) => (
                    <li
                      key={c.state}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {c.state}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {c.engineers}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Matching */}
            <SectionTitle icon={HandHeart} title={t("dash.matching")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("dash.requests")} value={m.total} />
              <Stat label={t("dash.open")} value={m.open} highlight={m.open > 0} />
              <Stat label={t("dash.claimRate")} value={fmtPct(m.claimRate)} />
              <Stat
                label={t("dash.avgClaim")}
                value={
                  m.avgClaimHours != null ? `${m.avgClaimHours.toFixed(1)}h` : "—"
                }
              />
            </div>

            <Card>
              <p className="text-sm font-semibold">
                {t("admin.matchingProgress")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dash.matchingProgressHint")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat
                  label={t("admin.stageClaimed")}
                  value={m.progress.claimedOnly}
                />
                <Stat
                  label={t("admin.stageContacted")}
                  value={m.progress.contacted}
                />
                <Stat label={t("admin.stageVisited")} value={m.progress.visited} />
                <Stat
                  label={t("admin.stageResolved")}
                  value={m.progress.resolved}
                />
                <Stat
                  label={t("admin.stalled")}
                  value={m.progress.stalled}
                  highlight={m.progress.stalled > 0}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={
                    data.coverageGaps.length > 0
                      ? "size-4 text-risk-red"
                      : "size-4 text-muted-foreground"
                  }
                  aria-hidden
                />
                <p className="text-sm font-semibold">{t("dash.gaps")}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dash.gapsHint")}
              </p>
              {data.coverageGaps.length === 0 ? (
                <p className="mt-3 text-sm text-risk-green">{t("dash.noGaps")}</p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {data.coverageGaps.map((g) => (
                    <li
                      key={g.state}
                      className="flex items-center justify-between gap-2 py-2 text-sm"
                    >
                      <span className="truncate">{g.state}</span>
                      <span className="rounded-full bg-risk-red-soft px-2 py-0.5 text-xs font-bold text-risk-red">
                        {g.openRequests} {t("dash.openShort")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        {tab === "datos" && (
          <>
            {/* Quality, completeness & verification (Goal 1) */}
            <QualityWatchdog secret={secret} />

            {/* Saved accounts (optional passwordless "Save my reports") */}
            {accounts && (
              <>
                <SectionTitle icon={UserPlus} title={t("dash.accounts")} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    label={t("dash.totalAccounts")}
                    value={accounts.totalAccounts}
                  />
                  <Stat
                    label={t("dash.accountsWithReports")}
                    value={accounts.withReports}
                  />
                  <Stat
                    label={t("dash.accountsNoReports")}
                    value={accounts.withoutReports}
                    highlight={accounts.withoutReports > 0}
                  />
                </div>
                <Card>
                  <p className="text-xs text-muted-foreground">
                    {t("dash.accountsHint")}
                  </p>
                  {accounts.recent.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("dash.noAccounts")}
                    </p>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-semibold">
                        {t("dash.recentSignups")}
                      </p>
                      <ul className="mt-2 divide-y divide-border">
                        {accounts.recent.map((acc, i) => (
                          <li
                            key={`${acc.email}-${i}`}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {acc.email}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {acc.createdAt
                                  ? formatDate(acc.createdAt, lang)
                                  : "—"}
                              </span>
                            </span>
                            <span
                              className={
                                acc.reportCount > 0
                                  ? "shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums"
                                  : "shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums"
                              }
                            >
                              {acc.reportCount} {t("dash.reportsWord")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card>
              </>
            )}

            {/* Buildings with multiple reports */}
            {clusters.length > 0 && (
              <>
                <SectionTitle icon={Building2} title={t("dash.buildings")} />
                <Card>
                  <p className="text-xs text-muted-foreground">
                    {t("dash.buildingsHint")}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {clusters.map((c, i) => (
                      <li
                        key={`${c.state}-${c.municipality}-${c.buildingName}-${i}`}
                        className="rounded-xl border bg-card/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {c.buildingName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.municipality} · {c.state}
                              {c.lastReport
                                ? ` · ${formatDate(c.lastReport, lang)}`
                                : ""}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">
                            {c.total} {t("dash.reportsWord")}
                          </span>
                        </div>
                        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          {c.red > 0 && (
                            <div
                              className="h-full bg-risk-red"
                              style={{ width: `${(c.red / c.total) * 100}%` }}
                            />
                          )}
                          {c.orange > 0 && (
                            <div
                              className="h-full bg-risk-orange"
                              style={{ width: `${(c.orange / c.total) * 100}%` }}
                            />
                          )}
                          {c.yellow > 0 && (
                            <div
                              className="h-full bg-risk-yellow"
                              style={{ width: `${(c.yellow / c.total) * 100}%` }}
                            />
                          )}
                          {c.green > 0 && (
                            <div
                              className="h-full bg-risk-green"
                              style={{ width: `${(c.green / c.total) * 100}%` }}
                            />
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            {c.red} {t("building.legend.red")}
                          </span>
                          {c.orange > 0 && (
                            <span>
                              {c.orange} {t("building.legend.orange")}
                            </span>
                          )}
                          <span>
                            {c.yellow} {t("building.legend.yellow")}
                          </span>
                          <span>
                            {c.green} {t("building.legend.green")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      <div className="h-8" />
    </AppShell>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  first,
}: {
  icon: typeof Users;
  title: string;
  first?: boolean;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-2 font-display text-base font-bold",
        first ? "mt-1" : "mt-7",
      )}
    >
      <Icon className="size-4 text-primary" aria-hidden />
      {title}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {children}
    </section>
  );
}

// Funnel conversion card: shows how many unique devices reached each step of
// the evaluation flow over the last 48h, the step-to-step retention, and flags
// the biggest single drop-off so a flow regression is obvious at a glance.
function FunnelCard({
  metrics,
  t,
}: {
  metrics: FunnelMetrics;
  t: (key: string) => string;
}) {
  const counts = new Map<FunnelStep, number>(
    metrics.steps.map((s) => [s.step, s.devices]),
  );
  const rows = FUNNEL_STEPS.map((step) => ({
    step,
    devices: counts.get(step) ?? 0,
  }));
  const max = Math.max(1, ...rows.map((r) => r.devices));

  // Overall completion: result_reached / property_started.
  const started =
    rows.find((r) => r.step === "property_started")?.devices ?? 0;
  const finished =
    rows.find((r) => r.step === "result_reached")?.devices ?? 0;
  const completion = started > 0 ? Math.round((finished / started) * 100) : 0;

  // Find the worst step-to-step drop within the active flow (excludes home_cta,
  // which is upstream of the flow and skews the first ratio).
  const flow = rows.filter((r) => r.step !== "home_cta");
  let worstStep: FunnelStep | null = null;
  let worstRetention = 101;
  for (let i = 1; i < flow.length; i++) {
    const prev = flow[i - 1].devices;
    const cur = flow[i].devices;
    if (prev <= 0) continue;
    const retention = Math.round((cur / prev) * 100);
    if (retention < worstRetention) {
      worstRetention = retention;
      worstStep = flow[i].step;
    }
  }
  const hasData = rows.some((r) => r.devices > 0);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("dash.funnel.title")}</p>
        <span className="text-xs text-muted-foreground">
          {t("dash.funnel.window")}
        </span>
      </div>

      {!hasData ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("dash.funnel.empty")}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold tracking-tight">
              {completion}%
            </span>
            <span className="text-xs text-muted-foreground">
              {t("dash.funnel.completion")}
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {rows.map((r, i) => {
              const prev = i > 0 ? rows[i - 1].devices : null;
              const retention =
                prev && prev > 0
                  ? Math.round((r.devices / prev) * 100)
                  : null;
              const isWorst = r.step === worstStep && r.devices > 0;
              return (
                <li key={r.step}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">
                      {t(`dash.funnel.step.${r.step}`)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {r.devices}
                      {retention !== null && (
                        <span
                          className={
                            isWorst
                              ? "ml-1 font-semibold text-[hsl(var(--destructive))]"
                              : "ml-1"
                          }
                        >
                          ({retention}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((r.devices / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {worstStep && worstRetention < 60 && (
            <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t("dash.funnel.biggestDrop")}{" "}
              <span className="font-semibold text-foreground">
                {t(`dash.funnel.step.${worstStep}`)}
              </span>{" "}
              ({worstRetention}%)
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p
        className={
          highlight
            ? "font-display text-2xl font-extrabold text-risk-red"
            : "font-display text-2xl font-extrabold text-primary"
        }
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function MiniDots({
  green,
  yellow,
  orange = 0,
  red,
}: {
  green: number;
  yellow: number;
  orange?: number;
  red: number;
}) {
  return (
    <span className="flex items-center gap-1">
      {red > 0 && (
        <span className="rounded bg-risk-red-soft px-1.5 text-[11px] font-bold text-risk-red">
          {red}
        </span>
      )}
      {orange > 0 && (
        <span className="rounded bg-risk-orange-soft px-1.5 text-[11px] font-bold text-risk-orange">
          {orange}
        </span>
      )}
      {yellow > 0 && (
        <span className="rounded bg-risk-yellow-soft px-1.5 text-[11px] font-bold text-risk-yellow">
          {yellow}
        </span>
      )}
      {green > 0 && (
        <span className="rounded bg-risk-green-soft px-1.5 text-[11px] font-bold text-risk-green">
          {green}
        </span>
      )}
    </span>
  );
}
