import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Download,
  HardHat,
  ImageDown,
  LayoutDashboard,
  Lightbulb,
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

import { PhotoEvidencePanel } from "@/components/PhotoEvidencePanel";
import { RiskFactorsPanel } from "@/components/RiskFactorsPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { SeveritySpotlight } from "@/components/SeveritySpotlight";
import { ShareApp } from "@/components/ShareApp";
import { TrendChart } from "@/components/TrendChart";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import { generateStatsCard, shareImageBlob } from "@/lib/share-card";
import { API_BASE, DATA_LICENSE } from "@/lib/open-data";
import { absoluteUrl, withUtm } from "@/lib/site";
import {
  getDataRoom,
  getPhotoStats,
  getRiskFactorsFiltered,
  type AreaAggregate,
  type DamageTotals,
  type PhotoStats,
  type RiskFactors,
  type TimeseriesPoint,
} from "@/lib/stats.functions";
import { rankMunicipios, rankStates } from "@/lib/impact";
import {
  ESTADO_NAMES,
  ESTADOS,
  estadoSlug,
  getEstado,
  municipiosFor,
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

type Translate = (key: string) => string;

/** Human relative-time label for the most recent report, e.g. "hace 2 h". */
function formatUpdated(t: Translate, ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("dataroom.updatedJustNow");
  if (min < 60) return t("dataroom.updatedMinutes").replace("{n}", String(min));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("dataroom.updatedHours").replace("{n}", String(hr));
  const d = Math.floor(hr / 24);
  return t("dataroom.updatedDays").replace("{n}", String(d));
}

/** Media-friendly one-line narrative built from the live totals in scope. */
function buildNarrative(
  t: Translate,
  totals: DamageTotals | null,
  topArea: string | null,
): string {
  if (!totals || totals.total === 0) return "";
  const serious = totals.red + totals.orange;
  const pct = Math.round((serious / totals.total) * 100);
  if (pct < 20) {
    return t("dataroom.narrativeLow").replace("{total}", String(totals.total));
  }
  if (topArea) {
    return t("dataroom.narrativeArea")
      .replace("{total}", String(totals.total))
      .replace("{pct}", String(pct))
      .replace("{area}", topArea);
  }
  return t("dataroom.narrative")
    .replace("{total}", String(totals.total))
    .replace("{pct}", String(pct));
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

  // Available filter options for the active date range (independent of the
  // currently selected state/municipality) so dropdowns only show places that
  // actually have reports.
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableMunicipios, setAvailableMunicipios] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    let active = true;
    const { from, to } = rangeToDates(filters.range);
    getDataRoom({ data: { from, to } })
      .then((res) => {
        if (!active) return;
        const stateSet = new Set<string>();
        const muniMap: Record<string, Set<string>> = {};
        for (const a of res.areas) {
          if (isUnspecified(a.state)) continue;
          stateSet.add(a.state);
          if (!isUnspecified(a.municipality)) {
            (muniMap[a.state] ??= new Set()).add(a.municipality);
          }
        }
        setAvailableStates([...stateSet]);
        setAvailableMunicipios(
          Object.fromEntries(
            Object.entries(muniMap).map(([s, set]) => [s, [...set]]),
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [filters.range]);

  // Drop a selected state/municipality that no longer has records in the range.
  useEffect(() => {
    setFilters((prev) => {
      let next = prev;
      if (prev.state && !availableStates.includes(prev.state)) {
        next = { ...next, state: null, municipality: null };
      } else if (
        prev.municipality &&
        prev.state &&
        !(availableMunicipios[prev.state] ?? []).includes(prev.municipality)
      ) {
        next = { ...next, municipality: null };
      }
      return next === prev ? prev : next;
    });
  }, [availableStates, availableMunicipios]);


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

  // Photo documentation — anonymized counts only, respects active filters.
  const [photoStats, setPhotoStats] = useState<PhotoStats | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setPhotoStats(null);
    setPhotoLoading(true);
    const { from, to } = rangeToDates(filters.range);
    getPhotoStats({
      data: {
        state: filters.state ?? undefined,
        municipality: filters.municipality ?? undefined,
        from,
        to,
      },
    })
      .then((s) => active && setPhotoStats(s))
      .catch(() => {})
      .finally(() => active && setPhotoLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);



  // Severity-weighted ranking so the hardest-hit areas surface first in filters.
  const impactRanking = useMemo(
    () => ({
      featuredStates: rankStates(areas, ESTADO_NAMES),
      featuredMunicipios: rankMunicipios(areas, municipiosFor),
    }),
    [areas],
  );

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

  // Most recent report timestamp across the active scope (for "last updated").
  const lastUpdated = useMemo(() => {
    let max = 0;
    for (const a of areas) {
      if (!a.lastReport) continue;
      const ms = new Date(a.lastReport).getTime();
      if (!Number.isNaN(ms) && ms > max) max = ms;
    }
    return max || null;
  }, [areas]);

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

  const lastUpdatedLabel =
    lastUpdated != null
      ? `${t("dataroom.updated")} ${formatUpdated(t, lastUpdated)}`
      : null;
  const narrative = buildNarrative(t, totals, topAreas[0]?.title ?? null);



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
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          {t("dataroom.eyebrow.briefing")}
        </span>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
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
        <Tabs defaultValue="summary" className="mt-5">
          {/* Executive summary band */}
          <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                {scopeLabel}
              </span>
              {lastUpdatedLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                  <Clock className="size-3.5" aria-hidden />
                  {lastUpdatedLabel}
                </span>
              )}
            </div>

            {narrative && (
              <p className="mt-3 max-w-3xl font-display text-lg font-bold leading-snug md:text-xl">
                {narrative}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={shareStats} disabled={cardBusy} className="sm:flex-none">
                <ImageDown className="size-4" />
                {cardBusy ? t("share.generating") : t("share.shareStats")}
              </Button>
              <Button
                variant="outline"
                onClick={downloadCsv}
                className="sm:flex-none"
              >
                <Download className="size-4" />
                {t("map.download")}
              </Button>
            </div>

            {/* Headline counters */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
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
            </div>
          </section>

          {/* Sticky filters + tab navigation */}
          <div className="sticky top-14 z-20 -mx-4 mt-5 mb-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <div className="hidden md:block">
              <DataRoomFilters
                filters={filters}
                onChange={setFilters}
                availableStates={availableStates}
                availableMunicipios={availableMunicipios}
                featuredStates={impactRanking.featuredStates}
                featuredMunicipios={impactRanking.featuredMunicipios}
              />
            </div>
            <div className="overflow-x-auto md:mt-3">
              <TabsList className="h-auto w-max gap-1 bg-muted/60 p-1">
                <TabsTrigger value="summary" className="gap-1.5">
                  <LayoutDashboard className="size-4" aria-hidden />
                  {t("dataroom.tab.summary")}
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-1.5">
                  <MapIcon className="size-4" aria-hidden />
                  {t("dataroom.tab.map")}
                </TabsTrigger>
                <TabsTrigger value="areas" className="gap-1.5">
                  <MapPin className="size-4" aria-hidden />
                  {t("dataroom.tab.areas")}
                </TabsTrigger>
                <TabsTrigger value="evidence" className="gap-1.5">
                  <Lightbulb className="size-4" aria-hidden />
                  {t("dataroom.tab.evidence")}
                </TabsTrigger>
                <TabsTrigger value="open" className="gap-1.5">
                  <Code2 className="size-4" aria-hidden />
                  {t("dataroom.tab.open")}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Resumen */}
          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <SectionEyebrow
                  eyebrow={t("dataroom.eyebrow.severity")}
                  title={t("map.seriousOrHigh")}
                />
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
                <SectionEyebrow
                  eyebrow={t("dataroom.eyebrow.distribution")}
                  title={t("map.distribution")}
                />
                <RiskGauge
                  green={totals!.green}
                  yellow={totals!.yellow}
                  orange={totals!.orange}
                  red={totals!.red}
                  label={t("map.totalAssessments")}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.trend")}
                title={t("map.trendTitle")}
                hint={t("map.trendSubtitle")}
              />
              <TrendChart points={timeseries} />
            </div>
          </TabsContent>

          {/* Mapa */}
          <TabsContent value="map" className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.map")}
                title={t("data.mapTitle")}
                hint={t("map.interactiveHint")}
              />
              <DamageMap
                bubbles={mapBubbles}
                onSelectState={(slug) =>
                  navigate({ to: "/zona/$estado", params: { estado: slug } })
                }
                fallback={mapFallback}
              />
              <div className="mt-3 grid gap-1.5 rounded-xl bg-muted/40 p-3 text-[11px] sm:grid-cols-2">
                <p className="font-semibold text-foreground sm:col-span-2">
                  {t("map.legendTitle")}
                </p>
                <LegendRow color={rgb("green")} label={t("map.legendGreen")} />
                <LegendRow color={rgb("yellow")} label={t("map.legendYellow")} />
                <LegendRow color={rgb("orange")} label={t("map.legendOrange")} />
                <LegendRow color={rgb("red")} label={t("map.legendRed")} />
              </div>
            </div>
          </TabsContent>

          {/* Zonas */}
          <TabsContent value="areas" className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.areas")}
                title={t("map.topAreas")}
              />
              {topAreasList}
            </div>
          </TabsContent>

          {/* Evidencia */}
          <TabsContent value="evidence" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.why")}
                title={t("map.whyTitle")}
                hint={t("map.whySubtitle")}
              />
              <RiskFactorsPanel factors={nationalFactors} loading={whyLoading} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.photos")}
                title={t("photos.title")}
                hint={t("photos.subtitle")}
              />
              <PhotoEvidencePanel stats={photoStats} loading={photoLoading} />
            </div>
          </TabsContent>

          {/* Datos abiertos */}
          <TabsContent value="open" className="mt-4 space-y-4">
            <DataDictionary />

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SectionEyebrow
                eyebrow={t("dataroom.eyebrow.export")}
                title={t("data.export")}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={shareStats} disabled={cardBusy}>
                  <ImageDown className="size-4" />
                  {cardBusy ? t("share.generating") : t("share.shareStats")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadCsv}
                >
                  <Download className="size-4" />
                  {t("map.download")}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("map.dataNote")}
              </p>
            </section>

            <OpenDataSection />
          </TabsContent>
        </Tabs>
      )}

      {/* Closing band: share + CTA */}
      <section className="mt-10">
        <div className="flex flex-col gap-4">
          <ShareApp />
          <Button asChild size="lg" className="w-full">
            <Link to="/assess/property">
              {t("map.startCta")}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <HardHat className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t("engineers.mapNote")}</span>
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function SectionEyebrow({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </span>
      <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function OpenDataSection() {
  const { t } = useLang();
  const endpoints: Array<{ path: string; label: string }> = [
    { path: "/api/public/v1/aggregates.json", label: t("data.api.ep.aggregates") },
    { path: "/api/public/v1/totals.json", label: t("data.api.ep.totals") },
    { path: "/api/public/v1/timeseries.json", label: t("data.api.ep.timeseries") },
    { path: "/api/public/v1/risk-factors.json", label: t("data.api.ep.riskFactors") },
    { path: "/api/public/v1/methodology.json", label: t("data.api.ep.methodology") },
  ];
  const example = `${API_BASE}/aggregates.json?state=Miranda`;
  const copyAttribution = () => {
    navigator.clipboard
      ?.writeText(t("data.api.attribution"))
      .then(() => toast.success(t("data.api.attributionLabel")))
      .catch(() => {});
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Code2 className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="font-display text-lg font-bold">{t("data.api.title")}</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("data.api.body")}
      </p>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("data.api.endpointsTitle")}
      </h3>
      <ul className="mt-2 space-y-2">
        {endpoints.map((ep) => (
          <li
            key={ep.path}
            className="rounded-xl border border-border bg-muted/30 p-3"
          >
            <a
              href={ep.path}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-xs text-primary hover:underline"
            >
              {ep.path}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">{ep.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("data.api.exampleLabel")}
        </p>
        <code className="mt-1 block break-all font-mono text-xs">{example}</code>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("data.api.licenseLabel")}
          </p>
          <a
            href={DATA_LICENSE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {t("data.api.license")}
          </a>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("data.api.attributionLabel")}
          </p>
          <button
            type="button"
            onClick={copyAttribution}
            className="mt-1 flex w-full items-start gap-1.5 text-left text-sm hover:text-primary"
          >
            <Copy className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t("data.api.attribution")}</span>
          </button>
        </div>
      </div>

      <Button asChild size="lg" variant="outline" className="mt-4 w-full">
        <a
          href="/api/public/v1/index.json"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Code2 className="size-4" aria-hidden />
          {t("data.api.viewManifest")}
        </a>
      </Button>
    </section>
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

function DataDictionary() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const levels: Array<{ level: RiskKey; term: string; def: string }> = [
    { level: "green", term: t("map.low"), def: t("data.dict.low.def") },
    { level: "yellow", term: t("map.moderate"), def: t("data.dict.moderate.def") },
    { level: "orange", term: t("map.urgent"), def: t("data.dict.serious.def") },
    { level: "red", term: t("map.high"), def: t("data.dict.high.def") },
  ];

  const terms: Array<{ term: string; def: string }> = [
    {
      term: t("data.dict.evaluacion.term"),
      def: t("data.dict.evaluacion.def"),
    },
    { term: t("data.dict.zonas.term"), def: t("data.dict.zonas.def") },
    {
      term: t("data.dict.seriousOrHigh.term"),
      def: t("data.dict.seriousOrHigh.def"),
    },
    { term: t("data.dict.verified.term"), def: t("data.dict.verified.def") },
  ];

  return (
    <section className="mt-6">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                {t("data.dict.title")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("data.dict.intro")}
              </span>
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border p-4">
              <dl className="space-y-3">
                {levels.map((l) => (
                  <div key={l.level} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: rgb(l.level) }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <dt className="text-sm font-semibold">{l.term}</dt>
                      <dd className="text-xs leading-relaxed text-muted-foreground">
                        {l.def}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <dl className="mt-4 space-y-3 border-t border-border pt-4">
                {terms.map((tm) => (
                  <div key={tm.term}>
                    <dt className="text-sm font-semibold">{tm.term}</dt>
                    <dd className="text-xs leading-relaxed text-muted-foreground">
                      {tm.def}
                    </dd>
                  </div>
                ))}
              </dl>

              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/metodologia">
                  {t("data.dict.more")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>
  );
}
