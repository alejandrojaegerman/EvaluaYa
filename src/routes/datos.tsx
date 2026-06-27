import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  ImageDown,
  Map as MapIcon,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CountUp } from "@/components/CountUp";
import { DamageMap, type MapBubble } from "@/components/DamageMap";
import {
  DataRoomFilters,
  DEFAULT_FILTERS,
  rangeToDates,
  type DataFilters,
} from "@/components/DataRoomFilters";
import { InstitutionLeadForm } from "@/components/InstitutionLeadForm";
import { RiskFactorsPanel } from "@/components/RiskFactorsPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { SeveritySpotlight } from "@/components/SeveritySpotlight";
import { ShareApp } from "@/components/ShareApp";
import { TrendChart } from "@/components/TrendChart";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import { generateStatsCard, shareImageBlob } from "@/lib/share-card";
import { absoluteUrl, withUtm } from "@/lib/site";
import {
  getDataRoom,
  getRiskFactorsFiltered,
  type AreaAggregate,
  type DamageTotals,
  type RiskFactors,
  type TimeseriesPoint,
} from "@/lib/stats.functions";
import {
  ESTADOS,
  estadoSlug,
  getEstado,
  outlinePath,
  projectToSvg,
  resolveMunicipio,
} from "@/lib/venezuela";

const MAP_OG = absoluteUrl("/og-map.jpg");

export const Route = createFileRoute("/datos")({
  head: () => {
    const title = "Sala de datos — EvalúaYa";
    const description =
      "Explora los daños estructurales reportados en Venezuela con filtros por zona y período. Datos anónimos y abiertos para autoridades y medios.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl("/datos") },
        { property: "og:image", content: MAP_OG },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: MAP_OG },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/datos") }],
    };
  },
  component: DataRoomPage,
});

type RiskKey = "red" | "orange" | "yellow" | "green";

function dominantRisk(a: {
  green: number;
  yellow: number;
  orange: number;
  red: number;
}): RiskKey {
  if (a.red >= a.orange && a.red >= a.yellow && a.red >= a.green) return "red";
  if (a.orange >= a.yellow && a.orange >= a.green) return "orange";
  if (a.yellow >= a.green) return "yellow";
  return "green";
}

function rgb(level: RiskKey): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

function isUnspecified(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.trim().toLowerCase() === "desconocido";
}

type DisplayArea = {
  key: string;
  title: string;
  subtitle: string | null;
  muniKnown: boolean;
  stateName: string | null;
  paramState: string;
  paramMunicipality: string | null;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
};

const MAP_W = 320;
const MAP_H = 300;

