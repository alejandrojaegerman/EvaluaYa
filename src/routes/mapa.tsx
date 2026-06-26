import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Download, ImageDown, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { InstitutionLeadForm } from "@/components/InstitutionLeadForm";
import { ShareApp } from "@/components/ShareApp";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import { generateStatsCard, shareImageBlob } from "@/lib/share-card";
import { absoluteUrl } from "@/lib/site";
import {
  getDamageAggregates,
  getDamageTotals,
  type AreaAggregate,
  type DamageTotals,
} from "@/lib/stats.functions";
import {
  ESTADOS,
  estadoSlug,
  getEstado,
  outlinePath,
  projectToSvg,
} from "@/lib/venezuela";

const MAP_OG = absoluteUrl("/og-map.jpg");

export const Route = createFileRoute("/mapa")({
  head: () => {
    const title = "Mapa de daños — EvalúaYa";
    const description =
      "Mapa comunitario de daños estructurales por zona en Venezuela. Datos anónimos y abiertos.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl("/mapa") },
        { property: "og:image", content: MAP_OG },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: MAP_OG },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/mapa") }],
    };
  },
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

/** Treat "Desconocido"/empty/null values as an unspecified location. */
function isUnspecified(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.trim().toLowerCase() === "desconocido";
}

type DisplayArea = {
  key: string;
  title: string;
  subtitle: string | null;
  muniKnown: boolean;
  /** Resolved estado name when known, for linking to its regional page. */
  stateName: string | null;
  total: number;
  green: number;
  yellow: number;
  red: number;
};


const MAP_W = 320;
const MAP_H = 300;

function MapPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
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
        return { state, abbr: est.abbr, x, y, r, level: dominantRisk(v), ...v };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .sort((a, b) => b.r - a.r);
  }, [areas]);

  const topAreas = useMemo<DisplayArea[]>(() => {
    const specific: DisplayArea[] = [];
    const unspecified = {
      total: 0,
      green: 0,
      yellow: 0,
      red: 0,
      lastReport: null as string | null,
    };

    for (const a of areas) {
      const stateKnown = !isUnspecified(a.state);
      const muniKnown = !isUnspecified(a.municipality);

      if (!stateKnown && !muniKnown) {
        unspecified.total += a.total;
        unspecified.green += a.green;
        unspecified.yellow += a.yellow;
        unspecified.red += a.red;
        continue;
      }

      specific.push({
        key: `${a.state}-${a.municipality}`,
        title: muniKnown ? a.municipality : a.state,
        subtitle: muniKnown ? a.state : t("map.unspecifiedMunicipality"),
        muniKnown,
        stateName: stateKnown ? a.state : null,
        total: a.total,
        green: a.green,
        yellow: a.yellow,
        red: a.red,
      });
    }

    specific.sort((x, y) => {
      if (y.total !== x.total) return y.total - x.total;
      // tie-break: rows with a specific municipality rank first
      return Number(y.muniKnown) - Number(x.muniKnown);
    });

    const result = specific.slice(0, 12);

    if (unspecified.total > 0) {
      result.push({
        key: "__unspecified__",
        title: t("map.unspecifiedLocation"),
        subtitle: null,
        muniKnown: false,
        stateName: null,
        total: unspecified.total,
        green: unspecified.green,
        yellow: unspecified.yellow,
        red: unspecified.red,
      });
    }

    return result.slice(0, 12);
  }, [areas, t]);


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

  const [cardBusy, setCardBusy] = useState(false);

  async function shareStats() {
    if (!totals || cardBusy) return;
    setCardBusy(true);
    try {
      const top = topAreas[0];
      const blob = await generateStatsCard({
        total: totals.total,
        red: totals.red,
        yellow: totals.yellow,
        green: totals.green,
        headline: t("map.cardHeadline"),
        topAreaLabel: top
          ? [top.title, top.subtitle].filter(Boolean).join(", ")
          : undefined,

        cta: t("map.cardCta"),
        url: absoluteUrl("/mapa"),
      });
      const outcome = await shareImageBlob(blob, {
        filename: "evaluaya-mapa.png",
        title: "EvalúaYa",
        text: `${t("share.message")} ${absoluteUrl("/mapa")}`,
      });
      if (outcome === "downloaded") toast.success(t("share.imageSaved"));
    } catch {
      toast.error(t("result.genericError"));
    } finally {
      setCardBusy(false);
    }
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
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">{t("map.geoTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("map.geoHint")}</p>
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="mt-3 w-full"
              role="img"
              aria-label={t("map.geoTitle")}
            >
              {/* faint country outline backdrop */}
              <path
                d={outlinePath(MAP_W, MAP_H)}
                className="fill-muted/40 stroke-border"
                strokeWidth={1}
              />
              {/* faint reference dots for all estados */}
              {ESTADOS.map((e) => {
                const { x, y } = projectToSvg(e.lat, e.lng, MAP_W, MAP_H);
                return (
                  <circle
                    key={e.abbr}
                    cx={x}
                    cy={y}
                    r={1.5}
                    className="fill-muted-foreground/40"
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
                  <text
                    x={b.x}
                    y={b.y + b.r + 7}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px] font-semibold"
                  >
                    {b.abbr}
                  </text>
                  <title>{`${b.state}: ${b.total}`}</title>
                </g>
              ))}
            </svg>
            {/* legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
                <span className="size-3 rounded-full bg-muted-foreground/60" aria-hidden />
                {t("map.legendSize")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full" style={{ backgroundColor: rgb("red") }} aria-hidden />
                <span className="size-3 rounded-full" style={{ backgroundColor: rgb("yellow") }} aria-hidden />
                <span className="size-3 rounded-full" style={{ backgroundColor: rgb("green") }} aria-hidden />
                {t("map.legendRisk")}
              </span>
            </div>
          </section>


          {/* Top areas list */}
          <section className="mt-4">
            <h2 className="font-display text-lg font-bold">{t("map.topAreas")}</h2>
            <ul className="mt-3 space-y-2">
              {topAreas.map((a) => {
                const level = dominantRisk(a);
                return (
                  <li
                    key={a.key}
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
                        {a.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.subtitle ? `${a.subtitle} · ` : ""}
                        {a.total} {t("map.reports")}
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

          {/* Share stats image — flywheel */}
          <section className="mt-6">
            <Button
              className="w-full"
              onClick={shareStats}
              disabled={cardBusy}
            >
              <ImageDown className="size-4" />
              {cardBusy ? t("share.generating") : t("share.shareStats")}
            </Button>
          </section>

          {/* Open data download */}
          <section className="mt-4">
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

      {/* Spread the word — flywheel */}
      <ShareApp className="mt-6" />

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
