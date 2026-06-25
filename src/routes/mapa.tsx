import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { InstitutionLeadForm } from "@/components/InstitutionLeadForm";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import {
  getDamageAggregates,
  getDamageTotals,
  type AreaAggregate,
  type DamageTotals,
} from "@/lib/stats.functions";
import { ESTADOS, getEstado, outlinePath, projectToSvg } from "@/lib/venezuela";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de daños — EvalúaYa" },
      {
        name: "description",
        content:
          "Mapa comunitario de daños estructurales por zona en Venezuela. Datos anónimos y abiertos.",
      },
    ],
  }),
  component: MapPage,
});

type RiskKey = "red" | "yellow" | "green";

function dominantRisk(a: { green: number; yellow: number; red: number }): RiskKey {
  if (a.red >= a.yellow && a.red >= a.green) return "red";
  if (a.yellow >= a.green) return "yellow";
  return "green";
}

function rgb(level: RiskKey): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

const MAP_W = 320;
const MAP_H = 300;

function MapPage() {
  const { t, lang } = useLang();
  const [totals, setTotals] = useState<DamageTotals | null>(null);
  const [areas, setAreas] = useState<AreaAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getDamageTotals(), getDamageAggregates()])
      .then(([tot, ag]) => {
        if (!active) return;
        setTotals(tot);
        setAreas(ag);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Aggregate per-estado for the bubble map.
  const stateBubbles = useMemo(() => {
    const byState = new Map<
      string,
      { total: number; green: number; yellow: number; red: number }
    >();
    for (const a of areas) {
      if (!a.state) continue;
      const cur = byState.get(a.state) ?? {
        total: 0,
        green: 0,
        yellow: 0,
        red: 0,
      };
      cur.total += a.total;
      cur.green += a.green;
      cur.yellow += a.yellow;
      cur.red += a.red;
      byState.set(a.state, cur);
    }
    const maxTotal = Math.max(1, ...[...byState.values()].map((v) => v.total));
    return [...byState.entries()]
      .map(([state, v]) => {
        const est = getEstado(state);
        if (!est) return null;
        const { x, y } = projectToSvg(est.lat, est.lng, MAP_W, MAP_H);
        const r = 6 + (v.total / maxTotal) * 22;
        return { state, x, y, r, level: dominantRisk(v), ...v };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .sort((a, b) => b.r - a.r);
  }, [areas]);

  const topAreas = useMemo(
    () => [...areas].sort((a, b) => b.total - a.total).slice(0, 12),
    [areas],
  );

  const hasData = !!totals && totals.total > 0;

  function downloadCsv() {
    const header = [
      "state",
      "municipality",
      "total",
      "green",
      "yellow",
      "red",
      "last_report",
    ];
    const rows = areas.map((a) =>
      [
        a.state,
        a.municipality,
        a.total,
        a.green,
        a.yellow,
        a.red,
        a.lastReport ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evaluaya-damage-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const pct = (n: number) =>
    totals && totals.total > 0 ? Math.round((n / totals.total) * 100) : 0;

  return (
    <AppShell>
      <header className="mt-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {t("map.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("map.subtitle")}
        </p>
      </header>

      {loading && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      )}

      {!loading && !hasData && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{t("map.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/assess/property">
              {t("map.startCta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Headline counters */}
          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="font-display text-2xl font-extrabold text-primary">
                {totals!.total.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("map.totalAssessments")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="font-display text-2xl font-extrabold text-primary">
                {totals!.areas.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("map.areasLabel")}
              </p>
            </div>
          </section>

          {/* Risk distribution */}
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">{t("map.distribution")}</p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted">
              <div
                style={{ width: `${pct(totals!.red)}%`, backgroundColor: rgb("red") }}
              />
              <div
                style={{
                  width: `${pct(totals!.yellow)}%`,
                  backgroundColor: rgb("yellow"),
                }}
              />
              <div
                style={{
                  width: `${pct(totals!.green)}%`,
                  backgroundColor: rgb("green"),
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <RiskStat label={t("map.high")} value={totals!.red} color={rgb("red")} />
              <RiskStat
                label={t("map.moderate")}
                value={totals!.yellow}
                color={rgb("yellow")}
              />
              <RiskStat
                label={t("map.low")}
                value={totals!.green}
                color={rgb("green")}
              />
            </div>
          </section>

          {/* Bubble map */}
          {stateBubbles.length > 0 && (
            <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold">{t("map.geoTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("map.geoHint")}</p>
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="mt-3 w-full"
                role="img"
                aria-label={t("map.geoTitle")}
              >
                {/* faint reference dots for all estados */}
                {ESTADOS.map((e) => {
                  const { x, y } = projectToSvg(e.lat, e.lng, MAP_W, MAP_H);
                  return (
                    <circle
                      key={e.abbr}
                      cx={x}
                      cy={y}
                      r={1.5}
                      className="fill-border"
                    />
                  );
                })}
                {stateBubbles.map((b) => (
                  <g key={b.state}>
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={b.r}
                      fill={rgb(b.level)}
                      fillOpacity={0.55}
                      stroke={rgb(b.level)}
                      strokeWidth={1.5}
                    />
                    <title>{`${b.state}: ${b.total}`}</title>
                  </g>
                ))}
              </svg>
            </section>
          )}

          {/* Top areas list */}
          <section className="mt-4">
            <h2 className="font-display text-lg font-bold">{t("map.topAreas")}</h2>
            <ul className="mt-3 space-y-2">
              {topAreas.map((a) => {
                const level = dominantRisk(a);
                return (
                  <li
                    key={`${a.state}-${a.municipality}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: rgb(level) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-medium">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        {a.municipality || a.state}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.state} · {a.total} {t("map.reports")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
                      <span style={{ color: rgb("red") }}>{a.red}</span>
                      <span style={{ color: rgb("yellow") }}>{a.yellow}</span>
                      <span style={{ color: rgb("green") }}>{a.green}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Open data download */}
          <section className="mt-6">
            <Button variant="outline" className="w-full" onClick={downloadCsv}>
              <Download className="size-4" />
              {t("map.download")}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {t("map.dataNote")}
            </p>
          </section>
        </>
      )}

      {/* Institution lead capture — always available */}
      <section className="mt-8">
        <InstitutionLeadForm />
      </section>

      {/* CTA to start an assessment */}
      <section className="mt-6">
        <Button asChild size="lg" className="w-full">
          <Link to="/assess/property">
            {t("map.startCta")}
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </section>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        {lang === "es" ? "EvalúaYa" : "EvalúaYa"}
      </p>
    </AppShell>
  );
}

function RiskStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <p className="font-display text-lg font-bold" style={{ color }}>
        {value.toLocaleString()}
      </p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