function DataRoomPage() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<DataFilters>(DEFAULT_FILTERS);
  const [totals, setTotals] = useState<DamageTotals | null>(null);
  const [areas, setAreas] = useState<AreaAggregate[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const { from, to } = rangeToDates(filters.range);
    getDataRoom({
      data: {
        state: filters.state ?? undefined,
        municipality: filters.municipality ?? undefined,
        from,
        to,
      },
    })
      .then((res) => {
        if (!active) return;
        setTotals(res.totals);
        setAreas(res.areas);
        setTimeseries(res.timeseries);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  // National "why" — lazy on reveal, respects active filters.
  const [nationalFactors, setNationalFactors] = useState<RiskFactors | null>(
    null,
  );
  const [whyLoading, setWhyLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setNationalFactors(null);
    setWhyLoading(true);
    const { from, to } = rangeToDates(filters.range);
    getRiskFactorsFiltered({
      data: {
        state: filters.state ?? undefined,
        municipality: filters.municipality ?? undefined,
        from,
        to,
      },
    })
      .then((f) => active && setNationalFactors(f))
      .catch(() => {})
      .finally(() => active && setWhyLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  const stateBubbles = useMemo(() => {
    const byState = new Map<
      string,
      { total: number; green: number; yellow: number; orange: number; red: number }
    >();
    for (const a of areas) {
      if (!a.state) continue;
      const cur = byState.get(a.state) ?? {
        total: 0,
        green: 0,
        yellow: 0,
        orange: 0,
        red: 0,
      };
      cur.total += a.total;
      cur.green += a.green;
      cur.yellow += a.yellow;
      cur.orange += a.orange;
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

  const mapBubbles = useMemo<MapBubble[]>(() => {
    const grouped = new Map<
      string,
      {
        lat: number;
        lng: number;
        level: "municipio" | "estado";
        name: string;
        stateName: string;
        total: number;
        green: number;
        yellow: number;
        orange: number;
        red: number;
        verified: number;
      }
    >();
    for (const a of areas) {
      const resolved = resolveMunicipio(a.state, a.municipality);
      if (!resolved) continue;
      const key = `${resolved.stateName}|${resolved.name}|${resolved.level}`;
      const cur =
        grouped.get(key) ??
        {
          lat: resolved.lat,
          lng: resolved.lng,
          level: resolved.level,
          name: resolved.name,
          stateName: resolved.stateName,
          total: 0,
          green: 0,
          yellow: 0,
          orange: 0,
          red: 0,
          verified: 0,
        };
      cur.total += a.total;
      cur.green += a.green;
      cur.yellow += a.yellow;
      cur.orange += a.orange;
      cur.red += a.red;
      cur.verified += a.verified;
      grouped.set(key, cur);
    }
    return [...grouped.entries()]
      .map(([key, g]) => ({
        id: key,
        lat: g.lat,
        lng: g.lng,
        level: g.level,
        name: g.name,
        stateName: g.stateName,
        stateSlug: estadoSlug(g.stateName),
        total: g.total,
        green: g.green,
        yellow: g.yellow,
        orange: g.orange,
        red: g.red,
        verified: g.verified,
        dominant: dominantRisk(g),
      }))
      .sort((x, y) => y.total - x.total);
  }, [areas]);

  const topAreas = useMemo<DisplayArea[]>(() => {
    const specific: DisplayArea[] = [];
    const unspecified = {
      total: 0,
      green: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    };
    for (const a of areas) {
      const stateKnown = !isUnspecified(a.state);
      const muniKnown = !isUnspecified(a.municipality);
      if (!stateKnown && !muniKnown) {
        unspecified.total += a.total;
        unspecified.green += a.green;
        unspecified.yellow += a.yellow;
        unspecified.orange += a.orange;
        unspecified.red += a.red;
        continue;
      }
      specific.push({
        key: `${a.state}-${a.municipality}`,
        title: muniKnown ? a.municipality : a.state,
        subtitle: muniKnown ? a.state : t("map.unspecifiedMunicipality"),
        muniKnown,
        stateName: stateKnown ? a.state : null,
        paramState: a.state,
        paramMunicipality: muniKnown ? a.municipality : null,
        total: a.total,
        green: a.green,
        yellow: a.yellow,
        orange: a.orange,
        red: a.red,
      });
    }
    specific.sort((x, y) => {
      if (y.total !== x.total) return y.total - x.total;
      return Number(y.muniKnown) - Number(x.muniKnown);
    });
    const result = specific.slice(0, 20);
    if (unspecified.total > 0) {
      result.push({
        key: "__unspecified__",
        title: t("map.unspecifiedLocation"),
        subtitle: null,
        muniKnown: false,
        stateName: null,
        paramState: "Desconocido",
        paramMunicipality: "Desconocido",
        ...unspecified,
      });
    }
    return result;
  }, [areas, t]);

  const hasData = !!totals && totals.total > 0;

  // Per-area "why" drill-down.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [factorsCache, setFactorsCache] = useState<Record<string, RiskFactors>>(
    {},
  );
  const [factorsLoading, setFactorsLoading] = useState<string | null>(null);

  function toggleWhy(area: DisplayArea) {
    if (expandedKey === area.key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(area.key);
    if (factorsCache[area.key]) return;
    setFactorsLoading(area.key);
    const { from, to } = rangeToDates(filters.range);
    getRiskFactorsFiltered({
      data: {
        state: area.paramState,
        municipality: area.paramMunicipality ?? undefined,
        from,
        to,
      },
    })
      .then((f) => setFactorsCache((prev) => ({ ...prev, [area.key]: f })))
      .catch(() => {})
      .finally(() =>
        setFactorsLoading((cur) => (cur === area.key ? null : cur)),
      );
  }

  function downloadCsv() {
    const header = [
      "state",
      "municipality",
      "total",
      "green",
      "yellow",
      "orange",
      "red",
      "verified",
      "last_report",
    ];
    const rows = areas.map((a) =>
      [
        a.state,
        a.municipality,
        a.total,
        a.green,
        a.yellow,
        a.orange,
        a.red,
        a.verified,
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
        orange: totals.orange,
        yellow: totals.yellow,
        green: totals.green,
        headline: t("map.cardHeadline"),
        topAreaLabel: top
          ? [top.title, top.subtitle].filter(Boolean).join(", ")
          : undefined,
        cta: t("map.cardCta"),
        url: absoluteUrl("/datos"),
      });
      const outcome = await shareImageBlob(blob, {
        filename: "evaluaya-datos.png",
        title: "EvalúaYa",
        text: `${t("share.message")} ${withUtm("/datos", {
          source: "image",
          medium: "share",
          campaign: "data",
        })}`,
      });
      if (outcome === "downloaded") toast.success(t("share.imageSaved"));
    } catch {
      toast.error(t("result.genericError"));
    } finally {
      setCardBusy(false);
    }
  }

  const scopeLabel =
    [filters.municipality, filters.state].filter(Boolean).join(", ") ||
    t("data.scopeNational");

  const mapFallback = (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="w-full"
      role="img"
      aria-label={t("data.mapTitle")}
    >
      <path
        d={outlinePath(MAP_W, MAP_H)}
        className="fill-muted/40 stroke-border"
        strokeWidth={1}
      />
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
          <title>{`${b.state}: ${b.total}`}</title>
        </g>
      ))}
    </svg>
  );

  const topAreasList = (
    <ul className="mt-3 space-y-2">
      {topAreas.map((a) => {
        const level = dominantRisk(a);
        const linkable = a.stateName && getEstado(a.stateName);
        const expanded = expandedKey === a.key;
        const inner = (
          <>
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: rgb(level) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-medium">
                <MapPin
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {a.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {a.subtitle ? `${a.subtitle} · ` : ""}
                {a.total} {t("map.reports")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
              <span style={{ color: rgb("red") }}>{a.red}</span>
              <span style={{ color: rgb("orange") }}>{a.orange}</span>
              <span style={{ color: rgb("yellow") }}>{a.yellow}</span>
              <span style={{ color: rgb("green") }}>{a.green}</span>
            </div>
            {linkable && (
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            )}
          </>
        );
        return (
          <li
            key={a.key}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            {linkable ? (
              <Link
                to="/zona/$estado"
                params={{ estado: estadoSlug(a.stateName!) }}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-3">{inner}</div>
            )}
            <button
              type="button"
              onClick={() => toggleWhy(a)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-center gap-1 border-t border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-accent/40"
            >
              {expanded ? t("factors.hideWhy") : t("factors.why")}
              <ChevronDown
                className={`size-3.5 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            {expanded && (
              <div className="border-t border-border bg-muted/30 p-3">
                <RiskFactorsPanel
                  factors={factorsCache[a.key] ?? null}
                  loading={factorsLoading === a.key}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <AppShell wide>
      <header className="mt-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          {t("data.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("data.subtitle")}
        </p>
      </header>

      {/* Mobile-only note nudging to desktop + link to the map */}
      <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 md:hidden">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("data.mobileNote")}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/mapa">
            <MapIcon className="size-4" />
            {t("data.openMap")}
          </Link>
        </Button>
      </div>

      {/* Desktop filter bar */}
      <div className="mt-5 hidden md:block">
        <DataRoomFilters filters={filters} onChange={setFilters} />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("data.activeScope")}: <span className="font-semibold">{scopeLabel}</span>
        </p>
      </div>

      {loading && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      )}

      {!loading && !hasData && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{t("data.noResults")}</p>
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
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={totals!.total} label={t("map.totalAssessments")} />
            <Stat value={totals!.areas} label={t("map.areasLabel")} />
            <Stat
              value={totals!.red + totals!.orange}
              label={t("map.seriousOrHigh")}
              color={rgb("red")}
            />
            <Stat
              value={totals!.verified}
              label={t("map.verified")}
              color={rgb("green")}
            />
          </section>

          {/* Desktop dashboard: map + charts side by side */}
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold">{t("data.mapTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("map.interactiveHint")}
              </p>
              <div className="mt-3">
                <DamageMap
                  bubbles={mapBubbles}
                  onSelectState={(slug) =>
                    navigate({ to: "/zona/$estado", params: { estado: slug } })
                  }
                  fallback={mapFallback}
                />
              </div>
              <div className="mt-3 space-y-1.5 rounded-xl bg-muted/40 p-3 text-[11px]">
                <p className="font-semibold text-foreground">
                  {t("map.legendTitle")}
                </p>
                <LegendRow color={rgb("green")} label={t("map.legendGreen")} />
                <LegendRow color={rgb("yellow")} label={t("map.legendYellow")} />
                <LegendRow color={rgb("orange")} label={t("map.legendOrange")} />
                <LegendRow color={rgb("red")} label={t("map.legendRed")} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <SeveritySpotlight
                  total={totals!.total}
                  green={totals!.green}
                  yellow={totals!.yellow}
                  orange={totals!.orange}
                  red={totals!.red}
                  topAreaLabel={topAreas[0]?.title ?? null}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">{t("map.distribution")}</p>
                <div className="mt-3">
                  <RiskGauge
                    green={totals!.green}
                    yellow={totals!.yellow}
                    orange={totals!.orange}
                    red={totals!.red}
                    label={t("map.totalAssessments")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Trend over time */}
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">{t("map.trendTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("map.trendSubtitle")}
            </p>
            <div className="mt-3">
              <TrendChart points={timeseries} />
            </div>
          </section>

          {/* Top areas + why */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-bold">
                {t("map.topAreas")}
              </h2>
              {topAreasList}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">
                {t("map.whyTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("map.whySubtitle")}
              </p>
              <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <RiskFactorsPanel
                  factors={nationalFactors}
                  loading={whyLoading}
                />
              </div>
            </div>
          </section>

          {/* Export & share */}
          <section className="mt-6">
            <h2 className="font-display text-lg font-bold">{t("data.export")}</h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                onClick={shareStats}
                disabled={cardBusy}
              >
                <ImageDown className="size-4" />
                {cardBusy ? t("share.generating") : t("share.shareStats")}
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadCsv}>
                <Download className="size-4" />
                {t("map.download")}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("map.dataNote")}
            </p>
          </section>
        </>
      )}

      {/* Institution lead capture */}
      <section className="mt-8 md:max-w-xl">
        <InstitutionLeadForm />
      </section>

      <ShareApp className="mt-6 md:max-w-xl" />

      <section className="mt-6 md:max-w-xl">
        <Button asChild size="lg" className="w-full">
          <Link to="/assess/property">
            {t("map.startCta")}
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </section>
    </AppShell>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p
        className="font-display text-2xl font-extrabold text-primary"
        style={color ? { color } : undefined}
      >
        <CountUp value={value} />
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-start gap-1.5 text-muted-foreground">
      <span
        className="mt-0.5 size-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </p>
  );
}
