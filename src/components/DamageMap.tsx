import { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";

export type RiskKey = "red" | "orange" | "yellow" | "green";

export type MapBubble = {
  /** stable id */
  id: string;
  lat: number;
  lng: number;
  /** "municipio" when resolved to a municipality, "estado" otherwise */
  level: "municipio" | "estado";
  /** primary label shown in the info window (municipio or estado name) */
  name: string;
  /** estado name, used for navigation */
  stateName: string;
  /** estado slug for routing */
  stateSlug: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  /** number of engineer-verified (professional) reports in this area */
  verified?: number;
  dominant: RiskKey;
};

function hex(level: RiskKey): string {
  const [r, g, b] = RISK_HEX[level];
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const VENEZUELA_CENTER: [number, number] = [8.0, -66.0];

// Keyless open basemap — CARTO "Positron" light. Renders on any domain with no
// API key or referrer restriction. Attribution shown in the map corner.
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type Props = {
  bubbles: MapBubble[];
  onSelectState: (slug: string) => void;
  /** rendered instead of the map when the map can't load */
  fallback: React.ReactNode;
};

export function DamageMap({ bubbles, onSelectState, fallback }: Props) {
  const { t, lang } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const overlaysRef = useRef<L.Circle[]>([]);
  const onSelectRef = useRef(onSelectState);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // keep the latest callback without re-initializing the map
  useEffect(() => {
    onSelectRef.current = onSelectState;
  }, [onSelectState]);

  // Initialize the map once (Leaflet is dynamically imported so SSR never
  // touches window/document).
  useEffect(() => {
    let cancelled = false;
    import("leaflet")
      .then((mod) => {
        const leaflet = (mod.default ?? mod) as typeof L;
        if (cancelled || !containerRef.current || mapRef.current) return;
        leafletRef.current = leaflet;
        const map = leaflet.map(containerRef.current, {
          center: VENEZUELA_CENTER,
          zoom: 6,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
        });
        leaflet
          .tileLayer(TILE_URL, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 19,
            detectRetina: true,
          })
          .addTo(map);
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw / redraw bubbles whenever data, readiness, or language changes.
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !leaflet || !map || bubbles.length === 0) return;

    // clear previous overlays
    for (const c of overlaysRef.current) c.remove();
    overlaysRef.current = [];

    const maxTotal = Math.max(1, ...bubbles.map((b) => b.total));
    const points: [number, number][] = [];

    for (const b of bubbles) {
      const color = hex(b.dominant);
      const hasVerified = (b.verified ?? 0) > 0;
      // radius in meters; scaled by share of the max, with a sane floor/ceiling
      const radius = 8000 + (b.total / maxTotal) * 55000;
      const circle = leaflet.circle([b.lat, b.lng], {
        radius,
        color,
        opacity: 0.9,
        // Areas with at least one engineer-verified report get a bolder solid
        // ring; self-reported-only areas use a thinner dashed ring.
        weight: hasVerified ? 3 : 1.5,
        dashArray: hasVerified ? undefined : "4 3",
        fillColor: color,
        fillOpacity: 0.45,
      });

      const riskLabel =
        b.dominant === "red"
          ? t("map.high")
          : b.dominant === "orange"
            ? t("map.urgent")
            : b.dominant === "yellow"
              ? t("map.moderate")
              : t("map.low");

      const html = `
        <div style="font-family:system-ui,sans-serif;min-width:160px;line-height:1.4">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px">${escapeHtml(
            b.name,
          )}</div>
          ${
            b.level === "estado"
              ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px">${escapeHtml(
                  t("map.atState"),
                )}</div>`
              : `<div style="font-size:11px;color:#6b7280;margin-bottom:4px">${escapeHtml(
                  b.stateName,
                )}</div>`
          }
          <div style="font-size:12px;margin-bottom:2px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};margin-right:5px"></span>
            ${escapeHtml(riskLabel)}
          </div>
          <div style="font-size:12px;color:#374151">
            <strong>${b.total}</strong> ${escapeHtml(t("map.reports"))}
            &nbsp;·&nbsp;
            <span style="color:${hex("red")}">${b.red}</span> /
            <span style="color:${hex("orange")}">${b.orange}</span> /
            <span style="color:${hex("yellow")}">${b.yellow}</span> /
            <span style="color:${hex("green")}">${b.green}</span>
          </div>
          ${
            hasVerified
              ? `<div style="font-size:11px;color:#0f3443;margin-top:4px;font-weight:600">✓ ${b.verified} ${escapeHtml(
                  t("map.verified"),
                )}</div>`
              : ""
          }
          <button data-zone="${escapeHtml(
            b.stateSlug,
          )}" style="margin-top:8px;font-size:12px;font-weight:600;color:#0f3443;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline">
            ${escapeHtml(t("map.viewZone"))} →
          </button>`;

      circle.bindPopup(html, { minWidth: 170 });
      circle.on("popupopen", () => {
        const btn = document.querySelector<HTMLButtonElement>(
          `button[data-zone="${b.stateSlug}"]`,
        );
        btn?.addEventListener(
          "click",
          () => onSelectRef.current(b.stateSlug),
          { once: true },
        );
      });

      circle.addTo(map);
      overlaysRef.current.push(circle);
      points.push([b.lat, b.lng]);
    }

    if (points.length > 0) {
      const bounds = leaflet.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
    }
    // re-run when language changes so popups use the new locale text
  }, [status, bubbles, t, lang]);

  if (status === "error") {
    return (
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          {t("map.mapUnavailable")}
        </p>
        {fallback}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[340px] w-full overflow-hidden rounded-xl border border-border bg-muted/40"
        role="application"
        aria-label={t("map.geoTitle")}
      />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("map.mapLoading")}</p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
