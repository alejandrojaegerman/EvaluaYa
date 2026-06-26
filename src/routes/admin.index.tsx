import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Lock,
  BarChart3,
  Users,
  HandHeart,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ClipboardList,
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
import { RiskFactorsPanel } from "@/components/RiskFactorsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { formatDate, formatDayLabel } from "@/lib/datetime";
import { RISK_HEX } from "@/lib/risk";
import {
  adminGetAnalytics,
  adminGetStateDrilldown,
  type AdminAnalytics,
  type StateDrilldown,
} from "@/lib/admin-analytics.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin · Panel — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function rgb(level: "red" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

function AdminDashboard() {
  const { t, lang } = useLang();
  const getAnalytics = useServerFn(adminGetAnalytics);
  const getDrilldown = useServerFn(adminGetStateDrilldown);

  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<AdminAnalytics | null>(null);

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


  async function onUnlock(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await getAnalytics({ data: { adminSecret: secret } });
      if (res.ok) {
        setData(res.analytics);
        setUnlocked(true);
      } else {
        toast.error(t("admin.wrong"));
      }
    } catch {
      toast.error(t("admin.wrong"));
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

  return (
    <AppShell>
      <header className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            {t("dash.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
        </div>
      </header>

      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to="/admin/voluntarios">
          <ClipboardList className="size-4" />
          {t("dash.toReview")}
          <ArrowRight className="size-4" />
        </Link>
      </Button>

      {/* Assessments */}
      <SectionTitle icon={BarChart3} title={t("dash.assessments")} />
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

      <RiskBar green={a.green} yellow={a.yellow} red={a.red} t={t} />

      {series.length > 0 && (
        <Card>
          <p className="text-sm font-semibold">{t("dash.trend")}</p>
          <div className="mt-3 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} width={28} />
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

      {data.topStates.length > 0 && (
        <Card>
          <p className="text-sm font-semibold">{t("dash.topStates")}</p>
          <ul className="mt-3 space-y-1">
            {data.topStates.map((s) => {
              const expanded = expandedState === s.state;
              const drill = drilldownCache[s.state];
              return (
                <li key={s.state} className="border-b border-border last:border-0">
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
                      <MiniDots green={s.green} yellow={s.yellow} red={s.red} />
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
                                    style={{ backgroundColor: rgb(r.riskLevel) }}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">
                                      {[
                                        r.buildingType
                                          ? t(`property.type.${r.buildingType}`)
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
                                      {r.flaggedCount} {t("dash.issuesWord")}
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

      {/* Volunteers */}
      <SectionTitle icon={Users} title={t("dash.volunteers")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("dash.totalVolunteers")} value={v.total} />
        <Stat label={t("admin.approved")} value={v.approved} />
        <Stat label={t("admin.pending")} value={v.pending} highlight={v.pending > 0} />
        <Stat label={t("dash.orgs")} value={v.organizations} hint={`${v.individuals} ${t("dash.individuals")}`} />
      </div>

      {data.coverage.length > 0 && (
        <Card>
          <p className="text-sm font-semibold">{t("dash.coverage")}</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {data.coverage.map((c) => (
              <li key={c.state} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted-foreground">{c.state}</span>
                <span className="font-semibold tabular-nums">{c.engineers}</span>
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
          value={m.avgClaimHours != null ? `${m.avgClaimHours.toFixed(1)}h` : "—"}
        />
      </div>

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
        <p className="mt-1 text-xs text-muted-foreground">{t("dash.gapsHint")}</p>
        {data.coverageGaps.length === 0 ? (
          <p className="mt-3 text-sm text-risk-green">{t("dash.noGaps")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.coverageGaps.map((g) => (
              <li key={g.state} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="truncate">{g.state}</span>
                <span className="rounded-full bg-risk-red-soft px-2 py-0.5 text-xs font-bold text-risk-red">
                  {g.openRequests} {t("dash.openShort")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="h-8" />
    </AppShell>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Users;
  title: string;
}) {
  return (
    <h2 className="mt-7 flex items-center gap-2 font-display text-base font-bold">
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

function RiskBar({
  green,
  yellow,
  red,
  t,
}: {
  green: number;
  yellow: number;
  red: number;
  t: (k: string) => string;
}) {
  const total = green + yellow + red;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <Card>
      <p className="text-sm font-semibold">{t("dash.distribution")}</p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted">
        <div style={{ width: `${pct(red)}%`, backgroundColor: rgb("red") }} />
        <div style={{ width: `${pct(yellow)}%`, backgroundColor: rgb("yellow") }} />
        <div style={{ width: `${pct(green)}%`, backgroundColor: rgb("green") }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Legend color={rgb("red")} label={t("result.red.tag")} value={red} />
        <Legend color={rgb("yellow")} label={t("result.yellow.tag")} value={yellow} />
        <Legend color={rgb("green")} label={t("result.green.tag")} value={green} />
      </div>
    </Card>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div>
      <span className="flex items-center justify-center gap-1.5">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold">{value}</span>
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniDots({
  green,
  yellow,
  red,
}: {
  green: number;
  yellow: number;
  red: number;
}) {
  return (
    <span className="flex items-center gap-1">
      {red > 0 && (
        <span className="rounded bg-risk-red-soft px-1.5 text-[11px] font-bold text-risk-red">
          {red}
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
