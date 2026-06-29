import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, ExternalLink, Globe, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";
import {
  getApiUsageMetrics,
  type ApiUsageMetrics,
} from "@/lib/funnel.functions";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-extrabold text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

/** Horizontal share bar list (matches the dashboard's ranked-bar language). */
function BarList({
  title,
  icon: Icon,
  rows,
  callsWord,
}: {
  title: string;
  icon: typeof Globe;
  rows: { label: string; calls: number }[];
  callsWord: string;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.calls), 1);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {r.calls.toLocaleString()} {callsWord}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((r.calls / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApiUsagePanel({ secret }: { secret: string }) {
  const { t, lang } = useLang();
  const getMetrics = useServerFn(getApiUsageMetrics);
  const [metrics, setMetrics] = useState<ApiUsageMetrics | null>(null);

  useEffect(() => {
    let alive = true;
    getMetrics({ data: { adminSecret: secret, windowHours: 168 } })
      .then((res) => alive && res.ok && setMetrics(res.metrics))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  const isEmpty = !metrics || metrics.total === 0;

  return (
    <>
      <h2 className="mt-7 flex items-center justify-between gap-2 font-display text-base font-bold">
        <span className="flex items-center gap-2">
          <Activity className="size-4 text-primary" aria-hidden />
          {t("apiUsage.title")}
        </span>
        <span
          className={
            isEmpty
              ? "rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
              : "rounded-full bg-risk-green-soft px-2 py-0.5 text-[11px] font-semibold text-risk-green"
          }
        >
          ● {t("apiUsage.live")}
        </span>
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("apiUsage.subtitle")}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("apiUsage.total7d")} value={metrics?.total ?? 0} />
        <Stat label={t("apiUsage.today")} value={metrics?.today ?? 0} />
        <Stat
          label={t("apiUsage.endpoints")}
          value={metrics?.byEndpoint.length ?? 0}
        />
        <Stat
          label={t("apiUsage.lastCall")}
          value={
            metrics?.lastCall
              ? formatDate(metrics.lastCall, lang)
              : t("apiUsage.never")
          }
        />
      </div>

      {isEmpty ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-card p-4 text-center shadow-sm">
          <p className="text-sm font-medium">{t("apiUsage.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("apiUsage.emptyHint")}
          </p>
          <Link
            to="/datos"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t("apiUsage.docsCta")}
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <BarList
            title={t("apiUsage.byEndpoint")}
            icon={Activity}
            rows={metrics.byEndpoint.map((r) => ({
              label: r.endpoint,
              calls: r.calls,
            }))}
            callsWord={t("apiUsage.calls")}
          />
          <BarList
            title={t("apiUsage.byReferer")}
            icon={Globe}
            rows={metrics.byReferer.map((r) => ({
              label: r.host,
              calls: r.calls,
            }))}
            callsWord={t("apiUsage.calls")}
          />
          {metrics.byState.length > 0 && (
            <BarList
              title={t("apiUsage.byState")}
              icon={MapPin}
              rows={metrics.byState.map((r) => ({
                label: r.state,
                calls: r.calls,
              }))}
              callsWord={t("apiUsage.calls")}
            />
          )}
        </div>
      )}
    </>
  );
}
